import { describe, expect, it } from "vitest";
import { calculateExpiresAt, expiresInDaysSchema } from "./expiration";

describe("expiresInDaysSchema", () => {
  it("accepts valid day values within range", () => {
    expect(expiresInDaysSchema.parse(1)).toBe(1);
    expect(expiresInDaysSchema.parse(30)).toBe(30);
    expect(expiresInDaysSchema.parse(365)).toBe(365);
  });

  it("accepts undefined", () => {
    expect(expiresInDaysSchema.parse(undefined)).toBeUndefined();
  });

  it("rejects values below minimum", () => {
    expect(() => expiresInDaysSchema.parse(0)).toThrow();
    expect(() => expiresInDaysSchema.parse(-1)).toThrow();
  });

  it("rejects values above maximum", () => {
    expect(() => expiresInDaysSchema.parse(366)).toThrow();
    expect(() => expiresInDaysSchema.parse(1000)).toThrow();
  });
});

describe("calculateExpiresAt", () => {
  it("returns undefined when expiresInDays is undefined", () => {
    expect(calculateExpiresAt(undefined)).toBeUndefined();
  });

  it("returns undefined when expiresInDays is 0", () => {
    expect(calculateExpiresAt(0)).toBeUndefined();
  });

  it("calculates correct expiration date for 1 day", () => {
    const now = Date.now();
    const result = calculateExpiresAt(1);

    expect(result).toBeInstanceOf(Date);
    expect(result).toBeDefined();
    if (result) {
      const expectedMs = now + 1 * 24 * 60 * 60 * 1000;
      expect(result.getTime()).toBeGreaterThanOrEqual(expectedMs - 100);
      expect(result.getTime()).toBeLessThanOrEqual(expectedMs + 100);
    }
  });

  it("calculates correct expiration date for 30 days", () => {
    const now = Date.now();
    const result = calculateExpiresAt(30);

    expect(result).toBeInstanceOf(Date);
    expect(result).toBeDefined();
    if (result) {
      const expectedMs = now + 30 * 24 * 60 * 60 * 1000;
      expect(result.getTime()).toBeGreaterThanOrEqual(expectedMs - 100);
      expect(result.getTime()).toBeLessThanOrEqual(expectedMs + 100);
    }
  });

  it("calculates correct expiration date for 365 days", () => {
    const now = Date.now();
    const result = calculateExpiresAt(365);

    expect(result).toBeInstanceOf(Date);
    expect(result).toBeDefined();
    if (result) {
      const expectedMs = now + 365 * 24 * 60 * 60 * 1000;
      expect(result.getTime()).toBeGreaterThanOrEqual(expectedMs - 100);
      expect(result.getTime()).toBeLessThanOrEqual(expectedMs + 100);
    }
  });
});
