import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const isProtectedRoute = createRouteMatcher([
  "/dashboard(.*)",
  "/providers(.*)",
  "/impact(.*)",
  "/alerts(.*)",
  "/settings(.*)",
  "/referral(.*)",
]);

// Webhooks authenticate by signature; crons by secret. Rate limiting either
// would only add a failure mode.
const isExemptApi = createRouteMatcher(["/api/webhooks(.*)", "/api/cron(.*)", "/api/health"]);
const isApiRoute = createRouteMatcher(["/api(.*)"]);

const ratelimit =
  process.env.UPSTASH_REDIS_REST_URL !== undefined &&
  process.env.UPSTASH_REDIS_REST_TOKEN !== undefined
    ? new Ratelimit({
        redis: new Redis({
          url: process.env.UPSTASH_REDIS_REST_URL,
          token: process.env.UPSTASH_REDIS_REST_TOKEN,
        }),
        limiter: Ratelimit.slidingWindow(60, "60 s"),
        prefix: "rl:api",
      })
    : null;

export default clerkMiddleware(async (auth, req) => {
  if (isApiRoute(req) && !isExemptApi(req) && ratelimit !== null) {
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
    try {
      const { success } = await ratelimit.limit(ip);
      if (!success) {
        return NextResponse.json(
          {
            error: {
              code: "RATE_LIMITED",
              message: "Too many requests. Wait a minute and try again.",
              requestId: crypto.randomUUID(),
            },
          },
          { status: 429 }
        );
      }
    } catch {
      // Rate limiter unavailable: fail open. Availability beats throttling.
    }
  }

  if (isProtectedRoute(req)) {
    await auth.protect();
  }

  // Referral attribution: ?ref=<code> anywhere on the site sets a 30-day
  // cookie that the sign-up page forwards into Clerk metadata.
  const refCode = req.nextUrl.searchParams.get("ref");
  if (refCode !== null && /^[a-z0-9]{4,16}$/.test(refCode)) {
    const response = NextResponse.next();
    response.cookies.set("upstream_ref", refCode, {
      maxAge: 30 * 24 * 60 * 60,
      httpOnly: true,
      sameSite: "lax",
      secure: true,
    });
    return response;
  }
  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest|txt|xml|mdx?)).*)",
    "/(api|trpc)(.*)",
  ],
};
