import { readFileSync, readdirSync } from "fs";
import { join } from "path";
import matter from "gray-matter";

/**
 * Filesystem-backed blog. Posts are MDX files in content/blog, read at build
 * time (all blog routes are statically generated). No CMS, no database —
 * zero ongoing effort, zero runtime failure modes.
 */
export interface PostMeta {
  slug: string;
  title: string;
  description: string;
  date: string;
  readingMinutes: number;
}

export interface Post extends PostMeta {
  content: string;
}

const BLOG_DIR = join(process.cwd(), "content", "blog");

function parsePost(filename: string): Post | null {
  try {
    const raw = readFileSync(join(BLOG_DIR, filename), "utf-8");
    const { data, content } = matter(raw);
    const title = typeof data["title"] === "string" ? data["title"] : null;
    const description =
      typeof data["description"] === "string" ? data["description"] : null;
    const date = typeof data["date"] === "string" ? data["date"] : null;
    if (title === null || description === null || date === null) return null;
    return {
      slug: filename.replace(/\.mdx$/, ""),
      title,
      description,
      date,
      readingMinutes: Math.max(1, Math.round(content.split(/\s+/).length / 220)),
      content,
    };
  } catch {
    return null;
  }
}

export function getAllPosts(): PostMeta[] {
  let files: string[];
  try {
    files = readdirSync(BLOG_DIR).filter((file) => file.endsWith(".mdx"));
  } catch {
    return [];
  }
  return files
    .map(parsePost)
    .filter((post): post is Post => post !== null)
    .map(({ content: _content, ...meta }) => meta)
    .sort((a, b) => b.date.localeCompare(a.date));
}

export function getPost(slug: string): Post | null {
  if (!/^[a-z0-9-]+$/.test(slug)) return null;
  return parsePost(`${slug}.mdx`);
}
