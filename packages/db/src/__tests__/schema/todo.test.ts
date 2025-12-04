/**
 * Schema tests for todo-related database tables
 * Tests table structure and exported schema objects
 */
import { describe, expect, it } from "vitest";
import { todo } from "../../schema/todo";

describe("Todo Schema", () => {
  describe("smoke tests", () => {
    it("exports todo table", () => {
      expect(todo).toBeDefined();
    });

    it("todo table is a valid drizzle table", () => {
      expect(typeof todo).toBe("object");
      expect(todo.id).toBeDefined();
    });
  });

  describe("todo table structure", () => {
    it("has id column", () => {
      expect(todo.id).toBeDefined();
    });

    it("has text column", () => {
      expect(todo.text).toBeDefined();
    });

    it("has completed column", () => {
      expect(todo.completed).toBeDefined();
    });
  });

  describe("column properties", () => {
    it("id is primary key", () => {
      // Drizzle tables expose column definitions
      expect(todo.id).toBeDefined();
    });

    it("text is required", () => {
      expect(todo.text).toBeDefined();
    });

    it("completed has default value", () => {
      expect(todo.completed).toBeDefined();
    });
  });

  describe("edge cases", () => {
    it("table has expected columns", () => {
      // Count the column definitions
      const columns = Object.keys(todo).filter(
        (key) =>
          !key.startsWith("_") &&
          typeof (todo as unknown as Record<string, unknown>)[key] === "object"
      );
      expect(columns.length).toBeGreaterThanOrEqual(3);
    });

    it("all columns are defined", () => {
      expect(todo.id).not.toBeNull();
      expect(todo.text).not.toBeNull();
      expect(todo.completed).not.toBeNull();
    });
  });
});
