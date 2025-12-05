import { describe, expect, it, vi } from "vitest";

// Mock chalk
vi.mock("chalk", () => ({
  default: {
    bold: (s: string) => s,
    green: (s: string) => s,
    red: (s: string) => s,
  },
}));

// Mock ora
vi.mock("ora", () => ({
  default: vi.fn(() => ({
    start: vi.fn().mockReturnThis(),
    text: "",
    succeed: vi.fn(),
    fail: vi.fn(),
    warn: vi.fn(),
  })),
}));

// Mock glob
vi.mock("glob", () => ({
  glob: vi.fn(() => Promise.resolve([])),
}));

// Mock api
vi.mock("../lib/api", () => ({
  api: {
    deployments: {
      create: vi.fn(),
      markProcessing: vi.fn(),
      finalize: vi.fn(),
    },
    upload: {
      uploadFiles: vi.fn(),
    },
  },
}));

// Mock config
vi.mock("../lib/config", () => ({
  isAuthenticated: vi.fn(() => true),
}));

describe("deploy command", () => {
  describe("deployCommand", () => {
    it("exports deployCommand", async () => {
      const { deployCommand } = await import("./deploy");
      expect(deployCommand).toBeDefined();
      expect(deployCommand.name()).toBe("deploy");
    });

    it("has correct description", async () => {
      const { deployCommand } = await import("./deploy");
      expect(deployCommand.description()).toBe(
        "Deploy a directory to a Pagehaven site"
      );
    });

    it("has site option", async () => {
      const { deployCommand } = await import("./deploy");
      const options = deployCommand.options;
      const siteOption = options.find((opt) => opt.long === "--site");
      expect(siteOption).toBeDefined();
    });

    it("has message option", async () => {
      const { deployCommand } = await import("./deploy");
      const options = deployCommand.options;
      const messageOption = options.find((opt) => opt.long === "--message");
      expect(messageOption).toBeDefined();
    });

    it("requires directory argument", async () => {
      const { deployCommand } = await import("./deploy");
      const args = deployCommand.registeredArguments;
      expect(args.length).toBe(1);
      expect(args[0]?.name()).toBe("directory");
    });
  });
});
