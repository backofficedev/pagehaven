import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const REQUIRED_ENV_VARS = {
  REPO_NAME: "test-repo",
  APP_NAME_PREFIX: "test-prefix",
  SERVER_RESOURCE_NAME: "server",
  STATIC_RESOURCE_NAME: "static",
  WEB_RESOURCE_NAME: "web",
  SERVER_APP_NAME: "test-repo-server",
  STATIC_APP_NAME: "test-repo-static",
  WEB_APP_NAME: "test-repo-web",
};

function setupEnv() {
  vi.resetModules();
  for (const [key, value] of Object.entries(REQUIRED_ENV_VARS)) {
    process.env[key] = value;
  }
}

setupEnv();

describe("buildInfraName", () => {
  beforeEach(setupEnv);
  afterEach(() => vi.resetModules());

  it("builds correct app names from env vars", async () => {
    const { buildInfraName } = await import("./constants");
    const result = buildInfraName();

    expect(result.SERVER_APP_NAME).toBe("test-repo-server");
    expect(result.STATIC_APP_NAME).toBe("test-repo-static");
    expect(result.WEB_APP_NAME).toBe("test-repo-web");
  });

  it("uses REPO_NAME as SHARED_RESOURCE_PREFIX", async () => {
    const { buildInfraName } = await import("./constants");
    expect(buildInfraName().SHARED_RESOURCE_PREFIX).toBe("test-repo");
  });

  it("returns RESOURCE_NAME as 'service'", async () => {
    const { buildInfraName } = await import("./constants");
    expect(buildInfraName().RESOURCE_NAME).toBe("service");
  });
});

describe("getInfraName", () => {
  beforeEach(setupEnv);
  afterEach(() => vi.resetModules());

  it("returns infra name object with all required properties", async () => {
    const { getInfraName } = await import("./constants");
    const result = getInfraName();

    expect(result).toHaveProperty("SERVER_APP_NAME");
    expect(result).toHaveProperty("STATIC_APP_NAME");
    expect(result).toHaveProperty("WEB_APP_NAME");
    expect(result).toHaveProperty("SHARED_RESOURCE_PREFIX");
    expect(result).toHaveProperty("RESOURCE_NAME");
  });

  it("returns cached result on subsequent calls", async () => {
    const { getInfraName } = await import("./constants");
    expect(getInfraName()).toBe(getInfraName());
  });
});

describe("validateInfraEnv", () => {
  beforeEach(setupEnv);
  afterEach(() => vi.resetModules());

  it("passes when built names match env names", async () => {
    const { validateInfraEnv } = await import("./constants");

    expect(() => validateInfraEnv()).not.toThrow();
  });

  it("throws mismatch error when SERVER_APP_NAME differs", async () => {
    process.env.SERVER_APP_NAME = "wrong-server-name";
    const { validateInfraEnv } = await import("./constants");

    expect(() => validateInfraEnv()).toThrow(
      "SERVER_APP_NAME mismatch: built 'test-repo-server' != env 'wrong-server-name'"
    );
  });

  it("throws mismatch error when STATIC_APP_NAME differs", async () => {
    process.env.STATIC_APP_NAME = "wrong-static-name";
    const { validateInfraEnv } = await import("./constants");

    expect(() => validateInfraEnv()).toThrow(
      "STATIC_APP_NAME mismatch: built 'test-repo-static' != env 'wrong-static-name'"
    );
  });

  it("throws mismatch error when WEB_APP_NAME differs", async () => {
    process.env.WEB_APP_NAME = "wrong-web-name";
    const { validateInfraEnv } = await import("./constants");

    expect(() => validateInfraEnv()).toThrow(
      "WEB_APP_NAME mismatch: built 'test-repo-web' != env 'wrong-web-name'"
    );
  });
});
