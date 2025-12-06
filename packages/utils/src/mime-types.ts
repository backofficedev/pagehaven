/**
 * Common MIME types for static file serving
 */
export const mimeTypes: Record<string, string> = {
  html: "text/html",
  htm: "text/html",
  css: "text/css",
  js: "application/javascript",
  mjs: "application/javascript",
  json: "application/json",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  gif: "image/gif",
  svg: "image/svg+xml",
  webp: "image/webp",
  ico: "image/x-icon",
  woff: "font/woff",
  woff2: "font/woff2",
  ttf: "font/ttf",
  otf: "font/otf",
  eot: "application/vnd.ms-fontobject",
  pdf: "application/pdf",
  xml: "application/xml",
  zip: "application/zip",
  txt: "text/plain",
  md: "text/markdown",
  mp3: "audio/mpeg",
  mp4: "video/mp4",
  webm: "video/webm",
  wasm: "application/wasm",
};

/**
 * Get content type from file path or extension
 */
export function getContentType(filePath: string): string {
  const ext = filePath.split(".").pop()?.toLowerCase() ?? "";
  return mimeTypes[ext] ?? "application/octet-stream";
}
