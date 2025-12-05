import { describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { hashPassword, verifyPassword } from "../lib/password";
import { mockDb } from "../test-utils/mock-db";

const HEX_HASH_REGEX = /^[0-9a-f]+$/;

// Mock the database module
vi.mock("@pagehaven/db", () => mockDb);

// Access type validation schema (extracted from access.ts)
const accessTypeSchema = z.enum([
  "public",
  "password",
  "private",
  "owner_only",
]);

// Update access schema
const updateAccessSchema = z.object({
  siteId: z.string(),
  accessType: accessTypeSchema,
  password: z.string().min(4).max(100).optional(),
});

// Create invite schema
const createInviteSchema = z.object({
  siteId: z.string(),
  email: z.string().email(),
  expiresInDays: z.number().min(1).max(365).optional(),
});

// Check access schema
const checkAccessSchema = z.object({
  siteId: z.string(),
  email: z.string().email().optional(),
  userId: z.string().optional(),
});

describe("access router", () => {
  describe("smoke tests", () => {
    it("access type schema validates correctly", () => {
      expect(accessTypeSchema.safeParse("public").success).toBe(true);
    });
  });

  describe("access type validation - happy path", () => {
    it("accepts all valid access types", () => {
      expect(accessTypeSchema.safeParse("public").success).toBe(true);
      expect(accessTypeSchema.safeParse("password").success).toBe(true);
      expect(accessTypeSchema.safeParse("private").success).toBe(true);
      expect(accessTypeSchema.safeParse("owner_only").success).toBe(true);
    });
  });

  describe("access type validation - negative tests", () => {
    it("rejects invalid access types", () => {
      expect(accessTypeSchema.safeParse("invalid").success).toBe(false);
      expect(accessTypeSchema.safeParse("PUBLIC").success).toBe(false);
      expect(accessTypeSchema.safeParse("").success).toBe(false);
      expect(accessTypeSchema.safeParse("protected").success).toBe(false);
    });
  });
});

describe("update access schema", () => {
  describe("happy path", () => {
    it("accepts valid public access update", () => {
      const result = updateAccessSchema.safeParse({
        siteId: "site-123",
        accessType: "public",
      });
      expect(result.success).toBe(true);
    });

    it("accepts valid password access update with password", () => {
      const result = updateAccessSchema.safeParse({
        siteId: "site-123",
        accessType: "password",
        password: "secretpass",
      });
      expect(result.success).toBe(true);
    });

    it("accepts valid private access update", () => {
      const result = updateAccessSchema.safeParse({
        siteId: "site-123",
        accessType: "private",
      });
      expect(result.success).toBe(true);
    });

    it("accepts valid owner_only access update", () => {
      const result = updateAccessSchema.safeParse({
        siteId: "site-123",
        accessType: "owner_only",
      });
      expect(result.success).toBe(true);
    });
  });

  describe("negative tests", () => {
    it("rejects missing siteId", () => {
      const result = updateAccessSchema.safeParse({
        accessType: "public",
      });
      expect(result.success).toBe(false);
    });

    it("rejects missing accessType", () => {
      const result = updateAccessSchema.safeParse({
        siteId: "site-123",
      });
      expect(result.success).toBe(false);
    });

    it("rejects password too short", () => {
      const result = updateAccessSchema.safeParse({
        siteId: "site-123",
        accessType: "password",
        password: "abc", // min 4
      });
      expect(result.success).toBe(false);
    });

    it("rejects password too long", () => {
      const result = updateAccessSchema.safeParse({
        siteId: "site-123",
        accessType: "password",
        password: "a".repeat(101), // max 100
      });
      expect(result.success).toBe(false);
    });
  });

  describe("edge cases", () => {
    it("accepts password at minimum length (4)", () => {
      const result = updateAccessSchema.safeParse({
        siteId: "site-123",
        accessType: "password",
        password: "abcd",
      });
      expect(result.success).toBe(true);
    });

    it("accepts password at maximum length (100)", () => {
      const result = updateAccessSchema.safeParse({
        siteId: "site-123",
        accessType: "password",
        password: "a".repeat(100),
      });
      expect(result.success).toBe(true);
    });
  });
});

describe("create invite schema", () => {
  describe("happy path", () => {
    it("accepts valid invite without expiry", () => {
      const result = createInviteSchema.safeParse({
        siteId: "site-123",
        email: "user@example.com",
      });
      expect(result.success).toBe(true);
    });

    it("accepts valid invite with expiry", () => {
      const result = createInviteSchema.safeParse({
        siteId: "site-123",
        email: "user@example.com",
        expiresInDays: 30,
      });
      expect(result.success).toBe(true);
    });

    it("accepts various valid email formats", () => {
      const validEmails = [
        "user@example.com",
        "user.name@example.com",
        "user+tag@example.com",
        "user@subdomain.example.com",
      ];
      for (const email of validEmails) {
        const result = createInviteSchema.safeParse({
          siteId: "site-123",
          email,
        });
        expect(result.success).toBe(true);
      }
    });
  });

  describe("negative tests", () => {
    it("rejects invalid email", () => {
      const invalidEmails = [
        "notanemail",
        "missing@domain",
        "@nodomain.com",
        "spaces in@email.com",
      ];
      for (const email of invalidEmails) {
        const result = createInviteSchema.safeParse({
          siteId: "site-123",
          email,
        });
        expect(result.success).toBe(false);
      }
    });

    it("rejects missing siteId", () => {
      const result = createInviteSchema.safeParse({
        email: "user@example.com",
      });
      expect(result.success).toBe(false);
    });

    it("rejects missing email", () => {
      const result = createInviteSchema.safeParse({
        siteId: "site-123",
      });
      expect(result.success).toBe(false);
    });

    it("rejects expiresInDays less than 1", () => {
      const result = createInviteSchema.safeParse({
        siteId: "site-123",
        email: "user@example.com",
        expiresInDays: 0,
      });
      expect(result.success).toBe(false);
    });

    it("rejects expiresInDays greater than 365", () => {
      const result = createInviteSchema.safeParse({
        siteId: "site-123",
        email: "user@example.com",
        expiresInDays: 366,
      });
      expect(result.success).toBe(false);
    });
  });

  describe("edge cases", () => {
    it("accepts expiresInDays at minimum (1)", () => {
      const result = createInviteSchema.safeParse({
        siteId: "site-123",
        email: "user@example.com",
        expiresInDays: 1,
      });
      expect(result.success).toBe(true);
    });

    it("accepts expiresInDays at maximum (365)", () => {
      const result = createInviteSchema.safeParse({
        siteId: "site-123",
        email: "user@example.com",
        expiresInDays: 365,
      });
      expect(result.success).toBe(true);
    });
  });
});

describe("check access schema", () => {
  describe("happy path", () => {
    it("accepts siteId only", () => {
      const result = checkAccessSchema.safeParse({
        siteId: "site-123",
      });
      expect(result.success).toBe(true);
    });

    it("accepts siteId with email", () => {
      const result = checkAccessSchema.safeParse({
        siteId: "site-123",
        email: "user@example.com",
      });
      expect(result.success).toBe(true);
    });

    it("accepts siteId with userId", () => {
      const result = checkAccessSchema.safeParse({
        siteId: "site-123",
        userId: "user-456",
      });
      expect(result.success).toBe(true);
    });

    it("accepts siteId with both email and userId", () => {
      const result = checkAccessSchema.safeParse({
        siteId: "site-123",
        email: "user@example.com",
        userId: "user-456",
      });
      expect(result.success).toBe(true);
    });
  });

  describe("negative tests", () => {
    it("rejects missing siteId", () => {
      const result = checkAccessSchema.safeParse({
        email: "user@example.com",
      });
      expect(result.success).toBe(false);
    });

    it("rejects invalid email format", () => {
      const result = checkAccessSchema.safeParse({
        siteId: "site-123",
        email: "invalid-email",
      });
      expect(result.success).toBe(false);
    });
  });
});

describe("password hashing logic", () => {
  // Uses shared password utilities from lib/password
  describe("happy path", () => {
    it("hashes password to consistent value", async () => {
      const hash1 = await hashPassword("testpassword");
      const hash2 = await hashPassword("testpassword");
      expect(hash1).toBe(hash2);
    });

    it("verifies correct password", async () => {
      const password = "mysecretpassword";
      const hash = await hashPassword(password);
      const isValid = await verifyPassword(password, hash);
      expect(isValid).toBe(true);
    });

    it("produces 64-character hex hash", async () => {
      const hash = await hashPassword("anypassword");
      expect(hash).toHaveLength(64);
      expect(HEX_HASH_REGEX.test(hash)).toBe(true);
    });
  });

  describe("negative tests", () => {
    it("rejects incorrect password", async () => {
      const hash = await hashPassword("correctpassword");
      const isValid = await verifyPassword("wrongpassword", hash);
      expect(isValid).toBe(false);
    });

    it("different passwords produce different hashes", async () => {
      const hash1 = await hashPassword("password1");
      const hash2 = await hashPassword("password2");
      expect(hash1).not.toBe(hash2);
    });
  });

  describe("edge cases", () => {
    it("handles empty password", async () => {
      const hash = await hashPassword("");
      expect(hash).toHaveLength(64);
    });

    it("handles very long password", async () => {
      const longPassword = "a".repeat(10_000);
      const hash = await hashPassword(longPassword);
      expect(hash).toHaveLength(64);
    });

    it("handles special characters", async () => {
      const hash = await hashPassword("p@$$w0rd!#$%^&*()");
      expect(hash).toHaveLength(64);
    });

    it("handles unicode characters", async () => {
      const hash = await hashPassword("密码🔐");
      expect(hash).toHaveLength(64);
    });
  });
});
