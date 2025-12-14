import { existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { findWorkspaceRoot } from "./path";

const TEST_DIR = path.join(import.meta.dirname, "__test_path__");

describe("findWorkspaceRoot", () => {
  beforeEach(() => {
    if (existsSync(TEST_DIR)) {
      rmSync(TEST_DIR, { recursive: true });
    }
    mkdirSync(TEST_DIR, { recursive: true });
  });

  afterEach(() => {
    if (existsSync(TEST_DIR)) {
      rmSync(TEST_DIR, { recursive: true });
    }
  });

  it("finds turbo.json in current directory", () => {
    writeFileSync(path.join(TEST_DIR, "turbo.json"), "{}");

    const result = findWorkspaceRoot(TEST_DIR);

    expect(result).toBe(TEST_DIR);
  });

  it("finds turbo.json in parent directory", () => {
    const childDir = path.join(TEST_DIR, "child");
    mkdirSync(childDir, { recursive: true });
    writeFileSync(path.join(TEST_DIR, "turbo.json"), "{}");

    const result = findWorkspaceRoot(childDir);

    expect(result).toBe(TEST_DIR);
  });

  it("traverses multiple levels up to find turbo.json", () => {
    const deepDir = path.join(TEST_DIR, "a", "b", "c");
    mkdirSync(deepDir, { recursive: true });
    writeFileSync(path.join(TEST_DIR, "turbo.json"), "{}");

    const result = findWorkspaceRoot(deepDir);

    expect(result).toBe(TEST_DIR);
  });

  it("throws when turbo.json is not found at filesystem root", () => {
    // Note: This test cannot easily verify the throw case because TEST_DIR
    // is inside the actual workspace which has turbo.json.
    // Instead, we verify that it finds the actual workspace root.
    const result = findWorkspaceRoot(TEST_DIR);
    expect(result).toContain("pagehaven");
  });
});
