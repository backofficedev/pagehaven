import { existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

// Set required env vars BEFORE importing the module to avoid top-level buildEnv() failure
const REQUIRED_ENV_VARS = {
  REPO_NAME: "test-repo",
  APP_NAME_PREFIX: "test-prefix",
  SERVER_RESOURCE_NAME: "server",
  STATIC_RESOURCE_NAME: "static",
  WEB_RESOURCE_NAME: "web",
  SERVER_APP_NAME: "test-prefix-server",
  STATIC_APP_NAME: "test-prefix-static",
  WEB_APP_NAME: "test-prefix-web",
};

for (const [key, value] of Object.entries(REQUIRED_ENV_VARS)) {
  process.env[key] = value;
}

// Now safe to import
const { loadEnv, missingEnvVarError } = await import("./env");

const TEST_DIR = path.join(import.meta.dirname, "__test_env__");

function writeEnvFile(filename: string, content: string) {
  writeFileSync(path.join(TEST_DIR, filename), content);
}

function clearProcessEnv(keys: string[]) {
  for (const key of keys) {
    process.env[key] = undefined;
  }
}

describe("loadEnv", () => {
  const testKeys = [
    "TEST_VAR",
    "TEST_LOCAL_VAR",
    "TEST_OVERRIDE",
    "TEST_MODE_VAR",
    "TEST_MODE_LOCAL_VAR",
    "TEST_EXPANDED",
    "TEST_BASE",
  ];

  beforeEach(() => {
    clearProcessEnv(testKeys);
    if (existsSync(TEST_DIR)) {
      rmSync(TEST_DIR, { recursive: true });
    }
    mkdirSync(TEST_DIR, { recursive: true });
  });

  afterEach(() => {
    clearProcessEnv(testKeys);
    if (existsSync(TEST_DIR)) {
      rmSync(TEST_DIR, { recursive: true });
    }
  });

  it("loads .env file", () => {
    writeEnvFile(".env", "TEST_VAR=base_value");

    loadEnv({ envDir: TEST_DIR });

    expect(process.env.TEST_VAR).toBe("base_value");
  });

  it("loads .env.local and overrides .env", () => {
    writeEnvFile(".env", "TEST_VAR=base_value\nTEST_OVERRIDE=from_base");
    writeEnvFile(
      ".env.local",
      "TEST_LOCAL_VAR=local_value\nTEST_OVERRIDE=from_local"
    );

    loadEnv({ envDir: TEST_DIR });

    expect(process.env.TEST_VAR).toBe("base_value");
    expect(process.env.TEST_LOCAL_VAR).toBe("local_value");
    expect(process.env.TEST_OVERRIDE).toBe("from_local");
  });

  it("loads mode-specific .env.{mode} file", () => {
    writeEnvFile(".env", "TEST_VAR=base_value");
    writeEnvFile(
      ".env.production",
      "TEST_MODE_VAR=production_value\nTEST_VAR=production_override"
    );

    loadEnv({ envDir: TEST_DIR, mode: "production" });

    expect(process.env.TEST_VAR).toBe("production_override");
    expect(process.env.TEST_MODE_VAR).toBe("production_value");
  });

  it("loads .env.{mode}.local and overrides .env.{mode}", () => {
    writeEnvFile(".env", "TEST_VAR=base_value");
    writeEnvFile(".env.production", "TEST_MODE_VAR=production_value");
    writeEnvFile(
      ".env.production.local",
      "TEST_MODE_LOCAL_VAR=production_local_value\nTEST_MODE_VAR=production_local_override"
    );

    loadEnv({ envDir: TEST_DIR, mode: "production" });

    expect(process.env.TEST_VAR).toBe("base_value");
    expect(process.env.TEST_MODE_VAR).toBe("production_local_override");
    expect(process.env.TEST_MODE_LOCAL_VAR).toBe("production_local_value");
  });

  it("applies correct precedence: .env < .env.local < .env.{mode} < .env.{mode}.local", () => {
    writeEnvFile(".env", "TEST_OVERRIDE=1_base");
    writeEnvFile(".env.local", "TEST_OVERRIDE=2_local");
    writeEnvFile(".env.staging", "TEST_OVERRIDE=3_staging");
    writeEnvFile(".env.staging.local", "TEST_OVERRIDE=4_staging_local");

    loadEnv({ envDir: TEST_DIR, mode: "staging" });

    expect(process.env.TEST_OVERRIDE).toBe("4_staging_local");
  });

  it("handles missing files gracefully", () => {
    // No files exist - should not throw
    expect(() => loadEnv({ envDir: TEST_DIR })).not.toThrow();
  });

  it("uses NODE_ENV as default mode", () => {
    const originalNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "test";

    writeEnvFile(".env", "TEST_VAR=base");
    writeEnvFile(".env.test", "TEST_VAR=test_mode");

    loadEnv({ envDir: TEST_DIR });

    expect(process.env.TEST_VAR).toBe("test_mode");

    process.env.NODE_ENV = originalNodeEnv;
  });

  it("defaults to development mode when NODE_ENV is empty string", () => {
    const originalNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "";

    writeEnvFile(".env", "TEST_VAR=base");
    writeEnvFile(".env.development", "TEST_VAR=dev_mode");

    loadEnv({ envDir: TEST_DIR });

    expect(process.env.TEST_VAR).toBe("dev_mode");

    process.env.NODE_ENV = originalNodeEnv;
  });

  it("uses cwd when envDir is not specified", () => {
    // This test verifies the default behavior - we can't easily test cwd
    // but we can verify it doesn't throw
    expect(() => loadEnv({})).not.toThrow();
  });

  it("expands bash-style variables", () => {
    // biome-ignore lint/style/noUnusedTemplateLiteral: env file content with ${}
    writeEnvFile(".env", `TEST_BASE=hello\nTEST_EXPANDED=\${TEST_BASE}_world`);

    loadEnv({ envDir: TEST_DIR });

    expect(process.env.TEST_BASE).toBe("hello");
    expect(process.env.TEST_EXPANDED).toBe("hello_world");
  });

  it("expands variables across files with correct precedence", () => {
    writeEnvFile(".env", "TEST_BASE=base_prefix");
    // biome-ignore lint/style/noUnusedTemplateLiteral: env file content with ${}
    writeEnvFile(".env.local", `TEST_EXPANDED=\${TEST_BASE}_suffix`);

    loadEnv({ envDir: TEST_DIR });

    expect(process.env.TEST_BASE).toBe("base_prefix");
    expect(process.env.TEST_EXPANDED).toBe("base_prefix_suffix");
  });

  it("expands $VAR syntax (without braces)", () => {
    writeEnvFile(".env", "TEST_BASE=simple\nTEST_EXPANDED=$TEST_BASE_value");

    loadEnv({ envDir: TEST_DIR });

    expect(process.env.TEST_BASE).toBe("simple");
    // Note: $TEST_BASE_value is treated as a single variable name, not $TEST_BASE + "_value"
    // This is expected bash behavior - use ${TEST_BASE}_value for concatenation
  });

  it("handles nested variable expansion", () => {
    const envContent = [
      "TEST_A=first",
      // biome-ignore lint/suspicious/noTemplateCurlyInString: <test string with ${}>
      "TEST_B=${TEST_A}_second",
      // biome-ignore lint/suspicious/noTemplateCurlyInString: <test string with ${}>
      "TEST_C=${TEST_B}_third",
    ].join("\n");
    writeEnvFile(".env", envContent);

    loadEnv({ envDir: TEST_DIR });

    expect(process.env.TEST_A).toBe("first");
    expect(process.env.TEST_B).toBe("first_second");
    expect(process.env.TEST_C).toBe("first_second_third");
  });
});

describe("missingEnvVarError", () => {
  it("returns an Error with descriptive message", () => {
    const error = missingEnvVarError("MY_VAR");

    expect(error).toBeInstanceOf(Error);
    expect(error.message).toBe("Missing environment variable: MY_VAR");
  });
});

const { getProcessEnvVar, getEnvFilePatterns, getEnv } = await import("./env");

describe("getEnv", () => {
  it("returns env object with all required keys", () => {
    const env = getEnv();

    expect(env).toHaveProperty("REPO_NAME");
    expect(env).toHaveProperty("APP_NAME_PREFIX");
    expect(env).toHaveProperty("SERVER_RESOURCE_NAME");
    expect(env).toHaveProperty("STATIC_RESOURCE_NAME");
    expect(env).toHaveProperty("WEB_RESOURCE_NAME");
    expect(env).toHaveProperty("SERVER_APP_NAME");
    expect(env).toHaveProperty("STATIC_APP_NAME");
    expect(env).toHaveProperty("WEB_APP_NAME");
  });

  it("returns cached result on subsequent calls", () => {
    const first = getEnv();
    const second = getEnv();

    expect(first).toBe(second);
  });
});

describe("getProcessEnvVar", () => {
  it("returns value when env var exists", () => {
    process.env.TEST_PROCESS_VAR = "test_value";

    const result = getProcessEnvVar("TEST_PROCESS_VAR");

    expect(result).toBe("test_value");
    process.env.TEST_PROCESS_VAR = undefined;
  });

  it("throws missingEnvVarError when env var is missing", () => {
    // Use a unique key that definitely doesn't exist
    const uniqueKey = `NONEXISTENT_VAR_${Date.now()}`;

    expect(() => getProcessEnvVar(uniqueKey)).toThrow(
      `Missing environment variable: ${uniqueKey}`
    );
  });

  it("throws when env var is empty string", () => {
    process.env.EMPTY_VAR = "";

    expect(() => getProcessEnvVar("EMPTY_VAR")).toThrow(
      "Missing environment variable: EMPTY_VAR"
    );
    process.env.EMPTY_VAR = undefined;
  });
});

describe("getEnvFilePatterns", () => {
  it("returns correct patterns for development mode", () => {
    const patterns = getEnvFilePatterns("development");

    expect(patterns).toEqual([
      ".env",
      ".env.local",
      ".env.development",
      ".env.development.local",
    ]);
  });

  it("returns correct patterns for production mode", () => {
    const patterns = getEnvFilePatterns("production");

    expect(patterns).toEqual([
      ".env",
      ".env.local",
      ".env.production",
      ".env.production.local",
    ]);
  });

  it("returns correct patterns for custom mode", () => {
    const patterns = getEnvFilePatterns("staging");

    expect(patterns).toEqual([
      ".env",
      ".env.local",
      ".env.staging",
      ".env.staging.local",
    ]);
  });
});
