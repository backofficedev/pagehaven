import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  CacheKey,
  CacheTTL,
  cacheDelete,
  cacheGet,
  cacheGetOrSet,
  cacheSet,
  initCache,
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
    // Should not throw
    await cacheSet("test-key", { data: "test" }, 60);
  });

  it("cacheDelete does nothing when not initialized", async () => {
    // Should not throw
    await cacheDelete("test-key");
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
});
