import { describe, expect, it, vi } from "vitest";

// Mock commander with Command class
const mockCommand = {
  name: vi.fn().mockReturnThis(),
  description: vi.fn().mockReturnThis(),
  option: vi.fn().mockReturnThis(),
  action: vi.fn().mockReturnThis(),
};

vi.mock("commander", () => ({
  program: {
    name: vi.fn().mockReturnThis(),
    description: vi.fn().mockReturnThis(),
    version: vi.fn().mockReturnThis(),
    addCommand: vi.fn().mockReturnThis(),
    parse: vi.fn(),
  },
  Command: vi.fn(() => mockCommand),
}));

// Mock commands
vi.mock("./commands/deploy", () => ({
  deployCommand: { name: () => "deploy" },
}));

vi.mock("./commands/login", () => ({
  loginCommand: { name: () => "login" },
  logoutCommand: { name: () => "logout" },
  whoamiCommand: { name: () => "whoami" },
}));

vi.mock("./commands/sites", () => ({
  sitesCommand: { name: () => "sites" },
}));

vi.mock("./commands/init", () => ({
  initCommand: { name: () => "init" },
}));

vi.mock("./commands/link", () => ({
  linkCommand: { name: () => "link" },
}));

vi.mock("./commands/status", () => ({
  statusCommand: { name: () => "status" },
}));

describe("CLI index", () => {
  it("imports without error", async () => {
    // This test verifies the module can be imported
    await expect(import("./index")).resolves.toBeDefined();
  });

  it("registers all commands", async () => {
    const { program } = await import("commander");
    await import("./index");

    expect(program.addCommand).toHaveBeenCalledTimes(8);
  });
});
