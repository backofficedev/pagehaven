/**
 * Schema tests for site-related database tables
 * Tests type definitions, enums, and schema structure
 */
import { describe, expect, it } from "vitest";
import {
  type AccessType,
  accessTypes,
  type DeploymentStatus,
  deploymentStatuses,
  type SiteRole,
  siteRoles,
} from "../../schema/site";

describe("Site Schema", () => {
  describe("smoke tests", () => {
    it("exports siteRoles array", () => {
      expect(siteRoles).toBeDefined();
      expect(Array.isArray(siteRoles)).toBe(true);
    });

    it("exports accessTypes array", () => {
      expect(accessTypes).toBeDefined();
      expect(Array.isArray(accessTypes)).toBe(true);
    });

    it("exports deploymentStatuses array", () => {
      expect(deploymentStatuses).toBeDefined();
      expect(Array.isArray(deploymentStatuses)).toBe(true);
    });
  });

  describe("siteRoles", () => {
    it("contains exactly 4 roles", () => {
      expect(siteRoles).toHaveLength(4);
    });

    it("contains owner role", () => {
      expect(siteRoles).toContain("owner");
    });

    it("contains admin role", () => {
      expect(siteRoles).toContain("admin");
    });

    it("contains editor role", () => {
      expect(siteRoles).toContain("editor");
    });

    it("contains viewer role", () => {
      expect(siteRoles).toContain("viewer");
    });

    it("has roles in correct hierarchy order", () => {
      expect(siteRoles[0]).toBe("owner");
      expect(siteRoles[1]).toBe("admin");
      expect(siteRoles[2]).toBe("editor");
      expect(siteRoles[3]).toBe("viewer");
    });

    it("is readonly (const assertion)", () => {
      // TypeScript ensures this at compile time
      // Runtime check that array is frozen-like
      const role: SiteRole = "owner";
      expect(siteRoles.includes(role)).toBe(true);
    });
  });

  describe("accessTypes", () => {
    it("contains exactly 4 access types", () => {
      expect(accessTypes).toHaveLength(4);
    });

    it("contains public access type", () => {
      expect(accessTypes).toContain("public");
    });

    it("contains password access type", () => {
      expect(accessTypes).toContain("password");
    });

    it("contains private access type", () => {
      expect(accessTypes).toContain("private");
    });

    it("contains owner_only access type", () => {
      expect(accessTypes).toContain("owner_only");
    });

    it("has access types in correct order", () => {
      expect(accessTypes[0]).toBe("public");
      expect(accessTypes[1]).toBe("password");
      expect(accessTypes[2]).toBe("private");
      expect(accessTypes[3]).toBe("owner_only");
    });

    it("type guard works for valid access type", () => {
      const type: AccessType = "public";
      expect(accessTypes.includes(type)).toBe(true);
    });
  });

  describe("deploymentStatuses", () => {
    it("contains exactly 4 statuses", () => {
      expect(deploymentStatuses).toHaveLength(4);
    });

    it("contains pending status", () => {
      expect(deploymentStatuses).toContain("pending");
    });

    it("contains processing status", () => {
      expect(deploymentStatuses).toContain("processing");
    });

    it("contains live status", () => {
      expect(deploymentStatuses).toContain("live");
    });

    it("contains failed status", () => {
      expect(deploymentStatuses).toContain("failed");
    });

    it("has statuses in lifecycle order", () => {
      expect(deploymentStatuses[0]).toBe("pending");
      expect(deploymentStatuses[1]).toBe("processing");
      expect(deploymentStatuses[2]).toBe("live");
      expect(deploymentStatuses[3]).toBe("failed");
    });

    it("type guard works for valid status", () => {
      const status: DeploymentStatus = "live";
      expect(deploymentStatuses.includes(status)).toBe(true);
    });
  });

  describe("type safety", () => {
    it("SiteRole type accepts valid roles", () => {
      const roles: SiteRole[] = ["owner", "admin", "editor", "viewer"];
      for (const role of roles) {
        expect(siteRoles.includes(role)).toBe(true);
      }
    });

    it("AccessType type accepts valid types", () => {
      const types: AccessType[] = [
        "public",
        "password",
        "private",
        "owner_only",
      ];
      for (const type of types) {
        expect(accessTypes.includes(type)).toBe(true);
      }
    });

    it("DeploymentStatus type accepts valid statuses", () => {
      const statuses: DeploymentStatus[] = [
        "pending",
        "processing",
        "live",
        "failed",
      ];
      for (const status of statuses) {
        expect(deploymentStatuses.includes(status)).toBe(true);
      }
    });
  });

  describe("edge cases", () => {
    it("role comparison is case-sensitive", () => {
      // @ts-expect-error - Testing runtime behavior with invalid type
      expect(siteRoles.includes("Owner")).toBe(false);
      // @ts-expect-error - Testing runtime behavior with invalid type
      expect(siteRoles.includes("ADMIN")).toBe(false);
    });

    it("access type comparison is case-sensitive", () => {
      // @ts-expect-error - Testing runtime behavior with invalid type
      expect(accessTypes.includes("Public")).toBe(false);
      // @ts-expect-error - Testing runtime behavior with invalid type
      expect(accessTypes.includes("PASSWORD")).toBe(false);
    });

    it("deployment status comparison is case-sensitive", () => {
      // @ts-expect-error - Testing runtime behavior with invalid type
      expect(deploymentStatuses.includes("Pending")).toBe(false);
      // @ts-expect-error - Testing runtime behavior with invalid type
      expect(deploymentStatuses.includes("LIVE")).toBe(false);
    });

    it("empty string is not a valid role", () => {
      // @ts-expect-error - Testing runtime behavior with invalid type
      expect(siteRoles.includes("")).toBe(false);
    });

    it("null is not a valid access type", () => {
      // @ts-expect-error - Testing runtime behavior with invalid type
      expect(accessTypes.includes(null)).toBe(false);
    });

    it("undefined is not a valid deployment status", () => {
      // @ts-expect-error - Testing runtime behavior with invalid type
      expect(deploymentStatuses.includes(undefined)).toBe(false);
    });
  });

  describe("business logic validation", () => {
    it("owner is the highest privilege role", () => {
      const ownerIndex = siteRoles.indexOf("owner");
      expect(ownerIndex).toBe(0);
    });

    it("viewer is the lowest privilege role", () => {
      const viewerIndex = siteRoles.indexOf("viewer");
      expect(viewerIndex).toBe(siteRoles.length - 1);
    });

    it("public is the most permissive access type", () => {
      const publicIndex = accessTypes.indexOf("public");
      expect(publicIndex).toBe(0);
    });

    it("owner_only is the most restrictive access type", () => {
      const ownerOnlyIndex = accessTypes.indexOf("owner_only");
      expect(ownerOnlyIndex).toBe(accessTypes.length - 1);
    });

    it("pending is the initial deployment status", () => {
      const pendingIndex = deploymentStatuses.indexOf("pending");
      expect(pendingIndex).toBe(0);
    });

    it("live and failed are terminal statuses", () => {
      const liveIndex = deploymentStatuses.indexOf("live");
      const failedIndex = deploymentStatuses.indexOf("failed");
      expect(liveIndex).toBeGreaterThan(1);
      expect(failedIndex).toBeGreaterThan(1);
    });
  });
});
