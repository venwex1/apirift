import { PrismaClient } from "@prisma/client";

/**
 * Prisma singleton. In serverless, module scope survives across invocations
 * of a warm function; the global guard prevents connection exhaustion during
 * dev hot-reload. Pooling itself is handled by Neon's pgbouncer endpoint
 * (see DATABASE_URL's connection_limit).
 */
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const db: PrismaClient =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}
