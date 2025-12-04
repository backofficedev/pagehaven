import { describe, expect, it } from "vitest";
import { cn } from "./utils";

describe("cn utility", () => {
  describe("smoke tests", () => {
    it("exists and is callable", () => {
      expect(typeof cn).toBe("function");
    });

    it("returns a string", () => {
      const result = cn("test");
      expect(typeof result).toBe("string");
    });
  });

  describe("basic class merging", () => {
    it("returns single class unchanged", () => {
      expect(cn("text-red-500")).toBe("text-red-500");
    });

    it("combines multiple classes", () => {
      const result = cn("text-red-500", "bg-blue-500");
      expect(result).toContain("text-red-500");
      expect(result).toContain("bg-blue-500");
    });

    it("handles empty string", () => {
      expect(cn("")).toBe("");
    });

    it("handles no arguments", () => {
      expect(cn()).toBe("");
    });
  });

  describe("tailwind class merging", () => {
    it("merges conflicting padding classes", () => {
      const result = cn("p-4", "p-8");
      expect(result).toBe("p-8");
    });

    it("merges conflicting margin classes", () => {
      const result = cn("m-2", "m-4");
      expect(result).toBe("m-4");
    });

    it("merges conflicting text color classes", () => {
      const result = cn("text-red-500", "text-blue-500");
      expect(result).toBe("text-blue-500");
    });

    it("merges conflicting background classes", () => {
      const result = cn("bg-red-500", "bg-blue-500");
      expect(result).toBe("bg-blue-500");
    });

    it("preserves non-conflicting classes", () => {
      const result = cn("text-red-500", "bg-blue-500", "p-4");
      expect(result).toContain("text-red-500");
      expect(result).toContain("bg-blue-500");
      expect(result).toContain("p-4");
    });
  });

  describe("conditional classes", () => {
    it("handles boolean conditions", () => {
      const isActive = true;
      const result = cn("base", isActive && "active");
      expect(result).toContain("base");
      expect(result).toContain("active");
    });

    it("filters out false values", () => {
      const isActive = false;
      const result = cn("base", isActive && "active");
      expect(result).toBe("base");
      expect(result).not.toContain("active");
    });

    it("handles null values", () => {
      const result = cn("base", null);
      expect(result).toBe("base");
    });

    it("handles undefined values", () => {
      const result = cn("base", undefined);
      expect(result).toBe("base");
    });
  });

  describe("array inputs", () => {
    it("handles array of classes", () => {
      const result = cn(["text-red-500", "bg-blue-500"]);
      expect(result).toContain("text-red-500");
      expect(result).toContain("bg-blue-500");
    });

    it("handles nested arrays", () => {
      const result = cn(["text-red-500", ["bg-blue-500", "p-4"]]);
      expect(result).toContain("text-red-500");
      expect(result).toContain("bg-blue-500");
      expect(result).toContain("p-4");
    });
  });

  describe("object inputs", () => {
    it("handles object with boolean values", () => {
      const result = cn({
        "text-red-500": true,
        "bg-blue-500": false,
      });
      expect(result).toContain("text-red-500");
      expect(result).not.toContain("bg-blue-500");
    });

    it("handles mixed inputs", () => {
      const result = cn("base", { active: true, disabled: false }, ["extra"]);
      expect(result).toContain("base");
      expect(result).toContain("active");
      expect(result).not.toContain("disabled");
      expect(result).toContain("extra");
    });
  });

  describe("edge cases", () => {
    it("handles duplicate classes", () => {
      const result = cn("p-4", "p-4");
      expect(result).toBe("p-4");
    });

    it("handles whitespace in classes", () => {
      const result = cn("text-red-500", "bg-blue-500");
      expect(result).toContain("text-red-500");
      expect(result).toContain("bg-blue-500");
    });

    it("handles complex tailwind classes", () => {
      const result = cn("hover:bg-red-500", "focus:ring-2", "dark:text-white");
      expect(result).toContain("hover:bg-red-500");
      expect(result).toContain("focus:ring-2");
      expect(result).toContain("dark:text-white");
    });

    it("handles responsive classes", () => {
      const result = cn("md:text-lg", "lg:text-xl");
      expect(result).toContain("md:text-lg");
      expect(result).toContain("lg:text-xl");
    });
  });
});
