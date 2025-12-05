import { db } from "@pagehaven/db";
import { apiKey } from "@pagehaven/db/schema/api-key";
import { user } from "@pagehaven/db/schema/auth";
import { eq } from "drizzle-orm";

/**
 * Generate a new API key with prefix for identification
 * Format: ph_<random-32-chars>
 */
export function generateApiKey(): string {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let key = "ph_";
  for (let i = 0; i < 32; i++) {
    key += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return key;
}

/**
 * Hash an API key for secure storage
 * Uses SHA-256 via Web Crypto API (available in Cloudflare Workers)
 */
export async function hashApiKey(key: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(key);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Extract the prefix from an API key for display
 */
export function getKeyPrefix(key: string): string {
  return key.slice(0, 11); // "ph_" + first 8 chars
}

/**
 * Validate an API key and return the associated user
 * Updates lastUsedAt on successful validation
 */
export async function validateApiKey(key: string): Promise<{
  userId: string;
  user: { id: string; name: string; email: string };
  scopes: string[];
} | null> {
  if (!key.startsWith("ph_")) {
    return null;
  }

  const keyHash = await hashApiKey(key);

  const result = await db
    .select({
      apiKey,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    })
    .from(apiKey)
    .innerJoin(user, eq(apiKey.userId, user.id))
    .where(eq(apiKey.keyHash, keyHash))
    .get();

  if (!result) {
    return null;
  }

  // Check expiration
  if (result.apiKey.expiresAt && result.apiKey.expiresAt < new Date()) {
    return null;
  }

  // Update last used timestamp (fire and forget)
  db.update(apiKey)
    .set({ lastUsedAt: new Date() })
    .where(eq(apiKey.id, result.apiKey.id))
    .run()
    .catch(() => {
      // Ignore errors updating last used
    });

  return {
    userId: result.apiKey.userId,
    user: result.user,
    scopes: result.apiKey.scopes.split(","),
  };
}

/**
 * Check if a scope is allowed for the given scopes list
 */
export function hasScope(scopes: string[], requiredScope: string): boolean {
  return scopes.includes("*") || scopes.includes(requiredScope);
}
