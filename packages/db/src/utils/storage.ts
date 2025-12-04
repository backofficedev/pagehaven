import { env } from "cloudflare:workers";

/**
 * Storage utilities for R2 bucket operations.
 * Shared between API and static worker.
 */

export type FileResult = {
  body: ReadableStream;
  metadata: R2HTTPMetadata;
};

/**
 * Get the R2 bucket binding from environment
 */
export function getStorage(): R2Bucket {
  return env.STORAGE;
}

/**
 * Get a file from R2 storage
 */
export async function getFile(key: string): Promise<FileResult | null> {
  const storage = getStorage();
  const object = await storage.get(key);

  if (!object) {
    return null;
  }

  return {
    body: object.body,
    metadata: object.httpMetadata ?? {},
  };
}
