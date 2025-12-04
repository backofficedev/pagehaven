import { getContentType } from "@pagehaven/db/utils/content-type";
import { describe, expect, it } from "vitest";

// ============ Content Type Tests ============

describe("getContentType", () => {
  it("returns correct content type for HTML files", () => {
    expect(getContentType("index.html")).toBe("text/html");
    expect(getContentType("page.htm")).toBe("text/html");
  });

  it("returns correct content type for CSS files", () => {
    expect(getContentType("styles.css")).toBe("text/css");
  });

  it("returns correct content type for JavaScript files", () => {
    expect(getContentType("app.js")).toBe("application/javascript");
    expect(getContentType("module.mjs")).toBe("application/javascript");
  });

  it("returns correct content type for JSON files", () => {
    expect(getContentType("data.json")).toBe("application/json");
  });

  it("returns correct content type for image files", () => {
    expect(getContentType("logo.png")).toBe("image/png");
    expect(getContentType("photo.jpg")).toBe("image/jpeg");
    expect(getContentType("photo.jpeg")).toBe("image/jpeg");
    expect(getContentType("animation.gif")).toBe("image/gif");
    expect(getContentType("image.webp")).toBe("image/webp");
    expect(getContentType("icon.svg")).toBe("image/svg+xml");
    expect(getContentType("favicon.ico")).toBe("image/x-icon");
  });

  it("returns correct content type for font files", () => {
    expect(getContentType("font.woff")).toBe("font/woff");
    expect(getContentType("font.woff2")).toBe("font/woff2");
    expect(getContentType("font.ttf")).toBe("font/ttf");
    expect(getContentType("font.otf")).toBe("font/otf");
    expect(getContentType("font.eot")).toBe("application/vnd.ms-fontobject");
  });

  it("returns correct content type for media files", () => {
    expect(getContentType("audio.mp3")).toBe("audio/mpeg");
    expect(getContentType("video.mp4")).toBe("video/mp4");
    expect(getContentType("video.webm")).toBe("video/webm");
  });

  it("returns correct content type for other files", () => {
    expect(getContentType("document.pdf")).toBe("application/pdf");
    expect(getContentType("data.xml")).toBe("application/xml");
    expect(getContentType("archive.zip")).toBe("application/zip");
    expect(getContentType("readme.txt")).toBe("text/plain");
    expect(getContentType("README.md")).toBe("text/markdown");
    expect(getContentType("module.wasm")).toBe("application/wasm");
  });

  it("returns octet-stream for unknown extensions", () => {
    expect(getContentType("file.unknown")).toBe("application/octet-stream");
    expect(getContentType("file.xyz")).toBe("application/octet-stream");
  });

  it("handles files without extensions", () => {
    expect(getContentType("Makefile")).toBe("application/octet-stream");
  });

  it("handles uppercase extensions", () => {
    expect(getContentType("image.PNG")).toBe("image/png");
    expect(getContentType("style.CSS")).toBe("text/css");
  });
});

// ============ Password Verification Tests ============

function verifyPasswordCookie(
  passwordCookie: string | undefined,
  storedHash: string | null
): boolean {
  if (!(passwordCookie && storedHash)) {
    return false;
  }
  return passwordCookie === storedHash;
}

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

function getGateRedirectUrl(
  reason: string,
  siteId: string,
  originalUrl: string,
  webUrl = "http://localhost:3001"
): string {
  const redirectParam = encodeURIComponent(originalUrl);

  switch (reason) {
    case "password_required":
      return `${webUrl}/gate/password?siteId=${siteId}&redirect=${redirectParam}`;
    case "login_required":
      return `${webUrl}/gate/login?redirect=${redirectParam}`;
    case "not_member":
    case "not_invited":
      return `${webUrl}/gate/denied?reason=${reason}&redirect=${redirectParam}`;
    default:
      return `${webUrl}/gate/denied?reason=unknown`;
  }
}

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

type AccessCheckResult =
  | { allowed: true }
  | {
      allowed: false;
      reason:
        | "password_required"
        | "login_required"
        | "not_invited"
        | "not_member";
    };

function checkPasswordAccess(
  passwordCookie: string | undefined,
  passwordHash: string | null
): AccessCheckResult {
  const valid = verifyPasswordCookie(passwordCookie, passwordHash);
  return valid
    ? { allowed: true }
    : { allowed: false, reason: "password_required" };
}

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

function normalizeFilePath(path: string): string {
  let filePath = path.startsWith("/") ? path.slice(1) : path;

  if (!filePath || filePath.endsWith("/")) {
    filePath = `${filePath}index.html`;
  }

  return filePath;
}

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
