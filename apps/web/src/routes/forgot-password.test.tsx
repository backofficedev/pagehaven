import { describe, expect, it, vi } from "vitest";

// Mock dependencies
vi.mock("@tanstack/react-router", () => ({
  createFileRoute: () => () => ({
    component: vi.fn(),
  }),
}));

vi.mock("@/components/forgot-password-page", () => ({
  default: () => <div data-testid="forgot-password-page">Forgot Password</div>,
}));

describe("forgot-password route", () => {
  it("exports Route", async () => {
    const module = await import("./forgot-password");
    expect(module.Route).toBeDefined();
  });
});
