/**
 * Schema tests for analytics-related database tables
 * Tests table structure and exported types
 */
import { describe, expect, it } from "vitest";
import { domainVerification, siteAnalytics } from "./analytics";

describe("Analytics Schema", () => {
  describe("smoke tests", () => {
    it("exports siteAnalytics table", () => {
      expect(siteAnalytics).toBeDefined();
    });

    it("exports domainVerification table", () => {
      expect(domainVerification).toBeDefined();
    });
  });

  describe("siteAnalytics table structure", () => {
    it("has id column", () => {
      expect(siteAnalytics.id).toBeDefined();
    });

    it("has siteId column", () => {
      expect(siteAnalytics.siteId).toBeDefined();
    });

    it("has date column", () => {
      expect(siteAnalytics.date).toBeDefined();
    });

    it("has path column", () => {
      expect(siteAnalytics.path).toBeDefined();
    });

    it("has views column", () => {
      expect(siteAnalytics.views).toBeDefined();
    });

    it("has uniqueVisitors column", () => {
      expect(siteAnalytics.uniqueVisitors).toBeDefined();
    });

    it("has bandwidth column", () => {
      expect(siteAnalytics.bandwidth).toBeDefined();
    });
  });

  describe("domainVerification table structure", () => {
    it("has id column", () => {
      expect(domainVerification.id).toBeDefined();
    });

    it("has siteId column", () => {
      expect(domainVerification.siteId).toBeDefined();
    });

    it("has domain column", () => {
      expect(domainVerification.domain).toBeDefined();
    });

    it("has verificationToken column", () => {
      expect(domainVerification.verificationToken).toBeDefined();
    });

    it("has status column", () => {
      expect(domainVerification.status).toBeDefined();
    });

    it("has lastCheckedAt column", () => {
      expect(domainVerification.lastCheckedAt).toBeDefined();
    });

    it("has verifiedAt column", () => {
      expect(domainVerification.verifiedAt).toBeDefined();
    });

    it("has createdAt column", () => {
      expect(domainVerification.createdAt).toBeDefined();
    });
  });

  describe("table exports", () => {
    it("siteAnalytics table is a valid drizzle table", () => {
      expect(typeof siteAnalytics).toBe("object");
      expect(siteAnalytics.id).toBeDefined();
    });

    it("domainVerification table is a valid drizzle table", () => {
      expect(typeof domainVerification).toBe("object");
      expect(domainVerification.id).toBeDefined();
    });
  });

  describe("domain verification status enum", () => {
    it("status column exists for verification states", () => {
      // The status column should be defined with enum values
      expect(domainVerification.status).toBeDefined();
    });
  });
});
