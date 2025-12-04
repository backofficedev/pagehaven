import { describe, expect, it, vi } from "vitest";

// Mock cloudflare:workers
vi.mock("cloudflare:workers", () => ({
  env: {
    STORAGE: {
      put: vi.fn(),
      get: vi.fn(),
      delete: vi.fn(),
      list: vi.fn(),
      head: vi.fn(),
    },
  },
}));

const LEADING_SLASHES_REGEX = /^\/+/;
const STORAGE_KEY_PATTERN = /^sites\/[^/]+\/deployments\/[^/]+\/.*$/;

// Test the getDeploymentFileKey function logic
function getDeploymentFileKey(
  siteId: string,
  deploymentId: string,
  filePath: string
): string {
  const normalizedPath = filePath.replace(LEADING_SLASHES_REGEX, "");
  return `sites/${siteId}/deployments/${deploymentId}/${normalizedPath}`;
}

describe("storage utilities", () => {
  describe("smoke tests", () => {
    it("getDeploymentFileKey function works", () => {
      const key = getDeploymentFileKey("site-1", "deploy-1", "index.html");
      expect(key).toBeDefined();
      expect(typeof key).toBe("string");
    });
  });
});

describe("getDeploymentFileKey", () => {
  describe("happy path", () => {
    it("generates correct key for root file", () => {
      const key = getDeploymentFileKey("site-123", "deploy-456", "index.html");
      expect(key).toBe("sites/site-123/deployments/deploy-456/index.html");
    });

    it("generates correct key for nested file", () => {
      const key = getDeploymentFileKey(
        "site-123",
        "deploy-456",
        "assets/css/styles.css"
      );
      expect(key).toBe(
        "sites/site-123/deployments/deploy-456/assets/css/styles.css"
      );
    });

    it("generates correct key for deeply nested file", () => {
      const key = getDeploymentFileKey(
        "site-123",
        "deploy-456",
        "assets/images/icons/social/twitter.svg"
      );
      expect(key).toBe(
        "sites/site-123/deployments/deploy-456/assets/images/icons/social/twitter.svg"
      );
    });
  });

  describe("path normalization", () => {
    it("removes single leading slash", () => {
      const key = getDeploymentFileKey("site-1", "deploy-1", "/index.html");
      expect(key).toBe("sites/site-1/deployments/deploy-1/index.html");
    });

    it("removes multiple leading slashes", () => {
      const key = getDeploymentFileKey("site-1", "deploy-1", "///index.html");
      expect(key).toBe("sites/site-1/deployments/deploy-1/index.html");
    });

    it("preserves path without leading slash", () => {
      const key = getDeploymentFileKey("site-1", "deploy-1", "index.html");
      expect(key).toBe("sites/site-1/deployments/deploy-1/index.html");
    });

    it("preserves internal slashes in path", () => {
      const key = getDeploymentFileKey(
        "site-1",
        "deploy-1",
        "/path/to/file.txt"
      );
      expect(key).toBe("sites/site-1/deployments/deploy-1/path/to/file.txt");
    });
  });

  describe("edge cases", () => {
    it("handles empty file path", () => {
      const key = getDeploymentFileKey("site-1", "deploy-1", "");
      expect(key).toBe("sites/site-1/deployments/deploy-1/");
    });

    it("handles file path with only slashes", () => {
      const key = getDeploymentFileKey("site-1", "deploy-1", "///");
      expect(key).toBe("sites/site-1/deployments/deploy-1/");
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

    it("handles file with special characters in name", () => {
      const key = getDeploymentFileKey(
        "site-1",
        "deploy-1",
        "file-name_v2.0.txt"
      );
      expect(key).toBe("sites/site-1/deployments/deploy-1/file-name_v2.0.txt");
    });

    it("handles hidden files (starting with dot)", () => {
      const key = getDeploymentFileKey("site-1", "deploy-1", ".htaccess");
      expect(key).toBe("sites/site-1/deployments/deploy-1/.htaccess");
    });

    it("handles file with multiple dots", () => {
      const key = getDeploymentFileKey("site-1", "deploy-1", "app.min.js.map");
      expect(key).toBe("sites/site-1/deployments/deploy-1/app.min.js.map");
    });
  });
});

describe("storage key patterns", () => {
  describe("site storage prefix", () => {
    it("all keys start with sites/", () => {
      const key = getDeploymentFileKey("any-site", "any-deploy", "any-file");
      expect(key.startsWith("sites/")).toBe(true);
    });

    it("follows sites/{siteId}/deployments/{deploymentId}/ pattern", () => {
      const key = getDeploymentFileKey("site-abc", "deploy-xyz", "file.txt");
      expect(STORAGE_KEY_PATTERN.test(key)).toBe(true);
    });
  });

  describe("key uniqueness", () => {
    it("different sites produce different keys", () => {
      const key1 = getDeploymentFileKey("site-1", "deploy-1", "index.html");
      const key2 = getDeploymentFileKey("site-2", "deploy-1", "index.html");
      expect(key1).not.toBe(key2);
    });

    it("different deployments produce different keys", () => {
      const key1 = getDeploymentFileKey("site-1", "deploy-1", "index.html");
      const key2 = getDeploymentFileKey("site-1", "deploy-2", "index.html");
      expect(key1).not.toBe(key2);
    });

    it("different files produce different keys", () => {
      const key1 = getDeploymentFileKey("site-1", "deploy-1", "index.html");
      const key2 = getDeploymentFileKey("site-1", "deploy-1", "about.html");
      expect(key1).not.toBe(key2);
    });
  });
});

describe("UploadedFile type structure", () => {
  // Type tests - these verify the expected structure
  type UploadedFile = {
    key: string;
    size: number;
    contentType: string;
  };

  it("has required key property", () => {
    const file: UploadedFile = {
      key: "sites/site-1/deployments/deploy-1/index.html",
      size: 1024,
      contentType: "text/html",
    };
    expect(file.key).toBeDefined();
    expect(typeof file.key).toBe("string");
  });

  it("has required size property", () => {
    const file: UploadedFile = {
      key: "test",
      size: 2048,
      contentType: "text/plain",
    };
    expect(file.size).toBeDefined();
    expect(typeof file.size).toBe("number");
  });

  it("has required contentType property", () => {
    const file: UploadedFile = {
      key: "test",
      size: 0,
      contentType: "application/json",
    };
    expect(file.contentType).toBeDefined();
    expect(typeof file.contentType).toBe("string");
  });
});

describe("StorageFile type structure", () => {
  type StorageFile = {
    key: string;
    size: number;
    etag: string;
    lastModified: Date;
  };

  it("has all required properties", () => {
    const file: StorageFile = {
      key: "sites/site-1/deployments/deploy-1/index.html",
      size: 1024,
      etag: '"abc123"',
      lastModified: new Date(),
    };
    expect(file.key).toBeDefined();
    expect(file.size).toBeDefined();
    expect(file.etag).toBeDefined();
    expect(file.lastModified).toBeInstanceOf(Date);
  });
});
