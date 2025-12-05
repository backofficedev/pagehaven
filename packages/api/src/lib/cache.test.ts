import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  CacheKey,
  CacheTTL,
  cacheDelete,
  cacheDeleteByPrefix,
  cacheGet,
  cacheGetOrSet,
  cacheSet,
  initCache,
  invalidateMembershipCache,
  invalidateSiteCache,
  isCacheAvailable,
} from "./cache";

describe("CacheKey", () => {
  it("generates correct site subdomain key", () => {
    expect(CacheKey.siteBySubdomain("mysite")).toBe("site:subdomain:mysite");
  });

  it("generates correct site domain key", () => {
    expect(CacheKey.siteByDomain("example.com")).toBe(
      "site:domain:example.com"
    );
  });

  it("generates correct access key", () => {
    expect(CacheKey.access("site-123")).toBe("access:site-123");
  });

  it("generates correct membership key", () => {
    expect(CacheKey.membership("user-1", "site-1")).toBe(
      "member:user-1:site-1"
    );
  });
});

describe("CacheTTL", () => {
  it("has correct TTL values", () => {
    expect(CacheTTL.SITE).toBe(300);
    expect(CacheTTL.ACCESS).toBe(300);
    expect(CacheTTL.DEPLOYMENT).toBe(600);
    expect(CacheTTL.MEMBERSHIP).toBe(120);
  });
});

describe("Cache operations without initialization", () => {
  it("isCacheAvailable returns false when not initialized", () => {
    expect(isCacheAvailable()).toBe(false);
  });

  it("cacheGet returns null when not initialized", async () => {
    const result = await cacheGet("test-key");
    expect(result).toBeNull();
  });

  it("cacheSet does nothing when not initialized", async () => {
    // Should not throw - verify it completes without error
    const result = await cacheSet("test-key", { data: "test" }, 60);
    expect(result).toBeUndefined();
  });

  it("cacheDelete does nothing when not initialized", async () => {
    // Should not throw - verify it completes without error
    const result = await cacheDelete("test-key");
    expect(result).toBeUndefined();
  });
});

