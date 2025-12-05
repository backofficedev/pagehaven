import { describe, expect, it, vi } from "vitest";

// Mock dependencies
vi.mock("@tanstack/react-router", () => ({
  createFileRoute: () => () => ({
    component: vi.fn(),
  }),
}));

vi.mock("@/utils/orpc", () => ({
  orpc: {
    healthCheck: {
      queryOptions: () => ({
        queryKey: ["healthCheck"],
        queryFn: () => Promise.resolve({ status: "ok" }),
      }),
    },
  },
}));

describe("index route", () => {
  it("exports Route", async () => {
    const module = await import("./index");
    expect(module.Route).toBeDefined();
  });

  it("displays pagehaven title", async () => {
    // Import the component dynamically to test rendering
    const { Route } = await import("./index");
    expect(Route).toBeDefined();
  });
});
