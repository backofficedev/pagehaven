import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Mock chalk
vi.mock("chalk", () => ({
  default: {
    green: (s: string) => s,
    yellow: (s: string) => s,
  },
}));

// Mock config
vi.mock("../lib/config", () => ({
  clearToken: vi.fn(),
  isAuthenticated: vi.fn(),
  setToken: vi.fn(),
}));

describe("login commands", () => {
  let consoleSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleSpy = vi.spyOn(console, "log").mockImplementation(vi.fn());
  });

  afterEach(() => {
    consoleSpy.mockRestore();
    vi.clearAllMocks();
  });

  describe("loginCommand", () => {
    it("exports loginCommand", async () => {
      const { loginCommand } = await import("./login");
      expect(loginCommand).toBeDefined();
      expect(loginCommand.name()).toBe("login");
    });

    it("has correct description", async () => {
      const { loginCommand } = await import("./login");
      expect(loginCommand.description()).toBe("Authenticate with Pagehaven");
    });

    it("has token option", async () => {
      const { loginCommand } = await import("./login");
      const options = loginCommand.options;
      const tokenOption = options.find((opt) => opt.long === "--token");
      expect(tokenOption).toBeDefined();
    });
  });

  describe("logoutCommand", () => {
    it("exports logoutCommand", async () => {
      const { logoutCommand } = await import("./login");
      expect(logoutCommand).toBeDefined();
      expect(logoutCommand.name()).toBe("logout");
    });

    it("has correct description", async () => {
      const { logoutCommand } = await import("./login");
      expect(logoutCommand.description()).toBe("Log out from Pagehaven");
    });
  });

  describe("whoamiCommand", () => {
    it("exports whoamiCommand", async () => {
      const { whoamiCommand } = await import("./login");
      expect(whoamiCommand).toBeDefined();
      expect(whoamiCommand.name()).toBe("whoami");
    });

    it("has correct description", async () => {
      const { whoamiCommand } = await import("./login");
      expect(whoamiCommand.description()).toBe(
        "Show current authentication status"
      );
    });
  });
});