describe("Cache operations with mock KV", () => {
  const mockKV = {
    get: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
    list: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    initCache(mockKV as any);
  });

  it("isCacheAvailable returns true when initialized", () => {
    expect(isCacheAvailable()).toBe(true);
  });

  it("cacheGet retrieves value from KV", async () => {
    mockKV.get.mockResolvedValue({ data: "cached" });

    const result = await cacheGet<{ data: string }>("test-key");

    expect(mockKV.get).toHaveBeenCalledWith("test-key", { type: "json" });
    expect(result).toEqual({ data: "cached" });
  });

  it("cacheGet returns null on error", async () => {
    mockKV.get.mockRejectedValue(new Error("KV error"));

    const result = await cacheGet("test-key");

    expect(result).toBeNull();
  });

  it("cacheSet stores value in KV with TTL", async () => {
    mockKV.put.mockResolvedValue(undefined);

    await cacheSet("test-key", { data: "value" }, 300);

    expect(mockKV.put).toHaveBeenCalledWith(
      "test-key",
      JSON.stringify({ data: "value" }),
      { expirationTtl: 300 }
    );
  });

  it("cacheDelete removes value from KV", async () => {
    mockKV.delete.mockResolvedValue(undefined);

    await cacheDelete("test-key");

    expect(mockKV.delete).toHaveBeenCalledWith("test-key");
  });

  it("cacheGetOrSet returns cached value if exists", async () => {
    mockKV.get.mockResolvedValue({ data: "cached" });
    const compute = vi.fn();

    const result = await cacheGetOrSet("test-key", 300, compute);

    expect(result).toEqual({ data: "cached" });
    expect(compute).not.toHaveBeenCalled();
  });

  it("cacheGetOrSet computes and caches value on miss", async () => {
    mockKV.get.mockResolvedValue(null);
    mockKV.put.mockResolvedValue(undefined);
    const compute = vi.fn().mockResolvedValue({ data: "computed" });

    const result = await cacheGetOrSet("test-key", 300, compute);

    expect(result).toEqual({ data: "computed" });
    expect(compute).toHaveBeenCalled();
    expect(mockKV.put).toHaveBeenCalledWith(
      "test-key",
      JSON.stringify({ data: "computed" }),
      { expirationTtl: 300 }
    );
  });

  it("cacheGetOrSet does not cache null values", async () => {
    mockKV.get.mockResolvedValue(null);
    const compute = vi.fn().mockResolvedValue(null);

    const result = await cacheGetOrSet("test-key", 300, compute);

    expect(result).toBeNull();
    expect(mockKV.put).not.toHaveBeenCalled();
  });

  describe("cacheDeleteByPrefix", () => {
    it("deletes all keys matching prefix", async () => {
      mockKV.list.mockResolvedValue({
        keys: [
          { name: "site:id:1" },
          { name: "site:id:2" },
          { name: "site:id:3" },
        ],
      });
      mockKV.delete.mockResolvedValue(undefined);

      await cacheDeleteByPrefix("site:id:");

      expect(mockKV.list).toHaveBeenCalledWith({ prefix: "site:id:" });
      expect(mockKV.delete).toHaveBeenCalledTimes(3);
      expect(mockKV.delete).toHaveBeenCalledWith("site:id:1");
      expect(mockKV.delete).toHaveBeenCalledWith("site:id:2");
      expect(mockKV.delete).toHaveBeenCalledWith("site:id:3");
    });

    it("handles empty key list", async () => {
      mockKV.list.mockResolvedValue({ keys: [] });

      await cacheDeleteByPrefix("nonexistent:");

      expect(mockKV.list).toHaveBeenCalledWith({ prefix: "nonexistent:" });
      expect(mockKV.delete).not.toHaveBeenCalled();
    });

    it("silently fails on error", async () => {
      mockKV.list.mockRejectedValue(new Error("KV error"));

      await expect(cacheDeleteByPrefix("site:")).resolves.toBeUndefined();
    });
  });

  describe("invalidateSiteCache", () => {
    it("deletes site-related cache keys", async () => {
      mockKV.delete.mockResolvedValue(undefined);

      await invalidateSiteCache("site-123");

      expect(mockKV.delete).toHaveBeenCalledWith("site:id:site-123");
      expect(mockKV.delete).toHaveBeenCalledWith("access:site-123");
      expect(mockKV.delete).toHaveBeenCalledWith("deployment:active:site-123");
    });

    it("deletes subdomain cache when provided", async () => {
      mockKV.delete.mockResolvedValue(undefined);

      await invalidateSiteCache("site-123", "mysite");

      expect(mockKV.delete).toHaveBeenCalledWith("site:subdomain:mysite");
    });

    it("deletes custom domain cache when provided", async () => {
      mockKV.delete.mockResolvedValue(undefined);

      await invalidateSiteCache("site-123", undefined, "example.com");

      expect(mockKV.delete).toHaveBeenCalledWith("site:domain:example.com");
    });

    it("deletes all caches when all params provided", async () => {
      mockKV.delete.mockResolvedValue(undefined);

      await invalidateSiteCache("site-123", "mysite", "example.com");

      expect(mockKV.delete).toHaveBeenCalledTimes(5);
      expect(mockKV.delete).toHaveBeenCalledWith("site:id:site-123");
      expect(mockKV.delete).toHaveBeenCalledWith("access:site-123");
      expect(mockKV.delete).toHaveBeenCalledWith("deployment:active:site-123");
      expect(mockKV.delete).toHaveBeenCalledWith("site:subdomain:mysite");
      expect(mockKV.delete).toHaveBeenCalledWith("site:domain:example.com");
    });

    it("skips custom domain when null", async () => {
      mockKV.delete.mockResolvedValue(undefined);

      await invalidateSiteCache("site-123", "mysite", null);

      expect(mockKV.delete).toHaveBeenCalledTimes(4);
      expect(mockKV.delete).not.toHaveBeenCalledWith(
        expect.stringContaining("site:domain:")
      );
    });
  });

  describe("invalidateMembershipCache", () => {
    it("deletes membership cache key", async () => {
      mockKV.delete.mockResolvedValue(undefined);

      await invalidateMembershipCache("user-456", "site-123");

      expect(mockKV.delete).toHaveBeenCalledWith("member:user-456:site-123");
    });
  });

  describe("cacheSet error handling", () => {
    it("silently fails on put error", async () => {
      mockKV.put.mockRejectedValue(new Error("KV error"));

      await expect(
        cacheSet("test-key", { data: "value" }, 300)
      ).resolves.toBeUndefined();
    });
  });

  describe("cacheDelete error handling", () => {
    it("silently fails on delete error", async () => {
      mockKV.delete.mockRejectedValue(new Error("KV error"));

      await expect(cacheDelete("test-key")).resolves.toBeUndefined();
    });
  });
});

describe("Cache operations without KV (prefix deletion)", () => {
  beforeEach(() => {
    initCache(null as unknown as Parameters<typeof initCache>[0]);
  });

  it("cacheDeleteByPrefix does nothing when not initialized", async () => {
    const result = await cacheDeleteByPrefix("site:");
    expect(result).toBeUndefined();
  });

  it("invalidateSiteCache does nothing when not initialized", async () => {
    const result = await invalidateSiteCache(
      "site-123",
      "mysite",
      "example.com"
    );
    expect(result).toBeUndefined();
  });

  it("invalidateMembershipCache does nothing when not initialized", async () => {
    const result = await invalidateMembershipCache("user-1", "site-1");
    expect(result).toBeUndefined();
  });
});

describe("CacheKey additional keys", () => {
  it("generates correct site by ID key", () => {
    expect(CacheKey.siteById("site-abc")).toBe("site:id:site-abc");
  });

  it("generates correct deployment key", () => {
    expect(CacheKey.deployment("site-xyz")).toBe("deployment:active:site-xyz");
  });
});
