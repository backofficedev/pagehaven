import type { Mock } from "vitest";
import { vi } from "vitest";

type MockQueryBuilder = {
  get: Mock;
};

type MockFromResult = {
  where: Mock<() => MockQueryBuilder>;
  innerJoin: Mock<() => { where: Mock<() => MockQueryBuilder> }>;
  orderBy: Mock<() => { limit: Mock<() => { offset: Mock }> }>;
};

type MockDb = {
  select: Mock<() => { from: Mock<() => MockFromResult> }>;
  insert: Mock<() => { values: Mock }>;
  update: Mock<() => { set: Mock<() => { where: Mock }> }>;
  delete: Mock<() => { where: Mock }>;
  batch: Mock;
};

/**
 * Creates a standard mock for the @pagehaven/db module.
 * Use this in vi.mock() calls to reduce duplication across test files.
 */
export function createMockDb(): { db: MockDb } {
  return {
    db: {
      select: vi.fn(() => ({
        from: vi.fn(() => ({
          where: vi.fn(() => ({
            get: vi.fn(),
          })),
          innerJoin: vi.fn(() => ({
            where: vi.fn(() => ({
              get: vi.fn(),
            })),
          })),
          orderBy: vi.fn(() => ({
            limit: vi.fn(() => ({
              offset: vi.fn(),
            })),
          })),
        })),
      })),
      insert: vi.fn(() => ({
        values: vi.fn(),
      })),
      update: vi.fn(() => ({
        set: vi.fn(() => ({
          where: vi.fn(),
        })),
      })),
      delete: vi.fn(() => ({
        where: vi.fn(),
      })),
      batch: vi.fn(),
    },
  };
}

/**
 * Standard mock db instance for use in tests.
 * Import and use with vi.mock("@pagehaven/db", () => mockDb)
 */
export const mockDb: { db: MockDb } = createMockDb();
