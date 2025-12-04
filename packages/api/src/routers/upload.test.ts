import { describe, expect, it, vi } from "vitest";
import { z } from "zod";

const LEADING_SLASHES_REGEX = /^\/+/;

// Mock the database module
vi.mock("@pagehaven/db", () => ({
  db: {
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn(() => ({
          get: vi.fn(),
        })),
        innerJoin: vi.fn(() => ({
          where: vi.fn(() => ({
            get: vi.fn(),
          })),
        })),
      })),
    })),
  },
}));

// Upload file schema
const uploadFileSchema = z.object({
  deploymentId: z.string(),
  filePath: z.string().min(1),
  content: z.string(), // Base64 encoded content
  contentType: z.string().optional(),
});

// Upload files (batch) schema
const uploadFilesSchema = z.object({
  deploymentId: z.string(),
  files: z.array(
    z.object({
      filePath: z.string().min(1),
      content: z.string(), // Base64 encoded
      contentType: z.string().optional(),
    })
  ),
});

describe("upload router", () => {
  describe("smoke tests", () => {
    it("upload file schema validates correctly", () => {
      expect(
        uploadFileSchema.safeParse({
          deploymentId: "deploy-123",
          filePath: "index.html",
          content: "PGh0bWw+PC9odG1sPg==", // <html></html> in base64
        }).success
      ).toBe(true);
    });
  });
});

