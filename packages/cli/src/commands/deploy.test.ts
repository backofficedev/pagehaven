import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Store mock functions for dynamic control
const mockSpinner = {
  start: vi.fn().mockReturnThis(),
  text: "",
  succeed: vi.fn(),
  fail: vi.fn(),
  warn: vi.fn(),
};

const mockOra = vi.fn(() => mockSpinner);

const mockGlob = vi.fn();
const mockApiCreate = vi.fn();
const mockApiMarkProcessing = vi.fn();
const mockApiFinalize = vi.fn();
const mockApiUploadFiles = vi.fn();
const mockIsAuthenticated = vi.fn();
const mockProcessExit = vi.fn();
const mockConsoleLog = vi.fn();
const mockConsoleError = vi.fn();

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
  default: () => mockOra(),
}));

// Mock glob
vi.mock("glob", () => ({
  glob: (...args: unknown[]) => mockGlob(...args),
}));

// Mock api
vi.mock("../lib/api", () => ({
  api: {
    deployments: {
      create: (...args: unknown[]) => mockApiCreate(...args),
      markProcessing: (...args: unknown[]) => mockApiMarkProcessing(...args),
      finalize: (...args: unknown[]) => mockApiFinalize(...args),
    },
    upload: {
      uploadFiles: (...args: unknown[]) => mockApiUploadFiles(...args),
    },
  },
}));

// Mock config
vi.mock("../lib/config", () => ({
  isAuthenticated: () => mockIsAuthenticated(),
}));

