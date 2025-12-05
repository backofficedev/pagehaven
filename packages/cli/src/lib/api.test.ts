import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError, api } from "./api";

// Mock the config module
vi.mock("./config", () => ({
  getConfig: () => ({ apiUrl: "https://api.test.io" }),
  getToken: () => "test-token",
}));

describe("api", () => {
  const mockFetch = vi.fn();

  beforeEach(() => {
    vi.stubGlobal("fetch", mockFetch);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  describe("ApiError", () => {
    it("creates error with message and status code", () => {
      const error = new ApiError("Not found", 404);
      expect(error.message).toBe("Not found");
      expect(error.statusCode).toBe(404);
      expect(error.name).toBe("ApiError");
    });
  });

  describe("sites.list", () => {
    it("fetches sites list", async () => {
      const mockSites = [
        { id: "1", name: "Site 1", subdomain: "site1" },
        { id: "2", name: "Site 2", subdomain: "site2" },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockSites),
      });

      const result = await api.sites.list();

      expect(mockFetch).toHaveBeenCalledWith(
        "https://api.test.io/rpc/site.list",
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer test-token",
          },
          body: undefined,
        }
      );
      expect(result).toEqual(mockSites);
    });

    it("throws ApiError on failure", async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 401,
        json: () => Promise.resolve({ message: "Unauthorized" }),
      });

      await expect(api.sites.list()).rejects.toThrow(ApiError);

      // Reset and test again for the object match
      mockFetch.mockResolvedValue({
        ok: false,
        status: 401,
        json: () => Promise.resolve({ message: "Unauthorized" }),
      });

      await expect(api.sites.list()).rejects.toMatchObject({
        message: "Unauthorized",
        statusCode: 401,
      });
    });
  });

  describe("sites.get", () => {
    it("fetches a specific site", async () => {
      const mockSite = { id: "site-123", name: "My Site", subdomain: "mysite" };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockSite),
      });

      const result = await api.sites.get("site-123");

      expect(mockFetch).toHaveBeenCalledWith(
        "https://api.test.io/rpc/site.get",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer test-token",
          },
          body: JSON.stringify({ siteId: "site-123" }),
        }
      );
      expect(result).toEqual(mockSite);
    });
  });

  describe("deployments.create", () => {
    it("creates a deployment", async () => {
      const mockDeployment = {
        id: "deploy-1",
        siteId: "site-1",
        status: "pending",
        fileCount: 0,
        totalSize: 0,
        createdAt: "2024-01-01T00:00:00Z",
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockDeployment),
      });

      const result = await api.deployments.create("site-1", "Initial commit");

      expect(mockFetch).toHaveBeenCalledWith(
        "https://api.test.io/rpc/deployment.create",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer test-token",
          },
          body: JSON.stringify({
            siteId: "site-1",
            commitMessage: "Initial commit",
          }),
        }
      );
      expect(result).toEqual(mockDeployment);
    });
  });

  describe("deployments.markProcessing", () => {
    it("marks deployment as processing", async () => {
      const mockDeployment = {
        id: "deploy-1",
        siteId: "site-1",
        status: "processing",
        fileCount: 0,
        totalSize: 0,
        createdAt: "2024-01-01T00:00:00Z",
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockDeployment),
      });

      const result = await api.deployments.markProcessing("deploy-1");

      expect(mockFetch).toHaveBeenCalledWith(
        "https://api.test.io/rpc/deployment.markProcessing",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer test-token",
          },
          body: JSON.stringify({ deploymentId: "deploy-1" }),
        }
      );
      expect(result).toEqual(mockDeployment);
    });
  });

  describe("deployments.finalize", () => {
    it("finalizes a deployment", async () => {
      const mockDeployment = {
        id: "deploy-1",
        siteId: "site-1",
        status: "live",
        fileCount: 10,
        totalSize: 5000,
        createdAt: "2024-01-01T00:00:00Z",
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockDeployment),
      });

      const result = await api.deployments.finalize("deploy-1", 10, 5000);

      expect(mockFetch).toHaveBeenCalledWith(
        "https://api.test.io/rpc/deployment.finalize",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer test-token",
          },
          body: JSON.stringify({
            deploymentId: "deploy-1",
            fileCount: 10,
            totalSize: 5000,
          }),
        }
      );
      expect(result).toEqual(mockDeployment);
    });
  });

  describe("upload.uploadFiles", () => {
    it("uploads files", async () => {
      const mockResponse = { uploaded: 3 };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const files = [
        { filePath: "index.html", content: "<html></html>" },
        { filePath: "style.css", content: "body {}" },
        { filePath: "script.js", content: "console.log('hi')" },
      ];

      const result = await api.upload.uploadFiles("deploy-1", files);

      expect(mockFetch).toHaveBeenCalledWith(
        "https://api.test.io/rpc/upload.uploadFiles",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer test-token",
          },
          body: JSON.stringify({ deploymentId: "deploy-1", files }),
        }
      );
      expect(result).toEqual(mockResponse);
    });
  });

  describe("error handling", () => {
    it("handles non-JSON error responses", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: () => Promise.reject(new Error("Not JSON")),
      });

      await expect(api.sites.list()).rejects.toMatchObject({
        message: "Unknown error",
        statusCode: 500,
      });
    });

    it("handles missing error message", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: () => Promise.resolve({}),
      });

      await expect(api.sites.list()).rejects.toMatchObject({
        message: "Request failed",
        statusCode: 400,
      });
    });
  });
});
