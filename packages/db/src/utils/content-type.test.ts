import { describe, expect, it } from "vitest";
import { CONTENT_TYPES, getContentType } from "./content-type";

describe("content-type", () => {
  describe("smoke tests", () => {
    it("CONTENT_TYPES object exists and has entries", () => {
      expect(typeof CONTENT_TYPES).toBe("object");
      expect(Object.keys(CONTENT_TYPES).length).toBeGreaterThan(0);
    });

    it("getContentType function exists and is callable", () => {
      expect(typeof getContentType).toBe("function");
    });
  });

  describe("happy path - common file types", () => {
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

    it("returns correct content type for document files", () => {
      expect(getContentType("document.pdf")).toBe("application/pdf");
      expect(getContentType("data.xml")).toBe("application/xml");
      expect(getContentType("archive.zip")).toBe("application/zip");
      expect(getContentType("readme.txt")).toBe("text/plain");
      expect(getContentType("README.md")).toBe("text/markdown");
      expect(getContentType("module.wasm")).toBe("application/wasm");
    });
  });

  describe("edge cases", () => {
    it("returns octet-stream for unknown extensions", () => {
      expect(getContentType("file.unknown")).toBe("application/octet-stream");
      expect(getContentType("file.xyz")).toBe("application/octet-stream");
      expect(getContentType("file.abc123")).toBe("application/octet-stream");
    });

    it("handles files without extensions", () => {
      expect(getContentType("Makefile")).toBe("application/octet-stream");
      expect(getContentType("LICENSE")).toBe("application/octet-stream");
      expect(getContentType("README")).toBe("application/octet-stream");
    });

    it("handles uppercase extensions (case insensitive)", () => {
      expect(getContentType("image.PNG")).toBe("image/png");
      expect(getContentType("style.CSS")).toBe("text/css");
      expect(getContentType("script.JS")).toBe("application/javascript");
      expect(getContentType("data.JSON")).toBe("application/json");
    });

    it("handles mixed case extensions", () => {
      expect(getContentType("image.Png")).toBe("image/png");
      expect(getContentType("style.CsS")).toBe("text/css");
    });

    it("handles files with multiple dots", () => {
      expect(getContentType("app.min.js")).toBe("application/javascript");
      expect(getContentType("styles.module.css")).toBe("text/css");
      expect(getContentType("data.backup.json")).toBe("application/json");
    });

    it("handles paths with directories", () => {
      expect(getContentType("assets/images/logo.png")).toBe("image/png");
      expect(getContentType("/var/www/html/index.html")).toBe("text/html");
    });

    it("handles empty string", () => {
      expect(getContentType("")).toBe("application/octet-stream");
    });

    it("handles dot-only filename", () => {
      expect(getContentType(".")).toBe("application/octet-stream");
    });

    it("handles hidden files with extensions", () => {
      expect(getContentType(".gitignore")).toBe("application/octet-stream");
      expect(getContentType(".env.json")).toBe("application/json");
    });
  });
});
