import {
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

// Create a unique test directory for this test run
const testId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
const TEST_HOME = join(tmpdir(), `pagehaven-test-home-${testId}`);
const TEST_CONFIG_DIR = join(TEST_HOME, ".pagehaven");
const TEST_CONFIG_FILE = join(TEST_CONFIG_DIR, "config.json");

// Mock homedir before importing the config module
vi.mock("node:os", async (importOriginal) => {
  const actual = await importOriginal<typeof import("node:os")>();
  return {
    ...actual,
    homedir: () => TEST_HOME,
  };
});

describe("config", () => {
  // Import the module fresh for each describe block
  let getConfig: typeof import("./config").getConfig;
  let saveConfig: typeof import("./config").saveConfig;
  let getToken: typeof import("./config").getToken;
  let setToken: typeof import("./config").setToken;
  let clearToken: typeof import("./config").clearToken;
  let isAuthenticated: typeof import("./config").isAuthenticated;

  beforeAll(async () => {
    // Clean up and create test home directory
    if (existsSync(TEST_HOME)) {
      rmSync(TEST_HOME, { recursive: true });
    }
    mkdirSync(TEST_HOME, { recursive: true });

    // Import the module after mocking
    const configModule = await import("./config");
    getConfig = configModule.getConfig;
    saveConfig = configModule.saveConfig;
    getToken = configModule.getToken;
    setToken = configModule.setToken;
    clearToken = configModule.clearToken;
    isAuthenticated = configModule.isAuthenticated;
  });

  afterAll(() => {
    // Clean up test home directory
    if (existsSync(TEST_HOME)) {
      rmSync(TEST_HOME, { recursive: true });
    }
  });

  beforeEach(() => {
    // Clean up test config directory before each test
    if (existsSync(TEST_CONFIG_DIR)) {
      rmSync(TEST_CONFIG_DIR, { recursive: true });
    }
  });

  afterEach(() => {
    // Clean up test config directory after each test
    if (existsSync(TEST_CONFIG_DIR)) {
      rmSync(TEST_CONFIG_DIR, { recursive: true });
    }
  });

  describe("getConfig", () => {
    it("returns default config when no config file exists", () => {
      const config = getConfig();
      expect(config).toEqual({
        apiUrl: "https://api.pagehaven.io",
      });
    });

    it("returns merged config when config file exists", () => {
      mkdirSync(TEST_CONFIG_DIR, { recursive: true });
      writeFileSync(
        TEST_CONFIG_FILE,
        JSON.stringify({ token: "test-token", defaultSiteId: "site-123" })
      );

      const config = getConfig();
      expect(config).toEqual({
        apiUrl: "https://api.pagehaven.io",
        token: "test-token",
        defaultSiteId: "site-123",
      });
    });

    it("returns default config when config file is invalid JSON", () => {
      mkdirSync(TEST_CONFIG_DIR, { recursive: true });
      writeFileSync(TEST_CONFIG_FILE, "invalid json");

      const config = getConfig();
      expect(config).toEqual({
        apiUrl: "https://api.pagehaven.io",
      });
    });
  });

  describe("saveConfig", () => {
    it("creates config directory if it does not exist", () => {
      saveConfig({ token: "new-token" });
      expect(existsSync(TEST_CONFIG_DIR)).toBe(true);
    });

    it("saves config to file", () => {
      saveConfig({ token: "saved-token" });

      const content = readFileSync(TEST_CONFIG_FILE, "utf-8");
      const parsed = JSON.parse(content);
      expect(parsed.token).toBe("saved-token");
    });

    it("merges with existing config", () => {
      mkdirSync(TEST_CONFIG_DIR, { recursive: true });
      writeFileSync(TEST_CONFIG_FILE, JSON.stringify({ token: "old-token" }));

      saveConfig({ defaultSiteId: "site-456" });

      const content = readFileSync(TEST_CONFIG_FILE, "utf-8");
      const parsed = JSON.parse(content);
      expect(parsed.token).toBe("old-token");
      expect(parsed.defaultSiteId).toBe("site-456");
    });
  });

  describe("getToken", () => {
    it("returns undefined when no token is set", () => {
      expect(getToken()).toBeUndefined();
    });

    it("returns token when set", () => {
      mkdirSync(TEST_CONFIG_DIR, { recursive: true });
      writeFileSync(TEST_CONFIG_FILE, JSON.stringify({ token: "my-token" }));

      expect(getToken()).toBe("my-token");
    });
  });

  describe("setToken", () => {
    it("sets the token in config", () => {
      setToken("new-api-token");

      const config = getConfig();
      expect(config.token).toBe("new-api-token");
    });
  });

  describe("clearToken", () => {
    it("removes token from config", () => {
      // First ensure clean state
      if (existsSync(TEST_CONFIG_DIR)) {
        rmSync(TEST_CONFIG_DIR, { recursive: true });
      }
      mkdirSync(TEST_CONFIG_DIR, { recursive: true });
      writeFileSync(
        TEST_CONFIG_FILE,
        JSON.stringify({ token: "to-remove", defaultSiteId: "keep-this" })
      );

      clearToken();

      // Read the file directly to verify the token was removed
      const content = readFileSync(TEST_CONFIG_FILE, "utf-8");
      const parsed = JSON.parse(content);
      expect(parsed.token).toBeUndefined();
      expect(parsed.defaultSiteId).toBe("keep-this");
    });
  });

  describe("isAuthenticated", () => {
    it("returns false when no token is set", () => {
      expect(isAuthenticated()).toBe(false);
    });

    it("returns true when token is set", () => {
      mkdirSync(TEST_CONFIG_DIR, { recursive: true });
      writeFileSync(TEST_CONFIG_FILE, JSON.stringify({ token: "auth-token" }));

      expect(isAuthenticated()).toBe(true);
    });
  });
});
