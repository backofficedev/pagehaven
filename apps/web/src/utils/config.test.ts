import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("config", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  describe("config object", () => {
    it("uses environment variables when set", async () => {
      vi.stubEnv("VITE_SERVER_URL", "https://api.example.com");
      vi.stubEnv("VITE_STATIC_DOMAIN", "example.io");

      const { config } = await import("./config");

      expect(config.serverUrl).toBe("https://api.example.com");
      expect(config.staticDomain).toBe("example.io");
    });

    it("uses empty strings as defaults", async () => {
      vi.stubEnv("VITE_SERVER_URL", "");
      vi.stubEnv("VITE_STATIC_DOMAIN", "");

      const { config } = await import("./config");

      expect(config.serverUrl).toBe("");
      expect(config.staticDomain).toBe("");
    });
  });

  describe("getSiteUrl", () => {
    it("returns https URL for production domains", async () => {
      vi.stubEnv("VITE_STATIC_DOMAIN", "pagehaven.io");

      const { getSiteUrl } = await import("./config");

      expect(getSiteUrl("mysite")).toBe("https://mysite.pagehaven.io");
    });

    it("returns http URL for localhost domains", async () => {
      vi.stubEnv("VITE_STATIC_DOMAIN", "localhost:3000");

      const { getSiteUrl } = await import("./config");

      expect(getSiteUrl("mysite")).toBe("http://mysite.localhost:3000");
    });

    it("handles subdomains with special characters", async () => {
      vi.stubEnv("VITE_STATIC_DOMAIN", "pagehaven.io");

      const { getSiteUrl } = await import("./config");

      expect(getSiteUrl("my-site-123")).toBe(
        "https://my-site-123.pagehaven.io"
      );
    });
  });

  describe("getSiteDisplayDomain", () => {
    it("returns formatted display domain", async () => {
      vi.stubEnv("VITE_STATIC_DOMAIN", "pagehaven.io");

      const { getSiteDisplayDomain } = await import("./config");

      expect(getSiteDisplayDomain("mysite")).toBe("mysite.pagehaven.io");
    });

    it("works with localhost", async () => {
      vi.stubEnv("VITE_STATIC_DOMAIN", "localhost:8080");

      const { getSiteDisplayDomain } = await import("./config");

      expect(getSiteDisplayDomain("test")).toBe("test.localhost:8080");
    });
  });
});
