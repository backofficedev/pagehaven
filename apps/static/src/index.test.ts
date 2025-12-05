import {
  checkPasswordAccess,
  getGateRedirectUrl,
  verifyPasswordCookie,
} from "@pagehaven/api/lib/access-utils";
import { normalizeFilePath } from "@pagehaven/api/lib/file-path";
import { describe, expect, it } from "vitest";

// Note: Content-type tests are in @pagehaven/db/utils/content-type.test.ts

// ============ Password Verification Tests ============

describe("verifyPasswordCookie", () => {
  it("returns true when cookie matches hash", () => {
    expect(verifyPasswordCookie("abc123", "abc123")).toBe(true);
  });

  it("returns false when cookie does not match hash", () => {
    expect(verifyPasswordCookie("abc123", "xyz789")).toBe(false);
  });

  it("returns false when cookie is undefined", () => {
    expect(verifyPasswordCookie(undefined, "abc123")).toBe(false);
  });

  it("returns false when hash is null", () => {
    expect(verifyPasswordCookie("abc123", null)).toBe(false);
  });

  it("returns false when both are empty", () => {
    expect(verifyPasswordCookie(undefined, null)).toBe(false);
  });
});

// ============ Gate Redirect URL Tests ============

describe("getGateRedirectUrl", () => {
  const siteId = "site-123";
  const originalUrl = "https://mysite.example.com/page";
  const webUrl = "http://localhost:3001";

  it("generates password gate URL", () => {
    const url = getGateRedirectUrl(
      "password_required",
      siteId,
      originalUrl,
      webUrl
    );
    expect(url).toContain("/gate/password");
    expect(url).toContain(`siteId=${siteId}`);
    expect(url).toContain("redirect=");
  });

  it("generates login gate URL", () => {
    const url = getGateRedirectUrl(
      "login_required",
      siteId,
      originalUrl,
      webUrl
    );
    expect(url).toContain("/gate/login");
    expect(url).toContain("redirect=");
    expect(url).not.toContain("siteId=");
  });

  it("generates denied gate URL for not_member", () => {
    const url = getGateRedirectUrl("not_member", siteId, originalUrl, webUrl);
    expect(url).toContain("/gate/denied");
    expect(url).toContain("reason=not_member");
  });

  it("generates denied gate URL for not_invited", () => {
    const url = getGateRedirectUrl("not_invited", siteId, originalUrl, webUrl);
    expect(url).toContain("/gate/denied");
    expect(url).toContain("reason=not_invited");
  });

  it("generates unknown denied URL for unknown reason", () => {
    const url = getGateRedirectUrl(
      "unknown_reason",
      siteId,
      originalUrl,
      webUrl
    );
    expect(url).toContain("/gate/denied");
    expect(url).toContain("reason=unknown");
  });

  it("properly encodes the redirect URL", () => {
    const urlWithParams = "https://mysite.example.com/page?foo=bar&baz=qux";
    const url = getGateRedirectUrl(
      "login_required",
      siteId,
      urlWithParams,
      webUrl
    );
    expect(url).toContain(encodeURIComponent(urlWithParams));
  });
});

// ============ Access Check Logic Tests ============

describe("checkPasswordAccess", () => {
  it("allows access with valid password cookie", () => {
    const result = checkPasswordAccess("hash123", "hash123");
    expect(result.allowed).toBe(true);
  });

  it("denies access with invalid password cookie", () => {
    const result = checkPasswordAccess("wrong", "hash123");
    expect(result.allowed).toBe(false);
    if (!result.allowed) {
      expect(result.reason).toBe("password_required");
    }
  });

  it("denies access with missing password cookie", () => {
    const result = checkPasswordAccess(undefined, "hash123");
    expect(result.allowed).toBe(false);
    if (!result.allowed) {
      expect(result.reason).toBe("password_required");
    }
  });
});

// ============ File Path Normalization Tests ============
// Uses shared normalizeFilePath from @pagehaven/api/lib/file-path

describe("normalizeFilePath", () => {
  it("removes leading slash", () => {
    expect(normalizeFilePath("/page.html")).toBe("page.html");
  });

  it("adds index.html for empty path", () => {
    expect(normalizeFilePath("")).toBe("index.html");
    expect(normalizeFilePath("/")).toBe("index.html");
  });

  it("adds index.html for directory paths", () => {
    expect(normalizeFilePath("/about/")).toBe("about/index.html");
    expect(normalizeFilePath("blog/")).toBe("blog/index.html");
  });

  it("preserves file paths", () => {
    expect(normalizeFilePath("/styles.css")).toBe("styles.css");
    expect(normalizeFilePath("images/logo.png")).toBe("images/logo.png");
  });
});

// ============ Storage Key Generation Tests ============

function generateStorageKey(
  siteId: string,
  deploymentId: string,
  filePath: string
): string {
  return `sites/${siteId}/deployments/${deploymentId}/${filePath}`;
}

describe("generateStorageKey", () => {
  it("generates correct storage key", () => {
    const key = generateStorageKey("site-1", "deploy-1", "index.html");
    expect(key).toBe("sites/site-1/deployments/deploy-1/index.html");
  });

  it("handles nested file paths", () => {
    const key = generateStorageKey("site-1", "deploy-1", "assets/css/main.css");
    expect(key).toBe("sites/site-1/deployments/deploy-1/assets/css/main.css");
  });
});

// ============ Subdomain Extraction Tests ============

function extractSubdomain(hostname: string): string {
  return hostname.split(".")[0] ?? "";
}

describe("extractSubdomain", () => {
  it("extracts subdomain from hostname", () => {
    expect(extractSubdomain("mysite.pagehaven.io")).toBe("mysite");
  });

  it("handles localhost", () => {
    expect(extractSubdomain("localhost")).toBe("localhost");
  });

  it("handles localhost with port", () => {
    expect(extractSubdomain("localhost:3002")).toBe("localhost:3002");
  });

  it("handles multi-level subdomains", () => {
    expect(extractSubdomain("blog.mysite.pagehaven.io")).toBe("blog");
  });
});
