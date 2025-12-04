import { describe, expect, it } from "vitest";
import { hasPermission } from "./permissions";

describe("permissions", () => {
  describe("smoke tests", () => {
    it("hasPermission function exists and is callable", () => {
      expect(typeof hasPermission).toBe("function");
    });
  });

  describe("happy path - role hierarchy", () => {
    it("owner has permission for all roles", () => {
      expect(hasPermission("owner", "owner")).toBe(true);
      expect(hasPermission("owner", "admin")).toBe(true);
      expect(hasPermission("owner", "editor")).toBe(true);
      expect(hasPermission("owner", "viewer")).toBe(true);
    });

    it("admin has permission for admin and below", () => {
      expect(hasPermission("admin", "admin")).toBe(true);
      expect(hasPermission("admin", "editor")).toBe(true);
      expect(hasPermission("admin", "viewer")).toBe(true);
    });

    it("editor has permission for editor and below", () => {
      expect(hasPermission("editor", "editor")).toBe(true);
      expect(hasPermission("editor", "viewer")).toBe(true);
    });

    it("viewer has permission only for viewer", () => {
      expect(hasPermission("viewer", "viewer")).toBe(true);
    });
  });

  describe("negative tests - insufficient permissions", () => {
    it("admin cannot access owner-level", () => {
      expect(hasPermission("admin", "owner")).toBe(false);
    });

    it("editor cannot access admin or owner level", () => {
      expect(hasPermission("editor", "admin")).toBe(false);
      expect(hasPermission("editor", "owner")).toBe(false);
    });

    it("viewer cannot access any higher level", () => {
      expect(hasPermission("viewer", "editor")).toBe(false);
      expect(hasPermission("viewer", "admin")).toBe(false);
      expect(hasPermission("viewer", "owner")).toBe(false);
    });
  });
});
