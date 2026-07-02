import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";

export enum ErrorCode {
  VALIDATION = "VALIDATION",
  UNAUTHORIZED = "UNAUTHORIZED",
  FORBIDDEN = "FORBIDDEN",
  NOT_FOUND = "NOT_FOUND",
  ALREADY_EXISTS = "ALREADY_EXISTS",
  LIMIT_REACHED = "LIMIT_REACHED",
  UPGRADE_REQUIRED = "UPGRADE_REQUIRED",
  RATE_LIMITED = "RATE_LIMITED",
  STRIPE_ERROR = "STRIPE_ERROR",
  AI_UNAVAILABLE = "AI_UNAVAILABLE",
  INTERNAL = "INTERNAL",
}

const STATUS_FOR: Record<ErrorCode, number> = {
  [ErrorCode.VALIDATION]: 400,
  [ErrorCode.UNAUTHORIZED]: 401,
  [ErrorCode.FORBIDDEN]: 403,
  [ErrorCode.NOT_FOUND]: 404,
  [ErrorCode.ALREADY_EXISTS]: 409,
  [ErrorCode.LIMIT_REACHED]: 402,
  [ErrorCode.UPGRADE_REQUIRED]: 402,
  [ErrorCode.RATE_LIMITED]: 429,
  [ErrorCode.STRIPE_ERROR]: 502,
  [ErrorCode.AI_UNAVAILABLE]: 503,
  [ErrorCode.INTERNAL]: 500,
};

export class AppError extends Error {
  readonly code: ErrorCode;
  /** Safe to show to the user verbatim. Never contains internals. */
  readonly userMessage: string;

  constructor(code: ErrorCode, userMessage: string) {
    super(`${code}: ${userMessage}`);
    this.code = code;
    this.userMessage = userMessage;
  }
}

export interface ApiErrorBody {
  error: { code: ErrorCode; message: string; requestId: string };
}

/**
 * Wraps a route handler. Every thrown error becomes a consistent JSON shape;
 * unexpected errors are captured in Sentry with the request id and never leak
 * stack traces to the client.
 */
export function withErrorHandling(
  handler: (req: Request) => Promise<Response>
): (req: Request) => Promise<Response> {
  return async (req: Request): Promise<Response> => {
    const requestId = crypto.randomUUID();
    try {
      return await handler(req);
    } catch (err) {
      if (err instanceof AppError) {
        const body: ApiErrorBody = {
          error: { code: err.code, message: err.userMessage, requestId },
        };
        return NextResponse.json(body, { status: STATUS_FOR[err.code] });
      }
      Sentry.captureException(err, {
        tags: { requestId },
        extra: { url: req.url, method: req.method },
      });
      const body: ApiErrorBody = {
        error: {
          code: ErrorCode.INTERNAL,
          message:
            "Something went wrong on our side. It has been reported — try again in a moment.",
          requestId,
        },
      };
      return NextResponse.json(body, { status: 500 });
    }
  };
}

interface RetryOptions {
  attempts: number;
  baseDelayMs: number;
  timeoutMs?: number;
  label: string;
}

/**
 * Generic retry with exponential backoff + full jitter, and an optional
 * per-attempt timeout. Used for every external call in the codebase.
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  { attempts, baseDelayMs, timeoutMs, label }: RetryOptions
): Promise<T> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      if (timeoutMs === undefined) return await fn();
      return await Promise.race([
        fn(),
        new Promise<never>((_, reject) => {
          setTimeout(
            () => reject(new Error(`${label}: timed out after ${timeoutMs}ms`)),
            timeoutMs
          );
        }),
      ]);
    } catch (err) {
      lastError = err;
      if (attempt === attempts) break;
      const backoff = baseDelayMs * 2 ** (attempt - 1);
      const jitter = Math.random() * backoff;
      await new Promise((resolve) => setTimeout(resolve, backoff + jitter));
    }
  }
  throw lastError instanceof Error
    ? lastError
    : new Error(`${label}: failed after ${attempts} attempts`);
}
