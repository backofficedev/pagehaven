import { describe, expect, it } from "vitest";
import { formatDate } from "./format";

describe("formatDate", () => {
  it("returns N/A for null", () => {
    expect(formatDate(null)).toBe("N/A");
  });

  it("returns N/A for undefined", () => {
    expect(formatDate(undefined)).toBe("N/A");
  });

  it("formats valid date with month and day", () => {
    const result = formatDate(new Date("2024-01-15T10:30:00"));
    expect(result).toContain("Jan");
    expect(result).toContain("15");
  });
});
