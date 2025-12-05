/**
 * Cryptographic utilities using Web Crypto API (Cloudflare Workers compatible)
 */

/**
 * Hash a string using SHA-256 and return hex-encoded result
 */
export async function hashSHA256(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}
