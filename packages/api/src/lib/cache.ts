/**
 * Cache utility for Cloudflare KV
 * Provides typed caching with TTL support and pattern-based invalidation
 */

type KVNamespace = {
  get(key: string, options?: { type: "text" }): Promise<string | null>;
  get(key: string, options: { type: "json" }): Promise<unknown>;
  put(
    key: string,
    value: string,
    options?: { expirationTtl?: number }
  ): Promise<void>;
  delete(key: string): Promise<void>;
  list(options?: { prefix?: string }): Promise<{ keys: { name: string }[] }>;
};

// Cache TTL constants (in seconds)
export const CacheTTL = {
  SITE: 300, // 5 minutes
  ACCESS: 300, // 5 minutes
  DEPLOYMENT: 600, // 10 minutes
  MEMBERSHIP: 120, // 2 minutes
} as const;

// Cache key prefixes
export const CacheKey = {
  siteBySubdomain: (subdomain: string) => `site:subdomain:${subdomain}`,
  siteByDomain: (domain: string) => `site:domain:${domain}`,
  siteById: (siteId: string) => `site:id:${siteId}`,
  access: (siteId: string) => `access:${siteId}`,
  deployment: (siteId: string) => `deployment:active:${siteId}`,
  membership: (userId: string, siteId: string) => `member:${userId}:${siteId}`,
} as const;

let kvNamespace: KVNamespace | null = null;

/**
 * Initialize the cache with a KV namespace binding
 */
export function initCache(kv: KVNamespace): void {
  kvNamespace = kv;
}

/**
 * Check if cache is available
 */
export function isCacheAvailable(): boolean {
  return kvNamespace !== null;
}

/**
 * Get a cached value by key
 */
export async function cacheGet<T>(key: string): Promise<T | null> {
  if (!kvNamespace) {
    return null;
  }
  try {
    const value = await kvNamespace.get(key, { type: "json" });
    return value as T | null;
  } catch {
    return null;
  }
}

/**
 * Set a cached value with TTL
 */
export async function cacheSet<T>(
  key: string,
  value: T,
  ttlSeconds: number
): Promise<void> {
  if (!kvNamespace) {
    return;
  }
  try {
    await kvNamespace.put(key, JSON.stringify(value), {
      expirationTtl: ttlSeconds,
    });
  } catch {
    // Silently fail - caching is best-effort
  }
}

/**
 * Delete a cached value
 */
export async function cacheDelete(key: string): Promise<void> {
  if (!kvNamespace) {
    return;
  }
  try {
    await kvNamespace.delete(key);
  } catch {
    // Silently fail
  }
}

/**
 * Delete all cached values matching a prefix
 */
export async function cacheDeleteByPrefix(prefix: string): Promise<void> {
  if (!kvNamespace) {
    return;
  }
  try {
    const list = await kvNamespace.list({ prefix });
    const kv = kvNamespace;
    await Promise.all(list.keys.map((k) => kv.delete(k.name)));
  } catch {
    // Silently fail
  }
}

/**
 * Invalidate all cache entries for a site
 */
export async function invalidateSiteCache(
  siteId: string,
  subdomain?: string,
  customDomain?: string | null
): Promise<void> {
  const deletions: Promise<void>[] = [
    cacheDelete(CacheKey.siteById(siteId)),
    cacheDelete(CacheKey.access(siteId)),
    cacheDelete(CacheKey.deployment(siteId)),
  ];

  if (subdomain) {
    deletions.push(cacheDelete(CacheKey.siteBySubdomain(subdomain)));
  }

  if (customDomain) {
    deletions.push(cacheDelete(CacheKey.siteByDomain(customDomain)));
  }

  await Promise.all(deletions);
}

/**
 * Invalidate membership cache for a user on a site
 */
export async function invalidateMembershipCache(
  userId: string,
  siteId: string
): Promise<void> {
  await cacheDelete(CacheKey.membership(userId, siteId));
}

/**
 * Get or set pattern - fetch from cache or compute and cache
 */
export async function cacheGetOrSet<T>(
  key: string,
  ttlSeconds: number,
  compute: () => Promise<T | null>
): Promise<T | null> {
  // Try cache first
  const cached = await cacheGet<T>(key);
  if (cached !== null) {
    return cached;
  }

  // Compute value
  const value = await compute();

  // Cache if we got a value
  if (value !== null) {
    await cacheSet(key, value, ttlSeconds);
  }

  return value;
}
