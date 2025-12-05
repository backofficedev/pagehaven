import { describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { createMockDb } from "../test-utils/mock-db";

const DATE_FORMAT_REGEX = /^\d{4}-\d{2}-\d{2}$/;

// Mock the database module using shared utility
vi.mock("@pagehaven/db", () => createMockDb());

// Record view schema
const recordViewSchema = z.object({
  siteId: z.string(),
  path: z.string(),
  bytes: z.number().optional(),
  visitorId: z.string().optional(),
});

// Get summary schema
const getSummarySchema = z.object({
  siteId: z.string(),
  days: z.number().min(1).max(90).default(30),
});

describe("analytics router", () => {
  describe("smoke tests", () => {
    it("record view schema validates correctly", () => {
      expect(
        recordViewSchema.safeParse({
          siteId: "site-123",
          path: "/",
        }).success
      ).toBe(true);
    });

    it("get summary schema validates correctly", () => {
      expect(
        getSummarySchema.safeParse({
          siteId: "site-123",
        }).success
      ).toBe(true);
    });
  });
});

describe("record view schema", () => {
  describe("happy path", () => {
    it("accepts minimal input (siteId and path)", () => {
      const result = recordViewSchema.safeParse({
        siteId: "site-123",
        path: "/",
      });
      expect(result.success).toBe(true);
    });

    it("accepts with bytes", () => {
      const result = recordViewSchema.safeParse({
        siteId: "site-123",
        path: "/page",
        bytes: 1024,
      });
      expect(result.success).toBe(true);
    });

    it("accepts with visitorId", () => {
      const result = recordViewSchema.safeParse({
        siteId: "site-123",
        path: "/page",
        visitorId: "visitor-abc",
      });
      expect(result.success).toBe(true);
    });

    it("accepts with all optional fields", () => {
      const result = recordViewSchema.safeParse({
        siteId: "site-123",
        path: "/page",
        bytes: 2048,
        visitorId: "visitor-abc",
      });
      expect(result.success).toBe(true);
    });

    it("accepts various path formats", () => {
      const paths = [
        "/",
        "/page",
        "/path/to/page",
        "/page.html",
        "/api/data.json",
        "/assets/image.png",
      ];
      for (const path of paths) {
        const result = recordViewSchema.safeParse({
          siteId: "site-123",
          path,
        });
        expect(result.success).toBe(true);
      }
    });
  });

  describe("negative tests", () => {
    it("rejects missing siteId", () => {
      const result = recordViewSchema.safeParse({
        path: "/",
      });
      expect(result.success).toBe(false);
    });

    it("rejects missing path", () => {
      const result = recordViewSchema.safeParse({
        siteId: "site-123",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("edge cases", () => {
    it("accepts zero bytes", () => {
      const result = recordViewSchema.safeParse({
        siteId: "site-123",
        path: "/",
        bytes: 0,
      });
      expect(result.success).toBe(true);
    });

    it("accepts large byte values", () => {
      const result = recordViewSchema.safeParse({
        siteId: "site-123",
        path: "/",
        bytes: 1_000_000_000, // 1GB
      });
      expect(result.success).toBe(true);
    });

    it("accepts empty path", () => {
      const result = recordViewSchema.safeParse({
        siteId: "site-123",
        path: "",
      });
      expect(result.success).toBe(true);
    });
  });
});

describe("get summary schema", () => {
  describe("happy path", () => {
    it("accepts siteId only (uses default days)", () => {
      const result = getSummarySchema.safeParse({
        siteId: "site-123",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.days).toBe(30);
      }
    });

    it("accepts custom days", () => {
      const result = getSummarySchema.safeParse({
        siteId: "site-123",
        days: 7,
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.days).toBe(7);
      }
    });

    it("accepts days at minimum (1)", () => {
      const result = getSummarySchema.safeParse({
        siteId: "site-123",
        days: 1,
      });
      expect(result.success).toBe(true);
    });

    it("accepts days at maximum (90)", () => {
      const result = getSummarySchema.safeParse({
        siteId: "site-123",
        days: 90,
      });
      expect(result.success).toBe(true);
    });
  });

  describe("negative tests", () => {
    it("rejects missing siteId", () => {
      const result = getSummarySchema.safeParse({
        days: 30,
      });
      expect(result.success).toBe(false);
    });

    it("rejects days below minimum", () => {
      const result = getSummarySchema.safeParse({
        siteId: "site-123",
        days: 0,
      });
      expect(result.success).toBe(false);
    });

    it("rejects days above maximum", () => {
      const result = getSummarySchema.safeParse({
        siteId: "site-123",
        days: 91,
      });
      expect(result.success).toBe(false);
    });

    it("rejects negative days", () => {
      const result = getSummarySchema.safeParse({
        siteId: "site-123",
        days: -1,
      });
      expect(result.success).toBe(false);
    });
  });
});

describe("date string generation", () => {
  function getDateString(date: Date = new Date()): string {
    return date.toISOString().split("T")[0] ?? "";
  }

  describe("happy path", () => {
    it("generates YYYY-MM-DD format", () => {
      const date = new Date("2024-03-15T12:00:00Z");
      const dateString = getDateString(date);
      expect(dateString).toBe("2024-03-15");
    });

    it("generates current date when no argument", () => {
      const dateString = getDateString();
      expect(dateString).toMatch(DATE_FORMAT_REGEX);
    });
  });

  describe("edge cases", () => {
    it("handles first day of year", () => {
      const date = new Date("2024-01-01T00:00:00Z");
      const dateString = getDateString(date);
      expect(dateString).toBe("2024-01-01");
    });

    it("handles last day of year", () => {
      const date = new Date("2024-12-31T23:59:59Z");
      const dateString = getDateString(date);
      expect(dateString).toBe("2024-12-31");
    });

    it("handles leap year date", () => {
      const date = new Date("2024-02-29T12:00:00Z");
      const dateString = getDateString(date);
      expect(dateString).toBe("2024-02-29");
    });
  });
});

describe("analytics aggregation logic", () => {
  // Simulated analytics data structure
  type AnalyticsRecord = {
    id: string;
    siteId: string;
    date: string;
    path: string;
    views: number;
    uniqueVisitors: number;
    bandwidth: number;
  };

  /** Factory to create test analytics records with defaults */
  function createAnalyticsRecord(
    overrides: Partial<AnalyticsRecord> & { id: string }
  ): AnalyticsRecord {
    return {
      siteId: "s1",
      date: "2024-01-01",
      path: "/",
      views: 10,
      uniqueVisitors: 5,
      bandwidth: 1000,
      ...overrides,
    };
  }

  function aggregateByDate(
    records: AnalyticsRecord[]
  ): Map<string, { views: number; bandwidth: number }> {
    const result = new Map<string, { views: number; bandwidth: number }>();

    for (const record of records) {
      const existing = result.get(record.date);
      if (existing) {
        existing.views += record.views;
        existing.bandwidth += record.bandwidth;
      } else {
        result.set(record.date, {
          views: record.views,
          bandwidth: record.bandwidth,
        });
      }
    }

    return result;
  }

  function aggregateByPath(records: AnalyticsRecord[]): Map<string, number> {
    const result = new Map<string, number>();

    for (const record of records) {
      const existing = result.get(record.path) ?? 0;
      result.set(record.path, existing + record.views);
    }

    return result;
  }

  describe("aggregation by date", () => {
    it("aggregates views and bandwidth by date", () => {
      const records: AnalyticsRecord[] = [
        createAnalyticsRecord({ id: "1" }),
        createAnalyticsRecord({
          id: "2",
          path: "/about",
          views: 5,
          uniqueVisitors: 3,
          bandwidth: 500,
        }),
        createAnalyticsRecord({
          id: "3",
          date: "2024-01-02",
          views: 20,
          uniqueVisitors: 10,
          bandwidth: 2000,
        }),
      ];

      const result = aggregateByDate(records);

      expect(result.get("2024-01-01")).toEqual({ views: 15, bandwidth: 1500 });
      expect(result.get("2024-01-02")).toEqual({ views: 20, bandwidth: 2000 });
    });

    it("handles empty records", () => {
      const result = aggregateByDate([]);
      expect(result.size).toBe(0);
    });
  });

  describe("aggregation by path", () => {
    it("aggregates views by path", () => {
      const records: AnalyticsRecord[] = [
        createAnalyticsRecord({ id: "1" }),
        createAnalyticsRecord({
          id: "2",
          date: "2024-01-02",
          views: 15,
          uniqueVisitors: 8,
          bandwidth: 1500,
        }),
        createAnalyticsRecord({
          id: "3",
          path: "/about",
          views: 5,
          uniqueVisitors: 3,
          bandwidth: 500,
        }),
      ];

      const result = aggregateByPath(records);

      expect(result.get("/")).toBe(25);
      expect(result.get("/about")).toBe(5);
    });

    it("handles empty records", () => {
      const result = aggregateByPath([]);
      expect(result.size).toBe(0);
    });
  });
});
