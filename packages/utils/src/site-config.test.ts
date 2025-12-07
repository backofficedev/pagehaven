import { describe, expect, it } from "vitest";
import {
  accessTypes,
  CONFIG_FILE_NAMES,
  generateJsonSchema,
  parseSiteConfig,
  type SiteConfig,
  safeParseSiteConfig,
  siteConfigSchema,
} from "./site-config";

describe("site-config", () => {
  describe("accessTypes", () => {
    it("includes all expected access types", () => {
      expect(accessTypes).toEqual([
        "public",
        "password",
        "private",
        "owner_only",
      ]);
    });
  });

  describe("CONFIG_FILE_NAMES", () => {
    it("includes expected config file names", () => {
      expect(CONFIG_FILE_NAMES).toContain("pagehaven.json");
      expect(CONFIG_FILE_NAMES).toContain("pagehaven.yaml");
      expect(CONFIG_FILE_NAMES).toContain("pagehaven.yml");
    });

    it("includes hidden file variants", () => {
      expect(CONFIG_FILE_NAMES).toContain(".pagehaven.json");
      expect(CONFIG_FILE_NAMES).toContain(".pagehaven.yaml");
    });
  });

  describe("siteConfigSchema", () => {
    it("parses minimal valid config", () => {
      const config = {};
      const result = siteConfigSchema.safeParse(config);
      expect(result.success).toBe(true);
    });

    it("parses config with name and description", () => {
      const config = {
        name: "My Site",
        description: "A test site",
      };
      const result = siteConfigSchema.safeParse(config);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe("My Site");
        expect(result.data.description).toBe("A test site");
      }
    });

    it("parses config with access settings", () => {
      const config = {
        access: {
          type: "password",
          password: "securepassword123",
        },
      };
      const result = siteConfigSchema.safeParse(config);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.access?.type).toBe("password");
        expect(result.data.access?.password).toBe("securepassword123");
      }
    });

    it("parses config with private access and invites", () => {
      const config = {
        access: {
          type: "private",
          invites: ["user1@example.com", "user2@example.com"],
        },
      };
      const result = siteConfigSchema.safeParse(config);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.access?.invites).toHaveLength(2);
      }
    });

    it("parses config with custom domain", () => {
      const config = {
        domain: {
          custom: "example.com",
        },
      };
      const result = siteConfigSchema.safeParse(config);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.domain?.custom).toBe("example.com");
      }
    });

    it("parses config with build settings", () => {
      const config = {
        build: {
          outputDir: "public",
          ignore: ["node_modules", ".git"],
        },
      };
      const result = siteConfigSchema.safeParse(config);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.build?.outputDir).toBe("public");
        expect(result.data.build?.ignore).toContain("node_modules");
      }
    });

    it("parses config with redirects", () => {
      const config = {
        redirects: [
          { from: "/old-page", to: "/new-page", status: 301 },
          { from: "/temp", to: "/temporary" },
        ],
      };
      const result = siteConfigSchema.safeParse(config);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.redirects).toHaveLength(2);
        expect(result.data.redirects?.[0]?.status).toBe(301);
      }
    });

    it("parses config with custom headers", () => {
      const config = {
        headers: [
          {
            path: "/*",
            headers: {
              "X-Frame-Options": "DENY",
              "X-Content-Type-Options": "nosniff",
            },
          },
        ],
      };
      const result = siteConfigSchema.safeParse(config);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.headers).toHaveLength(1);
        expect(result.data.headers?.[0]?.headers?.["X-Frame-Options"]).toBe(
          "DENY"
        );
      }
    });

    it("rejects invalid access type", () => {
      const config = {
        access: {
          type: "invalid",
        },
      };
      const result = siteConfigSchema.safeParse(config);
      expect(result.success).toBe(false);
    });

    it("rejects password shorter than 8 characters", () => {
      const config = {
        access: {
          type: "password",
          password: "short",
        },
      };
      const result = siteConfigSchema.safeParse(config);
      expect(result.success).toBe(false);
    });

    it("rejects invalid email in invites", () => {
      const config = {
        access: {
          type: "private",
          invites: ["not-an-email"],
        },
      };
      const result = siteConfigSchema.safeParse(config);
      expect(result.success).toBe(false);
    });

    it("rejects name longer than 100 characters", () => {
      const config = {
        name: "a".repeat(101),
      };
      const result = siteConfigSchema.safeParse(config);
      expect(result.success).toBe(false);
    });
  });

  describe("parseSiteConfig", () => {
    it("returns parsed config for valid input", () => {
      const config = { name: "Test Site" };
      const result = parseSiteConfig(config);
      expect(result.name).toBe("Test Site");
    });

    it("throws for invalid input", () => {
      const config = { name: "a".repeat(101) };
      expect(() => parseSiteConfig(config)).toThrow();
    });
  });

  describe("safeParseSiteConfig", () => {
    it("returns success for valid input", () => {
      const config = { name: "Test Site" };
      const result = safeParseSiteConfig(config);
      expect(result.success).toBe(true);
    });

    it("returns error for invalid input", () => {
      const config = { name: "a".repeat(101) };
      const result = safeParseSiteConfig(config);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeDefined();
      }
    });
  });

  describe("generateJsonSchema", () => {
    it("returns a valid JSON schema object", () => {
      const schema = generateJsonSchema();
      expect(schema).toHaveProperty("$schema");
      expect(schema).toHaveProperty("title");
      expect(schema).toHaveProperty("properties");
    });

    it("includes all top-level properties", () => {
      const schema = generateJsonSchema() as {
        properties: Record<string, unknown>;
      };
      expect(schema.properties).toHaveProperty("version");
      expect(schema.properties).toHaveProperty("name");
      expect(schema.properties).toHaveProperty("description");
      expect(schema.properties).toHaveProperty("access");
      expect(schema.properties).toHaveProperty("domain");
      expect(schema.properties).toHaveProperty("build");
      expect(schema.properties).toHaveProperty("redirects");
      expect(schema.properties).toHaveProperty("headers");
    });
  });

  describe("SiteConfig type", () => {
    it("allows full configuration", () => {
      const config: SiteConfig = {
        version: 1,
        name: "My Site",
        description: "A description",
        access: {
          type: "public",
        },
        domain: {
          custom: "example.com",
        },
        build: {
          outputDir: "dist",
          ignore: ["node_modules"],
        },
        redirects: [{ from: "/old", to: "/new", status: 301 }],
        headers: [{ path: "/*", headers: { "X-Test": "value" } }],
      };
      expect(config.name).toBe("My Site");
    });
  });
});
