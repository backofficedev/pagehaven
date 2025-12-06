import { describe, expect, it, vi } from "vitest";

// Mock the @pagehaven/client/node module
const mockClient = {
  site: {
    list: vi.fn(),
    get: vi.fn(),
    create: vi.fn(),
  },
  deployment: {
    list: vi.fn(),
    create: vi.fn(),
    markProcessing: vi.fn(),
    finalize: vi.fn(),
  },
  upload: {
    uploadFiles: vi.fn(),
  },
};

vi.mock("@pagehaven/client/node", () => ({
  createNodeClient: vi.fn(() => mockClient),
}));

// Mock the config module
vi.mock("./config", () => ({
  getConfig: () => ({ apiUrl: "https://api.test.io" }),
  getToken: () => "test-token",
}));

describe("api", () => {
  describe("getApiClient", () => {
    it("creates a client with config from getConfig and getToken", async () => {
      const { getApiClient } = await import("./api");
      const { createNodeClient } = await import("@pagehaven/client/node");

      const client = getApiClient();

      expect(createNodeClient).toHaveBeenCalledWith({
        baseUrl: "https://api.test.io",
        token: "test-token",
      });
      expect(client).toBeDefined();
    });
  });

  describe("createApiClient", () => {
    it("creates a client with custom URL and token", async () => {
      const { createApiClient } = await import("./api");
      const { createNodeClient } = await import("@pagehaven/client/node");

      const client = createApiClient("https://custom.api.io", "custom-token");

      expect(createNodeClient).toHaveBeenCalledWith({
        baseUrl: "https://custom.api.io",
        token: "custom-token",
      });
      expect(client).toBeDefined();
    });

    it("creates a client without token", async () => {
      const { createApiClient } = await import("./api");
      const { createNodeClient } = await import("@pagehaven/client/node");

      createApiClient("https://custom.api.io");

      expect(createNodeClient).toHaveBeenCalledWith({
        baseUrl: "https://custom.api.io",
        token: undefined,
      });
    });
  });

  describe("api legacy export", () => {
    it("exposes sites through getter", async () => {
      const { api } = await import("./api");
      expect(api.sites).toBeDefined();
      expect(api.sites.list).toBeDefined();
    });

    it("exposes deployments through getter", async () => {
      const { api } = await import("./api");
      expect(api.deployments).toBeDefined();
      expect(api.deployments.list).toBeDefined();
    });

    it("exposes upload through getter", async () => {
      const { api } = await import("./api");
      expect(api.upload).toBeDefined();
      expect(api.upload.uploadFiles).toBeDefined();
    });
  });
});
