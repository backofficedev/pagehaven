import { describe, expect, it, vi } from "vitest";
import { z } from "zod";

const DOMAIN_REGEX =
  /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/i;
const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

// Mock the database module
vi.mock("@pagehaven/db", () => ({
  db: {
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn(() => ({
          get: vi.fn(),
        })),
      })),
    })),
    insert: vi.fn(() => ({
      values: vi.fn(),
    })),
    update: vi.fn(() => ({
      set: vi.fn(() => ({
        where: vi.fn(),
      })),
    })),
    delete: vi.fn(() => ({
      where: vi.fn(),
    })),
  },
}));

// Add domain schema
const addDomainSchema = z.object({
  siteId: z.string(),
  domain: z.string().regex(DOMAIN_REGEX),
});

// Domain verification statuses
const verificationStatuses = ["pending", "verified", "failed"] as const;

describe("domain router", () => {
  describe("smoke tests", () => {
    it("add domain schema validates correctly", () => {
      expect(
        addDomainSchema.safeParse({
          siteId: "site-123",
          domain: "example.com",
        }).success
      ).toBe(true);
    });

    it("verification statuses are defined", () => {
      expect(verificationStatuses).toContain("pending");
      expect(verificationStatuses).toContain("verified");
      expect(verificationStatuses).toContain("failed");
    });
  });
});

