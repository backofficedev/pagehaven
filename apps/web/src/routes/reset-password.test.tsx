import { describe, expect, it, vi } from "vitest";

// Mock dependencies
vi.mock("@tanstack/react-router", () => ({
  createFileRoute: () => () => ({
    component: vi.fn(),
  }),
}));

describe("reset-password route", () => {
  it("exports Route", async () => {
    const module = await import("./reset-password");
    expect(module.Route).toBeDefined();
  });
});