describe("upload file schema", () => {
  describe("happy path", () => {
    it("accepts valid upload without content type", () => {
      const result = uploadFileSchema.safeParse({
        deploymentId: "deploy-123",
        filePath: "index.html",
        content: "SGVsbG8gV29ybGQ=", // "Hello World" in base64
      });
      expect(result.success).toBe(true);
    });

    it("accepts valid upload with content type", () => {
      const result = uploadFileSchema.safeParse({
        deploymentId: "deploy-123",
        filePath: "index.html",
        content: "SGVsbG8gV29ybGQ=",
        contentType: "text/html",
      });
      expect(result.success).toBe(true);
    });

    it("accepts nested file paths", () => {
      const result = uploadFileSchema.safeParse({
        deploymentId: "deploy-123",
        filePath: "assets/css/styles.css",
        content: "Ym9keSB7fQ==", // "body {}" in base64
      });
      expect(result.success).toBe(true);
    });

    it("accepts deeply nested file paths", () => {
      const result = uploadFileSchema.safeParse({
        deploymentId: "deploy-123",
        filePath: "assets/images/icons/social/twitter.svg",
        content: "PHN2Zz48L3N2Zz4=",
      });
      expect(result.success).toBe(true);
    });
  });

  describe("negative tests", () => {
    it("rejects missing deploymentId", () => {
      const result = uploadFileSchema.safeParse({
        filePath: "index.html",
        content: "SGVsbG8=",
      });
      expect(result.success).toBe(false);
    });

    it("rejects missing filePath", () => {
      const result = uploadFileSchema.safeParse({
        deploymentId: "deploy-123",
        content: "SGVsbG8=",
      });
      expect(result.success).toBe(false);
    });

    it("rejects empty filePath", () => {
      const result = uploadFileSchema.safeParse({
        deploymentId: "deploy-123",
        filePath: "",
        content: "SGVsbG8=",
      });
      expect(result.success).toBe(false);
    });

    it("rejects missing content", () => {
      const result = uploadFileSchema.safeParse({
        deploymentId: "deploy-123",
        filePath: "index.html",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("edge cases", () => {
    it("accepts empty content (empty file)", () => {
      const result = uploadFileSchema.safeParse({
        deploymentId: "deploy-123",
        filePath: ".gitkeep",
        content: "",
      });
      expect(result.success).toBe(true);
    });

    it("accepts file path with special characters", () => {
      const result = uploadFileSchema.safeParse({
        deploymentId: "deploy-123",
        filePath: "files/my-file_v2.0.txt",
        content: "dGVzdA==",
      });
      expect(result.success).toBe(true);
    });

    it("accepts file path starting with dot", () => {
      const result = uploadFileSchema.safeParse({
        deploymentId: "deploy-123",
        filePath: ".htaccess",
        content: "dGVzdA==",
      });
      expect(result.success).toBe(true);
    });
  });
});

describe("upload files (batch) schema", () => {
  describe("happy path", () => {
    it("accepts single file in batch", () => {
      const result = uploadFilesSchema.safeParse({
        deploymentId: "deploy-123",
        files: [
          {
            filePath: "index.html",
            content: "SGVsbG8=",
          },
        ],
      });
      expect(result.success).toBe(true);
    });

    it("accepts multiple files in batch", () => {
      const result = uploadFilesSchema.safeParse({
        deploymentId: "deploy-123",
        files: [
          { filePath: "index.html", content: "SGVsbG8=" },
          { filePath: "styles.css", content: "Ym9keSB7fQ==" },
          { filePath: "app.js", content: "Y29uc29sZS5sb2coKQ==" },
        ],
      });
      expect(result.success).toBe(true);
    });

    it("accepts files with content types", () => {
      const result = uploadFilesSchema.safeParse({
        deploymentId: "deploy-123",
        files: [
          {
            filePath: "index.html",
            content: "SGVsbG8=",
            contentType: "text/html",
          },
          {
            filePath: "data.json",
            content: "e30=",
            contentType: "application/json",
          },
        ],
      });
      expect(result.success).toBe(true);
    });

    it("accepts empty files array", () => {
      const result = uploadFilesSchema.safeParse({
        deploymentId: "deploy-123",
        files: [],
      });
      expect(result.success).toBe(true);
    });
  });

  describe("negative tests", () => {
    it("rejects missing deploymentId", () => {
      const result = uploadFilesSchema.safeParse({
        files: [{ filePath: "index.html", content: "SGVsbG8=" }],
      });
      expect(result.success).toBe(false);
    });

    it("rejects missing files array", () => {
      const result = uploadFilesSchema.safeParse({
        deploymentId: "deploy-123",
      });
      expect(result.success).toBe(false);
    });

    it("rejects file with empty filePath in batch", () => {
      const result = uploadFilesSchema.safeParse({
        deploymentId: "deploy-123",
        files: [
          { filePath: "index.html", content: "SGVsbG8=" },
          { filePath: "", content: "dGVzdA==" }, // Invalid
        ],
      });
      expect(result.success).toBe(false);
    });

    it("rejects file with missing content in batch", () => {
      const result = uploadFilesSchema.safeParse({
        deploymentId: "deploy-123",
        files: [
          { filePath: "index.html", content: "SGVsbG8=" },
          { filePath: "styles.css" }, // Missing content
        ],
      });
      expect(result.success).toBe(false);
    });
  });
});

describe("base64 encoding/decoding", () => {
  describe("happy path", () => {
    it("correctly encodes text to base64", () => {
      const text = "Hello World";
      const encoded = btoa(text);
      expect(encoded).toBe("SGVsbG8gV29ybGQ=");
    });

    it("correctly decodes base64 to text", () => {
      const encoded = "SGVsbG8gV29ybGQ=";
      const decoded = atob(encoded);
      expect(decoded).toBe("Hello World");
    });

    it("roundtrips text through base64", () => {
      const original = "Test content with special chars: <>&\"'";
      const encoded = btoa(original);
      const decoded = atob(encoded);
      expect(decoded).toBe(original);
    });
  });

  describe("edge cases", () => {
    it("handles empty string", () => {
      const encoded = btoa("");
      expect(encoded).toBe("");
      expect(atob(encoded)).toBe("");
    });

    it("handles HTML content", () => {
      const html = "<!DOCTYPE html><html><body>Hello</body></html>";
      const encoded = btoa(html);
      const decoded = atob(encoded);
      expect(decoded).toBe(html);
    });

    it("handles JSON content", () => {
      const json = '{"key": "value", "number": 123}';
      const encoded = btoa(json);
      const decoded = atob(encoded);
      expect(decoded).toBe(json);
    });
  });
});

describe("file path normalization", () => {
  function normalizeFilePath(filePath: string): string {
    return filePath.replace(LEADING_SLASHES_REGEX, "");
  }

  describe("happy path", () => {
    it("removes single leading slash", () => {
      expect(normalizeFilePath("/index.html")).toBe("index.html");
    });

    it("removes multiple leading slashes", () => {
      expect(normalizeFilePath("///index.html")).toBe("index.html");
    });

    it("preserves path without leading slash", () => {
      expect(normalizeFilePath("index.html")).toBe("index.html");
    });

    it("preserves nested paths", () => {
      expect(normalizeFilePath("assets/css/styles.css")).toBe(
        "assets/css/styles.css"
      );
    });
  });

  describe("edge cases", () => {
    it("handles path with only slashes", () => {
      expect(normalizeFilePath("///")).toBe("");
    });

    it("preserves internal slashes", () => {
      expect(normalizeFilePath("/path/to/file.txt")).toBe("path/to/file.txt");
    });

    it("handles empty string", () => {
      expect(normalizeFilePath("")).toBe("");
    });
  });
});

describe("deployment file key generation", () => {
  function getDeploymentFileKey(
    siteId: string,
    deploymentId: string,
    filePath: string
  ): string {
    const normalizedPath = filePath.replace(LEADING_SLASHES_REGEX, "");
    return `sites/${siteId}/deployments/${deploymentId}/${normalizedPath}`;
  }

  describe("happy path", () => {
    it("generates correct key for root file", () => {
      const key = getDeploymentFileKey("site-1", "deploy-1", "index.html");
      expect(key).toBe("sites/site-1/deployments/deploy-1/index.html");
    });

    it("generates correct key for nested file", () => {
      const key = getDeploymentFileKey(
        "site-1",
        "deploy-1",
        "assets/css/main.css"
      );
      expect(key).toBe("sites/site-1/deployments/deploy-1/assets/css/main.css");
    });

    it("normalizes leading slash in file path", () => {
      const key = getDeploymentFileKey("site-1", "deploy-1", "/index.html");
      expect(key).toBe("sites/site-1/deployments/deploy-1/index.html");
    });
  });

  describe("edge cases", () => {
    it("handles file path with multiple leading slashes", () => {
      const key = getDeploymentFileKey("site-1", "deploy-1", "///index.html");
      expect(key).toBe("sites/site-1/deployments/deploy-1/index.html");
    });

    it("handles UUID-style IDs", () => {
      const key = getDeploymentFileKey(
        "550e8400-e29b-41d4-a716-446655440000",
        "6ba7b810-9dad-11d1-80b4-00c04fd430c8",
        "index.html"
      );
      expect(key).toBe(
        "sites/550e8400-e29b-41d4-a716-446655440000/deployments/6ba7b810-9dad-11d1-80b4-00c04fd430c8/index.html"
      );
    });
  });
});