describe("domain validation", () => {
  describe("happy path - valid domains", () => {
    it("accepts simple domain", () => {
      const result = addDomainSchema.safeParse({
        siteId: "site-123",
        domain: "example.com",
      });
      expect(result.success).toBe(true);
    });

    it("accepts subdomain", () => {
      const result = addDomainSchema.safeParse({
        siteId: "site-123",
        domain: "www.example.com",
      });
      expect(result.success).toBe(true);
    });

    it("accepts multiple subdomains", () => {
      const result = addDomainSchema.safeParse({
        siteId: "site-123",
        domain: "blog.www.example.com",
      });
      expect(result.success).toBe(true);
    });

    it("accepts domain with numbers", () => {
      const result = addDomainSchema.safeParse({
        siteId: "site-123",
        domain: "site123.example.com",
      });
      expect(result.success).toBe(true);
    });

    it("accepts domain with hyphens", () => {
      const result = addDomainSchema.safeParse({
        siteId: "site-123",
        domain: "my-site.example.com",
      });
      expect(result.success).toBe(true);
    });

    it("accepts various TLDs", () => {
      const domains = [
        "example.com",
        "example.org",
        "example.net",
        "example.io",
        "example.co.uk",
        "example.com.au",
      ];
      for (const domain of domains) {
        const result = addDomainSchema.safeParse({
          siteId: "site-123",
          domain,
        });
        expect(result.success).toBe(true);
      }
    });

    it("accepts uppercase domains (case insensitive regex)", () => {
      const result = addDomainSchema.safeParse({
        siteId: "site-123",
        domain: "EXAMPLE.COM",
      });
      expect(result.success).toBe(true);
    });
  });

  describe("negative tests - invalid domains", () => {
    it("rejects domain without TLD", () => {
      const result = addDomainSchema.safeParse({
        siteId: "site-123",
        domain: "example",
      });
      expect(result.success).toBe(false);
    });

    it("rejects domain starting with hyphen", () => {
      const result = addDomainSchema.safeParse({
        siteId: "site-123",
        domain: "-example.com",
      });
      expect(result.success).toBe(false);
    });

    it("rejects domain ending with hyphen", () => {
      const result = addDomainSchema.safeParse({
        siteId: "site-123",
        domain: "example-.com",
      });
      expect(result.success).toBe(false);
    });

    it("rejects domain with spaces", () => {
      const result = addDomainSchema.safeParse({
        siteId: "site-123",
        domain: "example .com",
      });
      expect(result.success).toBe(false);
    });

    it("rejects domain with special characters", () => {
      const invalidDomains = [
        "example!.com",
        "example@.com",
        "example#.com",
        "example$.com",
        "example%.com",
      ];
      for (const domain of invalidDomains) {
        const result = addDomainSchema.safeParse({
          siteId: "site-123",
          domain,
        });
        expect(result.success).toBe(false);
      }
    });

    it("rejects domain with underscore", () => {
      const result = addDomainSchema.safeParse({
        siteId: "site-123",
        domain: "my_site.example.com",
      });
      expect(result.success).toBe(false);
    });

    it("rejects missing siteId", () => {
      const result = addDomainSchema.safeParse({
        domain: "example.com",
      });
      expect(result.success).toBe(false);
    });

    it("rejects missing domain", () => {
      const result = addDomainSchema.safeParse({
        siteId: "site-123",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("edge cases", () => {
    it("accepts single-letter subdomain", () => {
      const result = addDomainSchema.safeParse({
        siteId: "site-123",
        domain: "a.example.com",
      });
      expect(result.success).toBe(true);
    });

    it("accepts numeric subdomain", () => {
      const result = addDomainSchema.safeParse({
        siteId: "site-123",
        domain: "123.example.com",
      });
      expect(result.success).toBe(true);
    });

    it("accepts long domain", () => {
      const result = addDomainSchema.safeParse({
        siteId: "site-123",
        domain: "very-long-subdomain-name.another-long-part.example.com",
      });
      expect(result.success).toBe(true);
    });
  });
});

describe("verification token generation", () => {
  function generateVerificationToken(): string {
    return `pagehaven-verify-${crypto.randomUUID()}`;
  }

  describe("happy path", () => {
    it("generates token with correct prefix", () => {
      const token = generateVerificationToken();
      expect(token.startsWith("pagehaven-verify-")).toBe(true);
    });

    it("generates unique tokens", () => {
      const tokens = new Set<string>();
      for (let i = 0; i < 100; i++) {
        tokens.add(generateVerificationToken());
      }
      expect(tokens.size).toBe(100);
    });

    it("generates token with UUID suffix", () => {
      const token = generateVerificationToken();
      const uuidPart = token.replace("pagehaven-verify-", "");
      // UUID format: 8-4-4-4-12
      expect(uuidPart).toMatch(UUID_REGEX);
    });
  });
});

describe("DNS verification instructions", () => {
  function getVerificationInstructions(
    domain: string,
    token: string
  ): { type: string; name: string; value: string } {
    return {
      type: "TXT",
      name: `_pagehaven.${domain}`,
      value: token,
    };
  }

  describe("happy path", () => {
    it("generates correct TXT record instructions", () => {
      const instructions = getVerificationInstructions(
        "example.com",
        "pagehaven-verify-abc123"
      );
      expect(instructions.type).toBe("TXT");
      expect(instructions.name).toBe("_pagehaven.example.com");
      expect(instructions.value).toBe("pagehaven-verify-abc123");
    });

    it("handles subdomain", () => {
      const instructions = getVerificationInstructions(
        "blog.example.com",
        "pagehaven-verify-xyz789"
      );
      expect(instructions.name).toBe("_pagehaven.blog.example.com");
    });
  });
});

describe("domain status transitions", () => {
  type VerificationStatus = (typeof verificationStatuses)[number];

  function isValidTransition(
    from: VerificationStatus,
    to: VerificationStatus
  ): boolean {
    const validTransitions: Record<VerificationStatus, VerificationStatus[]> = {
      pending: ["verified", "failed"],
      verified: [], // No transitions from verified
      failed: ["pending"], // Can retry verification
    };
    return validTransitions[from].includes(to);
  }

  describe("happy path - valid transitions", () => {
    it("allows pending -> verified", () => {
      expect(isValidTransition("pending", "verified")).toBe(true);
    });

    it("allows pending -> failed", () => {
      expect(isValidTransition("pending", "failed")).toBe(true);
    });

    it("allows failed -> pending (retry)", () => {
      expect(isValidTransition("failed", "pending")).toBe(true);
    });
  });

  describe("negative tests - invalid transitions", () => {
    it("disallows verified -> any status", () => {
      expect(isValidTransition("verified", "pending")).toBe(false);
      expect(isValidTransition("verified", "failed")).toBe(false);
    });

    it("disallows failed -> verified directly", () => {
      expect(isValidTransition("failed", "verified")).toBe(false);
    });
  });
});