describe("deploy command", () => {
  let testDir: string;
  let originalExit: typeof process.exit;
  let originalConsoleLog: typeof console.log;
  let originalConsoleError: typeof console.error;

  beforeEach(() => {
    vi.clearAllMocks();

    // Create temp directory for tests
    testDir = join(tmpdir(), `deploy-test-${Date.now()}`);
    mkdirSync(testDir, { recursive: true });

    // Mock process.exit
    originalExit = process.exit;
    process.exit = mockProcessExit as unknown as typeof process.exit;

    // Mock console
    originalConsoleLog = console.log;
    originalConsoleError = console.error;
    console.log = mockConsoleLog;
    console.error = mockConsoleError;

    // Default mock implementations
    mockIsAuthenticated.mockReturnValue(true);
    mockGlob.mockResolvedValue([]);
    mockApiCreate.mockResolvedValue({ id: "deploy-123" });
    mockApiMarkProcessing.mockResolvedValue({});
    mockApiFinalize.mockResolvedValue({});
    mockApiUploadFiles.mockResolvedValue({ uploaded: 1 });
  });

  afterEach(() => {
    // Cleanup temp directory
    try {
      rmSync(testDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }

    // Restore process.exit and console
    process.exit = originalExit;
    console.log = originalConsoleLog;
    console.error = originalConsoleError;
  });

  /** Helper to setup a basic deploy test with an index.html file */
  async function setupBasicDeployTest() {
    mockGlob.mockResolvedValue(["index.html"]);
    writeFileSync(join(testDir, "index.html"), "<html></html>");
    const { deployCommand } = await import("./deploy");
    return { deployCommand };
  }

  /** Helper to run deploy command with default args */
  async function runDeployCommand(deployCommand: {
    parseAsync: (args: string[]) => Promise<unknown>;
  }) {
    await deployCommand.parseAsync(["node", "deploy", testDir, "-s", "site-1"]);
  }

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

  describe("authentication check", () => {
    it("exits with error when not authenticated", async () => {
      mockIsAuthenticated.mockReturnValue(false);

      const { deployCommand } = await import("./deploy");
      await deployCommand.parseAsync([
        "node",
        "deploy",
        testDir,
        "-s",
        "site-1",
      ]);

      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining("Not authenticated")
      );
      expect(mockProcessExit).toHaveBeenCalledWith(1);
    });
  });

  describe("site ID validation", () => {
    it("exits with error when site ID is not provided", async () => {
      mockIsAuthenticated.mockReturnValue(true);

      const { deployCommand } = await import("./deploy");
      await deployCommand.parseAsync(["node", "deploy", testDir]);

      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining("Site ID is required")
      );
      expect(mockProcessExit).toHaveBeenCalledWith(1);
    });
  });

  describe("file scanning", () => {
    it("fails when no files found in directory", async () => {
      mockGlob.mockResolvedValue([]);

      const { deployCommand } = await import("./deploy");
      await deployCommand.parseAsync([
        "node",
        "deploy",
        testDir,
        "-s",
        "site-1",
      ]);

      expect(mockSpinner.fail).toHaveBeenCalledWith(
        "No files found in directory"
      );
      expect(mockProcessExit).toHaveBeenCalledWith(1);
    });

    it("scans directory with correct glob options", async () => {
      const { deployCommand } = await setupBasicDeployTest();
      await runDeployCommand(deployCommand);

      expect(mockGlob).toHaveBeenCalledWith("**/*", {
        cwd: testDir,
        nodir: true,
        dot: false,
        ignore: [
          "**/node_modules/**",
          "**/.git/**",
          "**/.DS_Store",
          "**/Thumbs.db",
        ],
      });
    });
  });

  describe("file size validation", () => {
    it("skips files larger than 10MB", async () => {
      const largeFilePath = "large-file.bin";
      mockGlob.mockResolvedValue([largeFilePath, "small.html"]);

      // Create actual files - one large, one small
      const largeContent = Buffer.alloc(11 * 1024 * 1024); // 11MB
      writeFileSync(join(testDir, largeFilePath), largeContent);
      writeFileSync(join(testDir, "small.html"), "<html></html>");

      const { deployCommand } = await import("./deploy");
      await deployCommand.parseAsync([
        "node",
        "deploy",
        testDir,
        "-s",
        "site-1",
      ]);

      expect(mockSpinner.warn).toHaveBeenCalledWith(
        expect.stringContaining("Skipping large-file.bin")
      );
    });
  });

  describe("deployment flow", () => {
    it("creates deployment with site ID and message", async () => {
      mockGlob.mockResolvedValue(["index.html"]);
      writeFileSync(join(testDir, "index.html"), "<html></html>");

      const { deployCommand } = await import("./deploy");
      await deployCommand.parseAsync([
        "node",
        "deploy",
        testDir,
        "-s",
        "site-123",
        "-m",
        "Initial deploy",
      ]);

      expect(mockApiCreate).toHaveBeenCalledWith("site-123", "Initial deploy");
    });

    it("marks deployment as processing", async () => {
      mockGlob.mockResolvedValue(["index.html"]);
      writeFileSync(join(testDir, "index.html"), "<html></html>");
      mockApiCreate.mockResolvedValue({ id: "deploy-456" });

      const { deployCommand } = await import("./deploy");
      await deployCommand.parseAsync([
        "node",
        "deploy",
        testDir,
        "-s",
        "site-1",
      ]);

      expect(mockApiMarkProcessing).toHaveBeenCalledWith("deploy-456");
    });

    it("uploads files in batches of 10", async () => {
      // Create 25 files to test batching
      const files = Array.from({ length: 25 }, (_, i) => `file${i}.txt`);
      mockGlob.mockResolvedValue(files);
      for (const file of files) {
        writeFileSync(join(testDir, file), `content-${file}`);
      }
      mockApiCreate.mockResolvedValue({ id: "deploy-789" });

      const { deployCommand } = await import("./deploy");
      await deployCommand.parseAsync([
        "node",
        "deploy",
        testDir,
        "-s",
        "site-1",
      ]);

      // Should be called 3 times: 10 + 10 + 5
      expect(mockApiUploadFiles).toHaveBeenCalledTimes(3);
    });

    it("finalizes deployment with correct file count and size", async () => {
      mockGlob.mockResolvedValue(["index.html", "style.css"]);
      writeFileSync(join(testDir, "index.html"), "<html></html>"); // 13 bytes
      writeFileSync(join(testDir, "style.css"), "body {}"); // 7 bytes
      mockApiCreate.mockResolvedValue({ id: "deploy-final" });

      const { deployCommand } = await import("./deploy");
      await deployCommand.parseAsync([
        "node",
        "deploy",
        testDir,
        "-s",
        "site-1",
      ]);

      expect(mockApiFinalize).toHaveBeenCalledWith("deploy-final", 2, 20);
    });

    it("shows success message on completion", async () => {
      const { deployCommand } = await setupBasicDeployTest();
      await runDeployCommand(deployCommand);

      expect(mockSpinner.succeed).toHaveBeenCalledWith(
        expect.stringContaining("Deployment successful")
      );
    });
  });

  describe("error handling", () => {
    it("handles API create error", async () => {
      mockGlob.mockResolvedValue(["index.html"]);
      writeFileSync(join(testDir, "index.html"), "<html></html>");
      mockApiCreate.mockRejectedValue(new Error("API Error"));

      const { deployCommand } = await import("./deploy");
      await deployCommand.parseAsync([
        "node",
        "deploy",
        testDir,
        "-s",
        "site-1",
      ]);

      expect(mockSpinner.fail).toHaveBeenCalledWith("Deployment failed");
      expect(mockConsoleError).toHaveBeenCalledWith("API Error");
      expect(mockProcessExit).toHaveBeenCalledWith(1);
    });

    it("handles upload error", async () => {
      mockGlob.mockResolvedValue(["index.html"]);
      writeFileSync(join(testDir, "index.html"), "<html></html>");
      mockApiUploadFiles.mockRejectedValue(new Error("Upload failed"));

      const { deployCommand } = await import("./deploy");
      await deployCommand.parseAsync([
        "node",
        "deploy",
        testDir,
        "-s",
        "site-1",
      ]);

      expect(mockSpinner.fail).toHaveBeenCalledWith("Deployment failed");
      expect(mockProcessExit).toHaveBeenCalledWith(1);
    });

    it("handles unknown error type", async () => {
      mockGlob.mockResolvedValue(["index.html"]);
      writeFileSync(join(testDir, "index.html"), "<html></html>");
      mockApiCreate.mockRejectedValue("string error");

      const { deployCommand } = await import("./deploy");
      await deployCommand.parseAsync([
        "node",
        "deploy",
        testDir,
        "-s",
        "site-1",
      ]);

      expect(mockConsoleError).toHaveBeenCalledWith("Unknown error");
    });
  });

  // Note: formatSize is tested in @pagehaven/utils/format.test.ts

  describe("output messages", () => {
    it("displays file count and size after deployment", async () => {
      mockGlob.mockResolvedValue(["index.html"]);
      writeFileSync(join(testDir, "index.html"), "<html></html>");

      const { deployCommand } = await import("./deploy");
      await deployCommand.parseAsync([
        "node",
        "deploy",
        testDir,
        "-s",
        "mysite",
      ]);

      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining("Files:")
      );
      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining("Size:")
      );
      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining("https://mysite.pagehaven.io")
      );
    });
  });
});
