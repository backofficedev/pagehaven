import { env } from "cloudflare:workers";
import { getStorage } from "@pagehaven/db/utils/storage";

// Re-exports for API consumers - this module also contains storage logic
// biome-ignore lint/performance/noBarrelFile: Module has actual logic, re-exports are for convenience
export { getContentType } from "@pagehaven/db/utils/content-type";
export { getFile, getStorage } from "@pagehaven/db/utils/storage";

const LEADING_SLASHES_REGEX = /^\/+/;

/**
 * Storage utilities for R2 bucket operations
 */

export type UploadedFile = {
  key: string;
  size: number;
  contentType: string;
};

export type StorageFile = {
  key: string;
  size: number;
  etag: string;
  lastModified: Date;
};

/**
 * Upload a file to R2
 */
export async function uploadFile(
  key: string,
  data: ArrayBuffer | ReadableStream | string,
  contentType: string
): Promise<UploadedFile> {
  const storage = env.STORAGE;

  const result = await storage.put(key, data, {
    httpMetadata: {
      contentType,
    },
  });

  return {
    key,
    size: result?.size ?? 0,
    contentType,
  };
}

/**
 * Delete a file from R2
 */
export async function deleteFile(key: string): Promise<void> {
  const storage = getStorage();
  await storage.delete(key);
}

/**
 * Delete multiple files from R2
 */
export async function deleteFiles(keys: string[]): Promise<void> {
  const storage = getStorage();
  await storage.delete(keys);
}

/**
 * List files in a directory (prefix)
 */
export async function listFiles(
  prefix: string,
  limit = 1000
): Promise<StorageFile[]> {
  const storage = getStorage();
  const listed = await storage.list({
    prefix,
    limit,
  });

  return listed.objects.map((obj) => ({
    key: obj.key,
    size: obj.size,
    etag: obj.etag,
    lastModified: obj.uploaded,
  }));
}

/**
 * Check if a file exists
 */
export async function fileExists(key: string): Promise<boolean> {
  const storage = getStorage();
  const head = await storage.head(key);
  return head !== null;
}

/**
 * Get file metadata without downloading
 */
export async function getFileMetadata(
  key: string
): Promise<{ size: number; etag: string; contentType?: string } | null> {
  const storage = getStorage();
  const head = await storage.head(key);

  if (!head) {
    return null;
  }

  return {
    size: head.size,
    etag: head.etag,
    contentType: head.httpMetadata?.contentType,
  };
}

/**
 * Generate a storage key for a deployment file
 */
export function getDeploymentFileKey(
  siteId: string,
  deploymentId: string,
  filePath: string
): string {
  // Normalize the file path (remove leading slashes)
  const normalizedPath = filePath.replace(LEADING_SLASHES_REGEX, "");
  return `sites/${siteId}/deployments/${deploymentId}/${normalizedPath}`;
}
