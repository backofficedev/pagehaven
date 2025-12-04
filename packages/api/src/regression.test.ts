/**
 * Regression tests for the Pagehaven API
 * Tests for known edge cases and previously fixed issues
 */
import { describe, expect, it } from "vitest";
import { hasPermission } from "./lib/permissions";

const SUBDOMAIN_REGEX = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/;
const LEADING_SLASHES_REGEX = /^\/+/;

describe("Regression: Subdomain Validation Edge Cases", () => {
  /**
   * Ensures subdomain validation handles all edge cases correctly
   */
  describe("boundary conditions", () => {
    it("rejects single hyphen subdomain", () => {
      expect(SUBDOMAIN_REGEX.test("-")).toBe(false);
    });

    it("rejects subdomain with only hyphens", () => {
      expect(SUBDOMAIN_REGEX.test("---")).toBe(false);
    });

    it("accepts single character subdomain (but length check should fail)", () => {
      // Regex allows single char, but business logic requires min 3
      expect(SUBDOMAIN_REGEX.test("a")).toBe(true);
      expect("a".length >= 3).toBe(false);
    });

    it("handles consecutive hyphens in middle", () => {
      // This is allowed by the regex
      expect(SUBDOMAIN_REGEX.test("my--site")).toBe(true);
    });

    it("rejects subdomain starting with number then hyphen at end", () => {
      expect(SUBDOMAIN_REGEX.test("123-")).toBe(false);
    });
  });
});

describe("Regression: Permission Edge Cases", () => {
  /**
   * Ensures permission checks work correctly at boundaries
   */
  describe("self-referential permissions", () => {
    it("each role has permission for itself", () => {
      expect(hasPermission("owner", "owner")).toBe(true);
      expect(hasPermission("admin", "admin")).toBe(true);
      expect(hasPermission("editor", "editor")).toBe(true);
      expect(hasPermission("viewer", "viewer")).toBe(true);
    });
  });

  describe("adjacent role permissions", () => {
    it("owner can act as admin", () => {
      expect(hasPermission("owner", "admin")).toBe(true);
    });

    it("admin cannot act as owner", () => {
      expect(hasPermission("admin", "owner")).toBe(false);
    });

    it("admin can act as editor", () => {
      expect(hasPermission("admin", "editor")).toBe(true);
    });

    it("editor cannot act as admin", () => {
      expect(hasPermission("editor", "admin")).toBe(false);
    });

    it("editor can act as viewer", () => {
      expect(hasPermission("editor", "viewer")).toBe(true);
    });

    it("viewer cannot act as editor", () => {
      expect(hasPermission("viewer", "editor")).toBe(false);
    });
  });
});

describe("Regression: File Path Handling", () => {
  /**
   * Ensures file path handling works correctly for all cases
   */
  function normalizeFilePath(path: string): string {
    let filePath = path.startsWith("/") ? path.slice(1) : path;
    if (!filePath || filePath.endsWith("/")) {
      filePath = `${filePath}index.html`;
    }
    return filePath;
  }

  describe("root path handling", () => {
    it("handles single slash", () => {
      expect(normalizeFilePath("/")).toBe("index.html");
    });

    it("handles empty string", () => {
      expect(normalizeFilePath("")).toBe("index.html");
    });

    it("handles double slash", () => {
      // After removing leading slash, we get "/" which ends with "/"
      expect(normalizeFilePath("//")).toBe("/index.html");
    });
  });

  describe("directory path handling", () => {
    it("handles directory with trailing slash", () => {
      expect(normalizeFilePath("/about/")).toBe("about/index.html");
    });

    it("handles nested directory with trailing slash", () => {
      expect(normalizeFilePath("/blog/posts/")).toBe("blog/posts/index.html");
    });

    it("handles directory without trailing slash (no index.html added)", () => {
      // This is intentional - clean URLs are handled by fallback logic
      expect(normalizeFilePath("/about")).toBe("about");
    });
  });

  describe("file path handling", () => {
    it("preserves file extension", () => {
      expect(normalizeFilePath("/styles.css")).toBe("styles.css");
    });

    it("preserves nested file path", () => {
      expect(normalizeFilePath("/assets/images/logo.png")).toBe(
        "assets/images/logo.png"
      );
    });

    it("handles file with multiple dots", () => {
      expect(normalizeFilePath("/app.min.js")).toBe("app.min.js");
    });
  });
});

