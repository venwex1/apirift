import { createHash } from "crypto";
import { withRetry } from "@/lib/errors";

/**
 * Source fetching and entry extraction. Deterministic, dependency-free
 * parsing: RSS/Atom via regex-free tag scanning, JSON feeds via shape
 * detection, HTML via heading extraction. The LLM classifies; it never
 * fetches or parses. Cheap, auditable, and immune to prompt injection from
 * page content at the extraction layer.
 */

export interface ExtractedEntry {
  externalKey: string;
  title: string;
  url: string | null;
  publishedAt: Date | null;
  excerpt: string;
}

export function sha256(input: string): string {
  return createHash("sha256").update(input).digest("hex");
}

const FETCH_TIMEOUT_MS = 20_000;
const MAX_BODY_BYTES = 2_000_000;
const MAX_ENTRIES_PER_POLL = 25;

export async function fetchSourceBody(url: string): Promise<string> {
  return withRetry(
    async () => {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
      try {
        const res = await fetch(url, {
          signal: controller.signal,
          headers: {
            "user-agent":
              "UpstreamBot/1.0 (+https://upstream.watch/bot; monitoring public changelogs)",
            accept: "application/rss+xml, application/atom+xml, application/json, text/html;q=0.9",
          },
          redirect: "follow",
        });
        if (!res.ok) throw new Error(`HTTP ${res.status} from ${url}`);
        const text = await res.text();
        return text.slice(0, MAX_BODY_BYTES);
      } finally {
        clearTimeout(timer);
      }
    },
    { attempts: 2, baseDelayMs: 500, label: `fetch:${url}` }
  );
}

function textBetween(haystack: string, open: string, close: string): string | null {
  const start = haystack.indexOf(open);
  if (start === -1) return null;
  const end = haystack.indexOf(close, start + open.length);
  if (end === -1) return null;
  return haystack.slice(start + open.length, end);
}

function stripTags(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function parseDate(value: string | null): Date | null {
  if (value === null) return null;
  const date = new Date(value.trim());
  return Number.isNaN(date.getTime()) ? null : date;
}

function splitBlocks(body: string, tag: string): string[] {
  const blocks: string[] = [];
  const open = `<${tag}`;
  const close = `</${tag}>`;
  let cursor = 0;
  while (blocks.length < MAX_ENTRIES_PER_POLL) {
    const start = body.indexOf(open, cursor);
    if (start === -1) break;
    const end = body.indexOf(close, start);
    if (end === -1) break;
    blocks.push(body.slice(start, end));
    cursor = end + close.length;
  }
  return blocks;
}

function extractRss(body: string): ExtractedEntry[] {
  const items = [...splitBlocks(body, "item"), ...splitBlocks(body, "entry")];
  const entries: ExtractedEntry[] = [];
  for (const item of items.slice(0, MAX_ENTRIES_PER_POLL)) {
    const title = stripTags(textBetween(item, "<title", "</title>")?.replace(/^[^>]*>/, "") ?? "");
    if (title.length === 0) continue;
    // RSS: <link>url</link>. Atom: <link href="url"/>.
    const rssLink = stripTags(textBetween(item, "<link>", "</link>") ?? "");
    const hrefMatch = item.match(/<link[^>]*href="([^"]+)"/);
    const url = rssLink.startsWith("http") ? rssLink : hrefMatch?.[1] ?? null;
    const published =
      textBetween(item, "<pubDate>", "</pubDate>") ??
      textBetween(item, "<published>", "</published>") ??
      textBetween(item, "<updated>", "</updated>");
    const description =
      textBetween(item, "<description>", "</description>") ??
      textBetween(item, "<summary", "</summary>")?.replace(/^[^>]*>/, "") ??
      textBetween(item, "<content", "</content>")?.replace(/^[^>]*>/, "") ??
      "";
    entries.push({
      externalKey: sha256(`${url ?? ""}::${title}`),
      title: title.slice(0, 300),
      url,
      publishedAt: parseDate(published),
      excerpt: stripTags(description).slice(0, 4000) || title,
    });
  }
  return entries;
}

interface JsonFeedItem {
  id?: string | number;
  title?: string;
  url?: string;
  date_published?: string;
  content_text?: string;
  content_html?: string;
  summary?: string;
}

function extractJson(body: string): ExtractedEntry[] {
  let parsed: unknown;
  try {
    parsed = JSON.parse(body);
  } catch {
    return [];
  }
  const items: unknown =
    typeof parsed === "object" && parsed !== null && "items" in parsed
      ? (parsed as { items: unknown }).items // safe: "items" presence checked on the line above
      : parsed;
  if (!Array.isArray(items)) return [];

  const entries: ExtractedEntry[] = [];
  for (const rawItem of items.slice(0, MAX_ENTRIES_PER_POLL)) {
    if (typeof rawItem !== "object" || rawItem === null) continue;
    const item = rawItem as JsonFeedItem; // safe: object shape checked above; every field re-validated below
    const title = typeof item.title === "string" ? item.title.trim() : "";
    if (title.length === 0) continue;
    const url = typeof item.url === "string" ? item.url : null;
    const content =
      item.content_text ?? (item.content_html !== undefined ? stripTags(item.content_html) : undefined) ?? item.summary ?? "";
    entries.push({
      externalKey: sha256(`${url ?? String(item.id ?? "")}::${title}`),
      title: title.slice(0, 300),
      url,
      publishedAt: parseDate(item.date_published ?? null),
      excerpt: content.slice(0, 4000) || title,
    });
  }
  return entries;
}

/**
 * HTML fallback: treat h2/h3 headings as entry titles and the text until the
 * next heading as the excerpt. Coarse but effective for changelog pages, and
 * always paired with content-hash short-circuiting so unchanged pages cost
 * one HEAD-sized fetch and zero parsing.
 */
function extractHtml(body: string, baseUrl: string): ExtractedEntry[] {
  const headingPattern = /<h[23][^>]*>([\s\S]*?)<\/h[23]>/gi;
  const entries: ExtractedEntry[] = [];
  const matches = [...body.matchAll(headingPattern)].slice(0, MAX_ENTRIES_PER_POLL);
  for (let i = 0; i < matches.length; i++) {
    const match = matches[i];
    if (match === undefined) continue;
    const title = stripTags(match[1] ?? "");
    if (title.length < 4) continue;
    const start = (match.index ?? 0) + match[0].length;
    const nextMatch = matches[i + 1];
    const end = nextMatch?.index ?? Math.min(start + 3000, body.length);
    const excerpt = stripTags(body.slice(start, end)).slice(0, 4000);
    entries.push({
      externalKey: sha256(`${baseUrl}::${title}`),
      title: title.slice(0, 300),
      url: baseUrl,
      publishedAt: null,
      excerpt: excerpt || title,
    });
  }
  return entries;
}

export function extractEntries(
  type: "RSS" | "JSON" | "HTML",
  body: string,
  sourceUrl: string
): ExtractedEntry[] {
  switch (type) {
    case "RSS":
      return extractRss(body);
    case "JSON":
      return extractJson(body);
    case "HTML":
      return extractHtml(body, sourceUrl);
  }
}
