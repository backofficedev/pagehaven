/**
 * Exploratory tests for edge cases and boundary conditions
 * These tests explore unusual scenarios and potential failure modes
 */
import { getContentType, mimeTypes } from "@pagehaven/utils/mime-types";
import { describe, expect, it } from "vitest";
import { hasPermission } from "./lib/permissions";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const SUBDOMAIN_REGEX = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/;
const DOMAIN_REGEX =
  /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)*$/i;
const DATE_FORMAT_REGEX = /^\d{4}-\d{2}-\d{2}$/;

describe("Exploratory Tests", () => {
  describe("permission edge cases", () => {
    it("handles permission check with same role", () => {
      expect(hasPermission("owner", "owner")).toBe(true);
      expect(hasPermission("admin", "admin")).toBe(true);
      expect(hasPermission("editor", "editor")).toBe(true);
      expect(hasPermission("viewer", "viewer")).toBe(true);
    });

    it("handles permission hierarchy boundaries", () => {
      // Owner can do everything
      expect(hasPermission("owner", "viewer")).toBe(true);
      // Viewer can only view
      expect(hasPermission("viewer", "owner")).toBe(false);
      expect(hasPermission("viewer", "admin")).toBe(false);
      expect(hasPermission("viewer", "editor")).toBe(false);
    });

    it("handles adjacent roles in hierarchy", () => {
      expect(hasPermission("admin", "editor")).toBe(true);
      expect(hasPermission("editor", "admin")).toBe(false);
      expect(hasPermission("editor", "viewer")).toBe(true);
      expect(hasPermission("viewer", "editor")).toBe(false);
    });
  });

  describe("subdomain validation edge cases", () => {
    it("rejects subdomains starting with hyphen", () => {
      expect(SUBDOMAIN_REGEX.test("-invalid")).toBe(false);
    });

    it("rejects subdomains ending with hyphen", () => {
      expect(SUBDOMAIN_REGEX.test("invalid-")).toBe(false);
    });

    it("accepts single character subdomain", () => {
      expect(SUBDOMAIN_REGEX.test("a")).toBe(true);
      expect(SUBDOMAIN_REGEX.test("1")).toBe(true);
    });

    it("accepts two character subdomain", () => {
      expect(SUBDOMAIN_REGEX.test("ab")).toBe(true);
      expect(SUBDOMAIN_REGEX.test("12")).toBe(true);
      expect(SUBDOMAIN_REGEX.test("a1")).toBe(true);
    });

    it("rejects uppercase subdomains", () => {
      expect(SUBDOMAIN_REGEX.test("INVALID")).toBe(false);
      expect(SUBDOMAIN_REGEX.test("Invalid")).toBe(false);
    });

    it("rejects subdomains with special characters", () => {
      expect(SUBDOMAIN_REGEX.test("in_valid")).toBe(false);
      expect(SUBDOMAIN_REGEX.test("in.valid")).toBe(false);
      expect(SUBDOMAIN_REGEX.test("in@valid")).toBe(false);
      expect(SUBDOMAIN_REGEX.test("in valid")).toBe(false);
    });

    it("accepts subdomains with hyphens in middle", () => {
      expect(SUBDOMAIN_REGEX.test("my-site")).toBe(true);
      expect(SUBDOMAIN_REGEX.test("my-cool-site")).toBe(true);
      expect(SUBDOMAIN_REGEX.test("a-b-c-d")).toBe(true);
    });

    it("rejects empty subdomain", () => {
      expect(SUBDOMAIN_REGEX.test("")).toBe(false);
    });

    it("handles very long subdomains", () => {
      const longSubdomain = "a".repeat(63);
      expect(SUBDOMAIN_REGEX.test(longSubdomain)).toBe(true);
    });
  });

  describe("domain validation edge cases", () => {
    it("accepts valid domains", () => {
      expect(DOMAIN_REGEX.test("example.com")).toBe(true);
      expect(DOMAIN_REGEX.test("sub.example.com")).toBe(true);
      expect(DOMAIN_REGEX.test("deep.sub.example.com")).toBe(true);
    });

    it("accepts domains with hyphens", () => {
      expect(DOMAIN_REGEX.test("my-site.com")).toBe(true);
      expect(DOMAIN_REGEX.test("my-cool-site.example.com")).toBe(true);
    });

    it("accepts domains with numbers", () => {
      expect(DOMAIN_REGEX.test("site123.com")).toBe(true);
      expect(DOMAIN_REGEX.test("123.example.com")).toBe(true);
    });

    it("rejects domains starting with hyphen", () => {
      expect(DOMAIN_REGEX.test("-invalid.com")).toBe(false);
    });

    it("rejects domains ending with hyphen", () => {
      expect(DOMAIN_REGEX.test("invalid-.com")).toBe(false);
    });

    it("rejects domains with consecutive dots", () => {
      expect(DOMAIN_REGEX.test("invalid..com")).toBe(false);
    });
  });

  describe("UUID validation edge cases", () => {
    it("accepts valid UUIDs", () => {
      expect(UUID_REGEX.test("550e8400-e29b-41d4-a716-446655440000")).toBe(
        true
      );
      expect(UUID_REGEX.test("00000000-0000-0000-0000-000000000000")).toBe(
        true
      );
      expect(UUID_REGEX.test("ffffffff-ffff-ffff-ffff-ffffffffffff")).toBe(
        true
      );
    });

    it("accepts uppercase UUIDs", () => {
      expect(UUID_REGEX.test("550E8400-E29B-41D4-A716-446655440000")).toBe(
        true
      );
    });

    it("rejects UUIDs with wrong format", () => {
      expect(UUID_REGEX.test("550e8400e29b41d4a716446655440000")).toBe(false);
      expect(UUID_REGEX.test("550e8400-e29b-41d4-a716")).toBe(false);
      expect(UUID_REGEX.test("not-a-uuid")).toBe(false);
    });

    it("rejects UUIDs with invalid characters", () => {
      expect(UUID_REGEX.test("550e8400-e29b-41d4-a716-44665544000g")).toBe(
        false
      );
      expect(UUID_REGEX.test("550e8400-e29b-41d4-a716-44665544000!")).toBe(
        false
      );
    });
  });

  describe("date string edge cases", () => {
    it("accepts valid date strings", () => {
      expect(DATE_FORMAT_REGEX.test("2024-01-01")).toBe(true);
      expect(DATE_FORMAT_REGEX.test("2024-12-31")).toBe(true);
    });

    it("rejects invalid date formats", () => {
      expect(DATE_FORMAT_REGEX.test("01-01-2024")).toBe(false);
      expect(DATE_FORMAT_REGEX.test("2024/01/01")).toBe(false);
      expect(DATE_FORMAT_REGEX.test("2024-1-1")).toBe(false);
    });
  });

  describe("file path edge cases", () => {
    const normalizeFilePath = (path: string): string => {
      let filePath = path.startsWith("/") ? path.slice(1) : path;
      if (!filePath || filePath.endsWith("/")) {
        filePath = `${filePath}index.html`;
      }
      return filePath;
    };

    it("handles root path", () => {
      expect(normalizeFilePath("/")).toBe("index.html");
      expect(normalizeFilePath("")).toBe("index.html");
    });

    it("handles nested directories", () => {
      expect(normalizeFilePath("/a/b/c/")).toBe("a/b/c/index.html");
      expect(normalizeFilePath("a/b/c/")).toBe("a/b/c/index.html");
    });

    it("handles files with multiple extensions", () => {
      expect(normalizeFilePath("/file.min.js")).toBe("file.min.js");
      expect(normalizeFilePath("/archive.tar.gz")).toBe("archive.tar.gz");
    });

    it("handles files with dots in name", () => {
      expect(normalizeFilePath("/my.file.name.txt")).toBe("my.file.name.txt");
    });

    it("handles deeply nested paths", () => {
      expect(normalizeFilePath("/a/b/c/d/e/f/g/file.txt")).toBe(
        "a/b/c/d/e/f/g/file.txt"
      );
    });

    it("handles paths with special characters", () => {
      expect(normalizeFilePath("/file%20name.txt")).toBe("file%20name.txt");
      expect(normalizeFilePath("/file+name.txt")).toBe("file+name.txt");
    });
  });

  describe("storage key edge cases", () => {
    const getDeploymentFileKey = (
      siteId: string,
      deploymentId: string,
      filePath: string
    ): string => {
      const normalizedPath = filePath.startsWith("/")
        ? filePath.slice(1)
        : filePath;
      return `sites/${siteId}/deployments/${deploymentId}/${normalizedPath}`;
    };

    it("generates correct key for simple path", () => {
      expect(getDeploymentFileKey("site-1", "deploy-1", "index.html")).toBe(
        "sites/site-1/deployments/deploy-1/index.html"
      );
    });

    it("handles leading slash in file path", () => {
      expect(getDeploymentFileKey("site-1", "deploy-1", "/index.html")).toBe(
        "sites/site-1/deployments/deploy-1/index.html"
      );
    });

    it("handles nested file paths", () => {
      expect(
        getDeploymentFileKey("site-1", "deploy-1", "assets/css/main.css")
      ).toBe("sites/site-1/deployments/deploy-1/assets/css/main.css");
    });

    it("handles UUIDs as IDs", () => {
      const siteId = "550e8400-e29b-41d4-a716-446655440000";
      const deployId = "660e8400-e29b-41d4-a716-446655440001";
      const key = getDeploymentFileKey(siteId, deployId, "file.txt");
      expect(key).toContain(siteId);
      expect(key).toContain(deployId);
    });
  });

  describe("content type edge cases", () => {
    it("has expected mime types defined", () => {
      expect(mimeTypes.html).toBe("text/html");
      expect(mimeTypes.css).toBe("text/css");
      expect(mimeTypes.js).toBe("application/javascript");
    });

    it("handles files without extension", () => {
      expect(getContentType("Makefile")).toBe("application/octet-stream");
      expect(getContentType("README")).toBe("application/octet-stream");
      expect(getContentType("LICENSE")).toBe("application/octet-stream");
    });

    it("handles hidden files", () => {
      expect(getContentType(".gitignore")).toBe("application/octet-stream");
      expect(getContentType(".env")).toBe("application/octet-stream");
    });

    it("handles case insensitivity", () => {
      expect(getContentType("file.HTML")).toBe("text/html");
      expect(getContentType("file.CSS")).toBe("text/css");
      expect(getContentType("file.JS")).toBe("application/javascript");
    });

    it("handles double extensions", () => {
      expect(getContentType("file.min.js")).toBe("application/javascript");
      expect(getContentType("file.bundle.css")).toBe("text/css");
    });

    it("handles unknown extensions", () => {
      expect(getContentType("file.xyz")).toBe("application/octet-stream");
      expect(getContentType("file.unknown")).toBe("application/octet-stream");
    });
  });

  describe("access control edge cases", () => {
    type AccessType = "public" | "password" | "private" | "owner_only";

    const accessHierarchy: Record<AccessType, number> = {
      public: 0,
      password: 1,
      private: 2,
      owner_only: 3,
    };

    const isMoreRestrictive = (a: AccessType, b: AccessType): boolean =>
      accessHierarchy[a] > accessHierarchy[b];

    it("public is least restrictive", () => {
      expect(isMoreRestrictive("password", "public")).toBe(true);
      expect(isMoreRestrictive("private", "public")).toBe(true);
      expect(isMoreRestrictive("owner_only", "public")).toBe(true);
    });

    it("owner_only is most restrictive", () => {
      expect(isMoreRestrictive("owner_only", "public")).toBe(true);
      expect(isMoreRestrictive("owner_only", "password")).toBe(true);
      expect(isMoreRestrictive("owner_only", "private")).toBe(true);
    });

    it("same access type is not more restrictive", () => {
      expect(isMoreRestrictive("public", "public")).toBe(false);
      expect(isMoreRestrictive("private", "private")).toBe(false);
    });
  });

  describe("deployment status transitions", () => {
    type DeploymentStatus = "pending" | "processing" | "live" | "failed";

    const validTransitions: Record<DeploymentStatus, DeploymentStatus[]> = {
      pending: ["processing", "failed"],
      processing: ["live", "failed"],
      live: [], // Terminal state
      failed: [], // Terminal state
    };

    const canTransition = (
      from: DeploymentStatus,
      to: DeploymentStatus
    ): boolean => validTransitions[from].includes(to);

    it("pending can transition to processing", () => {
      expect(canTransition("pending", "processing")).toBe(true);
    });

    it("pending can transition to failed", () => {
      expect(canTransition("pending", "failed")).toBe(true);
    });

    it("processing can transition to live", () => {
      expect(canTransition("processing", "live")).toBe(true);
    });

    it("processing can transition to failed", () => {
      expect(canTransition("processing", "failed")).toBe(true);
    });

    it("live cannot transition", () => {
      expect(canTransition("live", "pending")).toBe(false);
      expect(canTransition("live", "processing")).toBe(false);
      expect(canTransition("live", "failed")).toBe(false);
    });

    it("failed cannot transition", () => {
      expect(canTransition("failed", "pending")).toBe(false);
      expect(canTransition("failed", "processing")).toBe(false);
      expect(canTransition("failed", "live")).toBe(false);
    });

    it("cannot skip states", () => {
      expect(canTransition("pending", "live")).toBe(false);
    });
  });
});