describe("Regression: Access Type Transitions", () => {
  /**
   * Ensures access type changes work correctly
   */
  type AccessType = "public" | "password" | "private" | "owner_only";

  function validateAccessTypeChange(
    _from: AccessType,
    to: AccessType,
    hasPassword: boolean
  ): { valid: boolean; error?: string } {
    // Password type requires a password
    if (to === "password" && !hasPassword) {
      return {
        valid: false,
        error: "Password required for password-protected sites",
      };
    }
    return { valid: true };
  }

  describe("valid transitions", () => {
    it("allows public to password with password", () => {
      const result = validateAccessTypeChange("public", "password", true);
      expect(result.valid).toBe(true);
    });

    it("allows public to private", () => {
      const result = validateAccessTypeChange("public", "private", false);
      expect(result.valid).toBe(true);
    });

    it("allows public to owner_only", () => {
      const result = validateAccessTypeChange("public", "owner_only", false);
      expect(result.valid).toBe(true);
    });

    it("allows password to public (clears password)", () => {
      const result = validateAccessTypeChange("password", "public", false);
      expect(result.valid).toBe(true);
    });
  });

  describe("invalid transitions", () => {
    it("rejects password type without password", () => {
      const result = validateAccessTypeChange("public", "password", false);
      expect(result.valid).toBe(false);
      expect(result.error).toContain("Password required");
    });
  });
});

describe("Regression: Invite Expiration", () => {
  /**
   * Ensures invite expiration is handled correctly
   */
  function isInviteValid(expiresAt: Date | null): boolean {
    if (!expiresAt) {
      return true; // No expiration = always valid
    }
    return expiresAt > new Date();
  }

  describe("expiration handling", () => {
    it("accepts invite without expiration", () => {
      expect(isInviteValid(null)).toBe(true);
    });

    it("accepts invite with future expiration", () => {
      const futureDate = new Date(Date.now() + 86_400_000); // +1 day
      expect(isInviteValid(futureDate)).toBe(true);
    });

    it("rejects invite with past expiration", () => {
      const pastDate = new Date(Date.now() - 86_400_000); // -1 day
      expect(isInviteValid(pastDate)).toBe(false);
    });

    it("handles expiration at exact current time", () => {
      // This is a boundary case - invite expires at exactly now
      const now = new Date();
      // Should be invalid since expiresAt is not > now
      expect(isInviteValid(now)).toBe(false);
    });
  });
});

describe("Regression: Member Role Assignment", () => {
  /**
   * Ensures role assignment rules are enforced
   */
  type SiteRole = "owner" | "admin" | "editor" | "viewer";

  function canAssignRole(
    assignerRole: SiteRole,
    targetRole: SiteRole
  ): boolean {
    // Can only assign roles at or below your own level
    return hasPermission(assignerRole, targetRole);
  }

  describe("role assignment rules", () => {
    it("owner can assign any role", () => {
      expect(canAssignRole("owner", "owner")).toBe(true);
      expect(canAssignRole("owner", "admin")).toBe(true);
      expect(canAssignRole("owner", "editor")).toBe(true);
      expect(canAssignRole("owner", "viewer")).toBe(true);
    });

    it("admin can assign admin and below", () => {
      expect(canAssignRole("admin", "owner")).toBe(false);
      expect(canAssignRole("admin", "admin")).toBe(true);
      expect(canAssignRole("admin", "editor")).toBe(true);
      expect(canAssignRole("admin", "viewer")).toBe(true);
    });

    it("editor can assign editor and below", () => {
      expect(canAssignRole("editor", "owner")).toBe(false);
      expect(canAssignRole("editor", "admin")).toBe(false);
      expect(canAssignRole("editor", "editor")).toBe(true);
      expect(canAssignRole("editor", "viewer")).toBe(true);
    });

    it("viewer can only assign viewer", () => {
      expect(canAssignRole("viewer", "owner")).toBe(false);
      expect(canAssignRole("viewer", "admin")).toBe(false);
      expect(canAssignRole("viewer", "editor")).toBe(false);
      expect(canAssignRole("viewer", "viewer")).toBe(true);
    });
  });
});

