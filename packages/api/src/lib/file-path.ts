/**
 * File path utilities for static file serving
 */

/**
 * Normalize a file path for static file serving
 * - Removes leading slash
 * - Adds index.html for empty paths or directory paths
 */
export function normalizeFilePath(path: string): string {
  let filePath = path.startsWith("/") ? path.slice(1) : path;

  if (!filePath || filePath.endsWith("/")) {
    filePath = `${filePath}index.html`;
  }

  return filePath;
}
