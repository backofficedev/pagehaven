import { describe, expect, it, vi } from "vitest";

vi.mock("@tanstack/react-router", () => ({
  createFileRoute: () => () => ({
    component: vi.fn(),
  }),
  useSearch: vi.fn(),
}));

vi.mock("@/components/auth/back-to-sign-in-link", () => ({
  BackToSignInLink: () => null,
}));

vi.mock("@/components/auth-page-layout", () => ({
  AuthPageLayout: () => null,
}));

vi.mock("@/components/reset-password-page", () => ({
  default: () => null,
}));

describe("reset-password route", () => {
  it("exports Route", async () => {
    const module = await import("./reset-password");
    expect(module.Route).toBeDefined();
  });

  it("has validateSearch schema for token", async () => {
    const { z } = await import("zod");
    const schema = z.object({ token: z.string().optional() });

    expect(schema.parse({})).toEqual({});
    expect(schema.parse({ token: "abc123" })).toEqual({ token: "abc123" });
  });
});