describe("Regression: Last Owner Protection", () => {
  /**
   * Ensures the last owner cannot be removed from a site
   */
  function canRemoveOwner(ownerCount: number, isTargetOwner: boolean): boolean {
    if (isTargetOwner && ownerCount <= 1) {
      return false; // Cannot remove the last owner
    }
    return true;
  }

  describe("owner removal rules", () => {
    it("allows removing owner when multiple owners exist", () => {
      expect(canRemoveOwner(2, true)).toBe(true);
      expect(canRemoveOwner(3, true)).toBe(true);
    });

    it("prevents removing the last owner", () => {
      expect(canRemoveOwner(1, true)).toBe(false);
    });

    it("allows removing non-owners regardless of owner count", () => {
      expect(canRemoveOwner(1, false)).toBe(true);
      expect(canRemoveOwner(0, false)).toBe(true);
    });
  });
});

describe("Regression: Storage Key Generation", () => {
  /**
   * Ensures storage keys are generated correctly
   */
  function getDeploymentFileKey(
    siteId: string,
    deploymentId: string,
    filePath: string
  ): string {
    const normalizedPath = filePath.replace(LEADING_SLASHES_REGEX, "");
    return `sites/${siteId}/deployments/${deploymentId}/${normalizedPath}`;
  }

  describe("key generation", () => {
    it("handles file path with leading slash", () => {
      const key = getDeploymentFileKey("site-1", "deploy-1", "/index.html");
      expect(key).toBe("sites/site-1/deployments/deploy-1/index.html");
    });

    it("handles file path without leading slash", () => {
      const key = getDeploymentFileKey("site-1", "deploy-1", "index.html");
      expect(key).toBe("sites/site-1/deployments/deploy-1/index.html");
    });

    it("handles file path with multiple leading slashes", () => {
      const key = getDeploymentFileKey("site-1", "deploy-1", "///index.html");
      expect(key).toBe("sites/site-1/deployments/deploy-1/index.html");
    });

    it("preserves internal path structure", () => {
      const key = getDeploymentFileKey(
        "site-1",
        "deploy-1",
        "/assets/css/styles.css"
      );
      expect(key).toBe(
        "sites/site-1/deployments/deploy-1/assets/css/styles.css"
      );
    });
  });
});

describe("Regression: Date String Generation", () => {
  /**
   * Ensures date strings are generated in correct format
   */
  function getDateString(date: Date = new Date()): string {
    return date.toISOString().split("T")[0] ?? "";
  }

  describe("date format", () => {
    it("generates YYYY-MM-DD format", () => {
      const date = new Date("2024-03-15T12:00:00Z");
      expect(getDateString(date)).toBe("2024-03-15");
    });

    it("pads single-digit months", () => {
      const date = new Date("2024-01-05T12:00:00Z");
      expect(getDateString(date)).toBe("2024-01-05");
    });

    it("pads single-digit days", () => {
      const date = new Date("2024-12-01T12:00:00Z");
      expect(getDateString(date)).toBe("2024-12-01");
    });

    it("handles year boundaries", () => {
      const newYearsEve = new Date("2024-12-31T23:59:59Z");
      const newYearsDay = new Date("2025-01-01T00:00:00Z");
      expect(getDateString(newYearsEve)).toBe("2024-12-31");
      expect(getDateString(newYearsDay)).toBe("2025-01-01");
    });
  });
});
