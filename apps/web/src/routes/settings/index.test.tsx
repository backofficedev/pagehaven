import { describe, expect, it, vi } from "vitest";

// Mock dependencies
vi.mock("@tanstack/react-router", () => ({
  createFileRoute: () => () => ({
    component: vi.fn(),
    beforeLoad: vi.fn(),
    useRouteContext: vi.fn(() => ({
      session: {
        data: {
          user: {
            id: "1",
            name: "Test User",
            email: "test@example.com",
            emailVerified: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          session: {
            id: "session-1",
            userId: "1",
            token: "token",
            expiresAt: new Date(),
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        },
      },
    })),
  }),
  redirect: vi.fn(),
}));

vi.mock("@/components/settings/settings-page", () => ({
  default: () => <div data-testid="settings-page">Settings</div>,
}));

vi.mock("@/lib/auth-client", () => ({
  authClient: {
    getSession: vi.fn(() =>
      Promise.resolve({
        data: {
          user: { id: "1", name: "Test", email: "test@example.com" },
        },
      })
    ),
  },
}));

describe("settings route", () => {
  it("exports Route", async () => {
    const module = await import("./index");
    expect(module.Route).toBeDefined();
  });
});
