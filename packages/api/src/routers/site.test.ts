import { describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { updateSiteSchema } from "../schemas/upload";
import { mockDb } from "../test-utils/mock-db";

// Mock the database module
vi.mock("@pagehaven/db", () => mockDb);

// Subdomain validation schema (extracted from site.ts)
const subdomainSchema = z
  .string()
  .min(3)
  .max(63)
  .regex(
    /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/,
    "Subdomain must be lowercase alphanumeric with optional hyphens, cannot start or end with hyphen"
  );

describe("site router", () => {
  describe("smoke tests", () => {
    it("subdomain schema exists and validates", () => {
      expect(subdomainSchema.safeParse("valid-subdomain").success).toBe(true);
    });
  });

  describe("subdomain validation - happy path", () => {
    it("accepts valid lowercase alphanumeric subdomains", () => {
      expect(subdomainSchema.safeParse("mysite").success).toBe(true);
      expect(subdomainSchema.safeParse("my-site").success).toBe(true);
      expect(subdomainSchema.safeParse("my-cool-site").success).toBe(true);
      expect(subdomainSchema.safeParse("site123").success).toBe(true);
      expect(subdomainSchema.safeParse("123site").success).toBe(true);
      expect(subdomainSchema.safeParse("abc").success).toBe(true);
    });

    it("accepts subdomains at minimum length (3)", () => {
      expect(subdomainSchema.safeParse("abc").success).toBe(true);
      expect(subdomainSchema.safeParse("a1b").success).toBe(true);
    });

    it("accepts subdomains at maximum length (63)", () => {
      const maxLength = "a".repeat(63);
      expect(subdomainSchema.safeParse(maxLength).success).toBe(true);
    });

    it("accepts subdomains with numbers", () => {
      expect(subdomainSchema.safeParse("site1").success).toBe(true);
      expect(subdomainSchema.safeParse("1site").success).toBe(true);
      expect(subdomainSchema.safeParse("site123site").success).toBe(true);
    });
  });

  describe("subdomain validation - negative tests", () => {
    it("rejects subdomains that are too short", () => {
      expect(subdomainSchema.safeParse("ab").success).toBe(false);
      expect(subdomainSchema.safeParse("a").success).toBe(false);
      expect(subdomainSchema.safeParse("").success).toBe(false);
    });

    it("rejects subdomains that are too long", () => {
      const tooLong = "a".repeat(64);
      expect(subdomainSchema.safeParse(tooLong).success).toBe(false);
    });

    it("rejects subdomains starting with hyphen", () => {
      expect(subdomainSchema.safeParse("-mysite").success).toBe(false);
      expect(subdomainSchema.safeParse("-abc").success).toBe(false);
    });

    it("rejects subdomains ending with hyphen", () => {
      expect(subdomainSchema.safeParse("mysite-").success).toBe(false);
      expect(subdomainSchema.safeParse("abc-").success).toBe(false);
    });

    it("rejects subdomains with uppercase letters", () => {
      expect(subdomainSchema.safeParse("MySite").success).toBe(false);
      expect(subdomainSchema.safeParse("MYSITE").success).toBe(false);
      expect(subdomainSchema.safeParse("mysiTe").success).toBe(false);
    });

    it("rejects subdomains with special characters", () => {
      expect(subdomainSchema.safeParse("my_site").success).toBe(false);
      expect(subdomainSchema.safeParse("my.site").success).toBe(false);
      expect(subdomainSchema.safeParse("my@site").success).toBe(false);
      expect(subdomainSchema.safeParse("my site").success).toBe(false);
      expect(subdomainSchema.safeParse("my!site").success).toBe(false);
    });

    it("rejects subdomains with consecutive hyphens only at start/end", () => {
      // Consecutive hyphens in the middle are allowed by the regex
      expect(subdomainSchema.safeParse("my--site").success).toBe(true);
      // But not at start or end
      expect(subdomainSchema.safeParse("--mysite").success).toBe(false);
      expect(subdomainSchema.safeParse("mysite--").success).toBe(false);
    });
  });

  describe("subdomain validation - edge cases", () => {
    it("handles single character with hyphen (invalid)", () => {
      expect(subdomainSchema.safeParse("a-").success).toBe(false);
      expect(subdomainSchema.safeParse("-a").success).toBe(false);
    });

    it("handles all numbers", () => {
      expect(subdomainSchema.safeParse("123").success).toBe(true);
      expect(subdomainSchema.safeParse("12345").success).toBe(true);
    });

    it("handles hyphen-only (invalid)", () => {
      expect(subdomainSchema.safeParse("-").success).toBe(false);
      expect(subdomainSchema.safeParse("---").success).toBe(false);
    });
  });
});

describe("site input validation schemas", () => {
  const createSiteSchema = z.object({
    name: z.string().min(1).max(100),
    subdomain: subdomainSchema,
    description: z.string().max(500).optional(),
  });

  describe("create site schema - happy path", () => {
    it("accepts valid site creation input", () => {
      const result = createSiteSchema.safeParse({
        name: "My Website",
        subdomain: "mywebsite",
      });
      expect(result.success).toBe(true);
    });

    it("accepts site with description", () => {
      const result = createSiteSchema.safeParse({
        name: "My Website",
        subdomain: "mywebsite",
        description: "A cool website",
      });
      expect(result.success).toBe(true);
    });

    it("accepts site with empty description", () => {
      const result = createSiteSchema.safeParse({
        name: "My Website",
        subdomain: "mywebsite",
        description: "",
      });
      expect(result.success).toBe(true);
    });
  });

  describe("create site schema - negative tests", () => {
    it("rejects missing name", () => {
      const result = createSiteSchema.safeParse({
        subdomain: "mywebsite",
      });
      expect(result.success).toBe(false);
    });

    it("rejects missing subdomain", () => {
      const result = createSiteSchema.safeParse({
        name: "My Website",
      });
      expect(result.success).toBe(false);
    });

    it("rejects empty name", () => {
      const result = createSiteSchema.safeParse({
        name: "",
        subdomain: "mywebsite",
      });
      expect(result.success).toBe(false);
    });

    it("rejects name exceeding max length", () => {
      const result = createSiteSchema.safeParse({
        name: "a".repeat(101),
        subdomain: "mywebsite",
      });
      expect(result.success).toBe(false);
    });

    it("rejects description exceeding max length", () => {
      const result = createSiteSchema.safeParse({
        name: "My Website",
        subdomain: "mywebsite",
        description: "a".repeat(501),
      });
      expect(result.success).toBe(false);
    });
  });

  describe("update site schema - happy path", () => {
    it("accepts valid update with name only", () => {
      const result = updateSiteSchema.safeParse({
        siteId: "site-123",
        name: "Updated Name",
      });
      expect(result.success).toBe(true);
    });

    it("accepts valid update with description only", () => {
      const result = updateSiteSchema.safeParse({
        siteId: "site-123",
        description: "Updated description",
      });
      expect(result.success).toBe(true);
    });

    it("accepts valid update with custom domain", () => {
      const result = updateSiteSchema.safeParse({
        siteId: "site-123",
        customDomain: "example.com",
      });
      expect(result.success).toBe(true);
    });

    it("accepts null custom domain (to remove)", () => {
      const result = updateSiteSchema.safeParse({
        siteId: "site-123",
        customDomain: null,
      });
      expect(result.success).toBe(true);
    });

    it("accepts update with all fields", () => {
      const result = updateSiteSchema.safeParse({
        siteId: "site-123",
        name: "Updated Name",
        description: "Updated description",
        customDomain: "example.com",
      });
      expect(result.success).toBe(true);
    });
  });

  describe("update site schema - negative tests", () => {
    it("rejects missing siteId", () => {
      const result = updateSiteSchema.safeParse({
        name: "Updated Name",
      });
      expect(result.success).toBe(false);
    });

    it("rejects custom domain exceeding max length", () => {
      const result = updateSiteSchema.safeParse({
        siteId: "site-123",
        customDomain: "a".repeat(254),
      });
      expect(result.success).toBe(false);
    });
  });
});

describe("site member roles", () => {
  const addMemberSchema = z.object({
    siteId: z.string(),
    userId: z.string(),
    role: z.enum(["owner", "admin", "editor", "viewer"]),
  });

  describe("happy path", () => {
    it("accepts all valid roles", () => {
      for (const role of ["owner", "admin", "editor", "viewer"]) {
        const result = addMemberSchema.safeParse({
          siteId: "site-123",
          userId: "user-456",
          role,
        });
        expect(result.success).toBe(true);
      }
    });
  });

  describe("negative tests", () => {
    it("rejects invalid role", () => {
      const result = addMemberSchema.safeParse({
        siteId: "site-123",
        userId: "user-456",
        role: "superadmin",
      });
      expect(result.success).toBe(false);
    });

    it("rejects missing role", () => {
      const result = addMemberSchema.safeParse({
        siteId: "site-123",
        userId: "user-456",
      });
      expect(result.success).toBe(false);
    });
  });
});
