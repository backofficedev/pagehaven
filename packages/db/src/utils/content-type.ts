/**
 * Content type mapping for common file extensions
 */
export const CONTENT_TYPES: Record<string, string> = {
  // HTML
  html: "text/html",
  htm: "text/html",
  // CSS
  css: "text/css",
  // JavaScript
  js: "application/javascript",
  mjs: "application/javascript",
  // JSON
  json: "application/json",
  // Images
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  gif: "image/gif",
  webp: "image/webp",
  svg: "image/svg+xml",
  ico: "image/x-icon",
  // Fonts
  woff: "font/woff",
  woff2: "font/woff2",
  ttf: "font/ttf",
  otf: "font/otf",
  eot: "application/vnd.ms-fontobject",
  // Documents
  pdf: "application/pdf",
  xml: "application/xml",
  // Media
  mp3: "audio/mpeg",
  mp4: "video/mp4",
  webm: "video/webm",
  // Archives
  zip: "application/zip",
  // Text
  txt: "text/plain",
  md: "text/markdown",
  // WebAssembly
  wasm: "application/wasm",
};

/**
 * Get the content type based on file extension
 */
export function getContentType(filename: string): string {
  const ext = filename.split(".").pop()?.toLowerCase();
  return CONTENT_TYPES[ext ?? ""] ?? "application/octet-stream";
}
