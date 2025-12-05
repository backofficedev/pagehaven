import { describe, expect, it } from "vitest";
import { formatSize } from "./format";

describe("formatSize", () => {
  it("formats bytes correctly", () => {
    expect(formatSize(500)).toBe("500 B");
    expect(formatSize(1024)).toBe("1.0 KB");
    expect(formatSize(2048)).toBe("2.0 KB");
    expect(formatSize(1_048_576)).toBe("1.0 MB");
    expect(formatSize(5_242_880)).toBe("5.0 MB");
  });

  it("handles edge cases", () => {
    expect(formatSize(0)).toBe("0 B");
    expect(formatSize(1023)).toBe("1023 B");
    expect(formatSize(1024 * 1024 - 1)).toBe("1024.0 KB");
  });
});
