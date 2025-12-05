import { describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { mockDb } from "../test-utils/mock-db";

// Mock the database module
vi.mock("@pagehaven/db", () => mockDb);

// Deployment list schema
const listDeploymentsSchema = z.object({
  siteId: z.string(),
  limit: z.number().min(1).max(100).default(20),
  offset: z.number().min(0).default(0),
});

// Create deployment schema
const createDeploymentSchema = z.object({
  siteId: z.string(),
  commitHash: z.string().max(40).optional(),
  commitMessage: z.string().max(500).optional(),
});

// Finalize deployment schema
const finalizeDeploymentSchema = z.object({
  deploymentId: z.string(),
  fileCount: z.number().min(0),
  totalSize: z.number().min(0),
});

// Deployment statuses
const deploymentStatuses = ["pending", "processing", "live", "failed"] as const;
type DeploymentStatus = (typeof deploymentStatuses)[number];

describe("deployment router", () => {
  describe("smoke tests", () => {
    it("list deployments schema validates correctly", () => {
      expect(
        listDeploymentsSchema.safeParse({ siteId: "site-123" }).success
      ).toBe(true);
    });

    it("deployment statuses are defined", () => {
      expect(deploymentStatuses).toContain("pending");
      expect(deploymentStatuses).toContain("processing");
      expect(deploymentStatuses).toContain("live");
      expect(deploymentStatuses).toContain("failed");
    });
  });
});

describe("list deployments schema", () => {
  describe("happy path", () => {
    it("accepts siteId only (uses defaults)", () => {
      const result = listDeploymentsSchema.safeParse({
        siteId: "site-123",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.limit).toBe(20);
        expect(result.data.offset).toBe(0);
      }
    });

    it("accepts custom limit and offset", () => {
      const result = listDeploymentsSchema.safeParse({
        siteId: "site-123",
        limit: 50,
        offset: 100,
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.limit).toBe(50);
        expect(result.data.offset).toBe(100);
      }
    });

    it("accepts limit at minimum (1)", () => {
      const result = listDeploymentsSchema.safeParse({
        siteId: "site-123",
        limit: 1,
      });
      expect(result.success).toBe(true);
    });

    it("accepts limit at maximum (100)", () => {
      const result = listDeploymentsSchema.safeParse({
        siteId: "site-123",
        limit: 100,
      });
      expect(result.success).toBe(true);
    });

    it("accepts offset at minimum (0)", () => {
      const result = listDeploymentsSchema.safeParse({
        siteId: "site-123",
        offset: 0,
      });
      expect(result.success).toBe(true);
    });
  });

  describe("negative tests", () => {
    it("rejects missing siteId", () => {
      const result = listDeploymentsSchema.safeParse({
        limit: 20,
      });
      expect(result.success).toBe(false);
    });

    it("rejects limit below minimum", () => {
      const result = listDeploymentsSchema.safeParse({
        siteId: "site-123",
        limit: 0,
      });
      expect(result.success).toBe(false);
    });

    it("rejects limit above maximum", () => {
      const result = listDeploymentsSchema.safeParse({
        siteId: "site-123",
        limit: 101,
      });
      expect(result.success).toBe(false);
    });

    it("rejects negative offset", () => {
      const result = listDeploymentsSchema.safeParse({
        siteId: "site-123",
        offset: -1,
      });
      expect(result.success).toBe(false);
    });
  });
});

describe("create deployment schema", () => {
  describe("happy path", () => {
    it("accepts siteId only", () => {
      const result = createDeploymentSchema.safeParse({
        siteId: "site-123",
      });
      expect(result.success).toBe(true);
    });

    it("accepts with commit hash", () => {
      const result = createDeploymentSchema.safeParse({
        siteId: "site-123",
        commitHash: "abc123def456",
      });
      expect(result.success).toBe(true);
    });

    it("accepts with commit message", () => {
      const result = createDeploymentSchema.safeParse({
        siteId: "site-123",
        commitMessage: "Initial deployment",
      });
      expect(result.success).toBe(true);
    });

    it("accepts with both commit hash and message", () => {
      const result = createDeploymentSchema.safeParse({
        siteId: "site-123",
        commitHash: "abc123def456789012345678901234567890abcd",
        commitMessage: "Fix: Updated homepage",
      });
      expect(result.success).toBe(true);
    });

    it("accepts commit hash at maximum length (40)", () => {
      const result = createDeploymentSchema.safeParse({
        siteId: "site-123",
        commitHash: "a".repeat(40),
      });
      expect(result.success).toBe(true);
    });

    it("accepts commit message at maximum length (500)", () => {
      const result = createDeploymentSchema.safeParse({
        siteId: "site-123",
        commitMessage: "a".repeat(500),
      });
      expect(result.success).toBe(true);
    });
  });

  describe("negative tests", () => {
    it("rejects missing siteId", () => {
      const result = createDeploymentSchema.safeParse({
        commitHash: "abc123",
      });
      expect(result.success).toBe(false);
    });

    it("rejects commit hash exceeding max length", () => {
      const result = createDeploymentSchema.safeParse({
        siteId: "site-123",
        commitHash: "a".repeat(41),
      });
      expect(result.success).toBe(false);
    });

    it("rejects commit message exceeding max length", () => {
      const result = createDeploymentSchema.safeParse({
        siteId: "site-123",
        commitMessage: "a".repeat(501),
      });
      expect(result.success).toBe(false);
    });
  });
});

describe("finalize deployment schema", () => {
  describe("happy path", () => {
    it("accepts valid finalization data", () => {
      const result = finalizeDeploymentSchema.safeParse({
        deploymentId: "deploy-123",
        fileCount: 10,
        totalSize: 1_024_000,
      });
      expect(result.success).toBe(true);
    });

    it("accepts zero file count", () => {
      const result = finalizeDeploymentSchema.safeParse({
        deploymentId: "deploy-123",
        fileCount: 0,
        totalSize: 0,
      });
      expect(result.success).toBe(true);
    });

    it("accepts large file count and size", () => {
      const result = finalizeDeploymentSchema.safeParse({
        deploymentId: "deploy-123",
        fileCount: 10_000,
        totalSize: 1_000_000_000, // 1GB
      });
      expect(result.success).toBe(true);
    });
  });

  describe("negative tests", () => {
    it("rejects missing deploymentId", () => {
      const result = finalizeDeploymentSchema.safeParse({
        fileCount: 10,
        totalSize: 1024,
      });
      expect(result.success).toBe(false);
    });

    it("rejects missing fileCount", () => {
      const result = finalizeDeploymentSchema.safeParse({
        deploymentId: "deploy-123",
        totalSize: 1024,
      });
      expect(result.success).toBe(false);
    });

    it("rejects missing totalSize", () => {
      const result = finalizeDeploymentSchema.safeParse({
        deploymentId: "deploy-123",
        fileCount: 10,
      });
      expect(result.success).toBe(false);
    });

    it("rejects negative fileCount", () => {
      const result = finalizeDeploymentSchema.safeParse({
        deploymentId: "deploy-123",
        fileCount: -1,
        totalSize: 1024,
      });
      expect(result.success).toBe(false);
    });

    it("rejects negative totalSize", () => {
      const result = finalizeDeploymentSchema.safeParse({
        deploymentId: "deploy-123",
        fileCount: 10,
        totalSize: -1,
      });
      expect(result.success).toBe(false);
    });
  });
});

describe("deployment status transitions", () => {
  // Helper to validate status transitions
  function isValidTransition(
    from: DeploymentStatus,
    to: DeploymentStatus
  ): boolean {
    const validTransitions: Record<DeploymentStatus, DeploymentStatus[]> = {
      pending: ["processing", "failed"],
      processing: ["live", "failed"],
      live: [], // No transitions from live (except rollback which doesn't change status)
      failed: [], // No transitions from failed
    };
    return validTransitions[from].includes(to);
  }

  describe("happy path - valid transitions", () => {
    it("allows pending -> processing", () => {
      expect(isValidTransition("pending", "processing")).toBe(true);
    });

    it("allows pending -> failed", () => {
      expect(isValidTransition("pending", "failed")).toBe(true);
    });

    it("allows processing -> live", () => {
      expect(isValidTransition("processing", "live")).toBe(true);
    });

    it("allows processing -> failed", () => {
      expect(isValidTransition("processing", "failed")).toBe(true);
    });
  });

  describe("negative tests - invalid transitions", () => {
    it("disallows pending -> live (must go through processing)", () => {
      expect(isValidTransition("pending", "live")).toBe(false);
    });

    it("disallows live -> any status", () => {
      expect(isValidTransition("live", "pending")).toBe(false);
      expect(isValidTransition("live", "processing")).toBe(false);
      expect(isValidTransition("live", "failed")).toBe(false);
    });

    it("disallows failed -> any status", () => {
      expect(isValidTransition("failed", "pending")).toBe(false);
      expect(isValidTransition("failed", "processing")).toBe(false);
      expect(isValidTransition("failed", "live")).toBe(false);
    });

    it("disallows processing -> pending (no going back)", () => {
      expect(isValidTransition("processing", "pending")).toBe(false);
    });
  });
});

describe("storage path generation", () => {
  function generateStoragePath(siteId: string, deploymentId: string): string {
    return `sites/${siteId}/deployments/${deploymentId}/`;
  }

  describe("happy path", () => {
    it("generates correct storage path", () => {
      const path = generateStoragePath("site-123", "deploy-456");
      expect(path).toBe("sites/site-123/deployments/deploy-456/");
    });

    it("ends with trailing slash", () => {
      const path = generateStoragePath("site-123", "deploy-456");
      expect(path.endsWith("/")).toBe(true);
    });

    it("starts with sites/", () => {
      const path = generateStoragePath("site-123", "deploy-456");
      expect(path.startsWith("sites/")).toBe(true);
    });
  });

  describe("edge cases", () => {
    it("handles UUID-style IDs", () => {
      const path = generateStoragePath(
        "550e8400-e29b-41d4-a716-446655440000",
        "6ba7b810-9dad-11d1-80b4-00c04fd430c8"
      );
      expect(path).toBe(
        "sites/550e8400-e29b-41d4-a716-446655440000/deployments/6ba7b810-9dad-11d1-80b4-00c04fd430c8/"
      );
    });
  });
});
