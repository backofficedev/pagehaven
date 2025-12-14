import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mockAlchemy = {
  env: {} as Record<string, string>,
  secret: {
    env: {} as Record<string, { expose: () => string }>,
  },
};

vi.mock("alchemy", () => ({
  default: mockAlchemy,
}));

vi.mock("node:os", () => ({
  userInfo: vi.fn(() => ({ username: "testuser" })),
}));

const { getUsername, isDevelopmentEnvironment, buildUrl } = await import(
  "./helpers"
);

describe("getUsername", () => {
  it("returns system username", () => {
    const result = getUsername();
    expect(result).toBe("testuser");
  });

  it("caches result on subsequent calls", () => {
    const first = getUsername();
    const second = getUsername();
    expect(first).toBe(second);
  });
});

describe("isDevelopmentEnvironment", () => {
  it("returns true for 'dev' environment", () => {
    expect(isDevelopmentEnvironment("dev")).toBe(true);
  });

  it("returns true when environment matches username", () => {
    expect(isDevelopmentEnvironment("testuser")).toBe(true);
  });

  it("returns false for 'prod' environment", () => {
    expect(isDevelopmentEnvironment("prod")).toBe(false);
  });

  it("returns false for 'staging' environment", () => {
    expect(isDevelopmentEnvironment("staging")).toBe(false);
  });

  it("returns false for 'preview' environment", () => {
    expect(isDevelopmentEnvironment("preview")).toBe(false);
  });
});

describe("buildUrl", () => {
  it("returns http:// for dev environment", () => {
    const result = buildUrl("dev", "localhost:3000");
    expect(result).toBe("http://localhost:3000");
  });

  it("returns http:// when environment matches username", () => {
    const result = buildUrl("testuser", "localhost:3000");
    expect(result).toBe("http://localhost:3000");
  });

  it("returns https:// for prod environment", () => {
    const result = buildUrl("prod", "example.com");
    expect(result).toBe("https://example.com");
  });

  it("prefixes domain with environment for staging", () => {
    const result = buildUrl("staging", "example.com");
    expect(result).toBe("https://staging.example.com");
  });

  it("prefixes domain with environment for preview", () => {
    const result = buildUrl("preview", "example.com");
    expect(result).toBe("https://preview.example.com");
  });

  it("does not prefix domain for prod", () => {
    const result = buildUrl("prod", "example.com");
    expect(result).toBe("https://example.com");
  });
});

describe("getEnvVar", () => {
  beforeEach(() => {
    mockAlchemy.env = {};
  });

  afterEach(() => {
    mockAlchemy.env = {};
  });

  it("returns value from alchemy.env", async () => {
    mockAlchemy.env.TEST_VAR = "test_value";
    const { getEnvVar } = await import("./helpers");

    const result = getEnvVar("TEST_VAR");

    expect(result).toBe("test_value");
  });

  it("throws missingEnvVarError when missing", async () => {
    const { getEnvVar } = await import("./helpers");

    expect(() => getEnvVar("MISSING_VAR")).toThrow(
      "Missing environment variable: MISSING_VAR"
    );
  });
});

describe("getSecretEnvVar", () => {
  beforeEach(() => {
    mockAlchemy.secret.env = {};
  });

  afterEach(() => {
    mockAlchemy.secret.env = {};
  });

  it("returns secret value from alchemy.secret.env", async () => {
    const secretValue = { expose: () => "secret_value" };
    mockAlchemy.secret.env.SECRET_VAR = secretValue;
    const { getSecretEnvVar } = await import("./helpers");

    const result = getSecretEnvVar("SECRET_VAR");

    expect(result).toBe(secretValue);
  });

  it("throws missingEnvVarError when missing", async () => {
    const { getSecretEnvVar } = await import("./helpers");

    expect(() => getSecretEnvVar("MISSING_SECRET")).toThrow(
      "Missing environment variable: MISSING_SECRET"
    );
  });
});

describe("getDomainEnvVar", () => {
  beforeEach(() => {
    mockAlchemy.env = {};
  });

  afterEach(() => {
    mockAlchemy.env = {};
  });

  it("gets domain from alchemy.env and applies environment prefix for staging", async () => {
    mockAlchemy.env.SERVER_DOMAIN = "api.example.com";
    const { getDomainEnvVar } = await import("./helpers");

    const result = getDomainEnvVar("staging", "SERVER_DOMAIN");

    expect(result).toBe("staging.api.example.com");
  });

  it("does not prefix for dev environment", async () => {
    mockAlchemy.env.SERVER_DOMAIN = "localhost:3000";
    const { getDomainEnvVar } = await import("./helpers");

    const result = getDomainEnvVar("dev", "SERVER_DOMAIN");

    expect(result).toBe("localhost:3000");
  });

  it("throws when env var is missing", async () => {
    const { getDomainEnvVar } = await import("./helpers");

    expect(() => getDomainEnvVar("staging", "MISSING_DOMAIN")).toThrow(
      "Missing environment variable: MISSING_DOMAIN"
    );
  });
});

describe("getDomainEnvVarFromProcess", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("gets domain from process.env and applies environment prefix", async () => {
    process.env.SERVER_DOMAIN = "api.example.com";
    const { getDomainEnvVarFromProcess } = await import("./helpers");

    const result = getDomainEnvVarFromProcess("staging", "SERVER_DOMAIN");

    expect(result).toBe("staging.api.example.com");
  });

  it("does not prefix for prod environment", async () => {
    process.env.SERVER_DOMAIN = "api.example.com";
    const { getDomainEnvVarFromProcess } = await import("./helpers");

    const result = getDomainEnvVarFromProcess("prod", "SERVER_DOMAIN");

    expect(result).toBe("api.example.com");
  });

  it("throws when env var is missing", async () => {
    process.env.MISSING_DOMAIN = undefined;
    const { getDomainEnvVarFromProcess } = await import("./helpers");

    expect(() =>
      getDomainEnvVarFromProcess("staging", "MISSING_DOMAIN")
    ).toThrow("Missing environment variable: MISSING_DOMAIN");
  });
});
