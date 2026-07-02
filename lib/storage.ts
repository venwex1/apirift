import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { env } from "@/lib/env";
import { withRetry } from "@/lib/errors";

/** Cloudflare R2 via the S3-compatible API. Used for weekly data exports. */
const r2 = new S3Client({
  region: "auto",
  endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: env.R2_ACCESS_KEY_ID,
    secretAccessKey: env.R2_SECRET_ACCESS_KEY,
  },
});

export async function putObject(key: string, body: string): Promise<void> {
  await withRetry(
    () =>
      r2.send(
        new PutObjectCommand({
          Bucket: env.R2_BUCKET,
          Key: key,
          Body: body,
          ContentType: "application/json",
        })
      ),
    { attempts: 3, baseDelayMs: 1000, timeoutMs: 30_000, label: "r2.put" }
  );
}

/** Round-trip check used by /api/health. */
export async function storageHealthCheck(): Promise<void> {
  const key = "health/probe.json";
  await putObject(key, JSON.stringify({ at: new Date().toISOString() }));
  await r2.send(new GetObjectCommand({ Bucket: env.R2_BUCKET, Key: key }));
}
