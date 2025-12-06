import { describe, expect, it, vi } from "vitest";

// Mock chalk
vi.mock("chalk", () => ({
  default: {
    bold: (s: string) => s,
    cyan: (s: string) => s,
    dim: (s: string) => s,
    green: (s: string) => s,
    red: (s: string) => s,
    yellow: (s: string) => s,
  },
}));

// Mock api
vi.mock("../lib/api", () => ({
  api: {
    sites: {
      list: vi.fn(),
    },
  },
}));

// Mock config
vi.mock("../lib/config", () => ({
  isAuthenticated: vi.fn(() => true),
}));

describe("sites command", () => {
  describe("sitesCommand", () => {
    it("exports sitesCommand", async () => {
      const { sitesCommand } = await import("./sites");
      expect(sitesCommand).toBeDefined();
      expect(sitesCommand.name()).toBe("sites");
    });

    it("has correct description", async () => {
      const { sitesCommand } = await import("./sites");
      expect(sitesCommand.description()).toBe("Manage your sites");
    });

    it("has list subcommand", async () => {
      const { sitesCommand } = await import("./sites");
      const listCommand = sitesCommand.commands.find(
        (cmd) => cmd.name() === "list"
      );
      expect(listCommand).toBeDefined();
      expect(listCommand?.description()).toBe("List all your sites");
    });
  });
});
