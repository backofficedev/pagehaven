import { render, screen } from "@testing-library/react";
import type React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock session data
const mockSessionData = {
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
};

let mockHasSession = true;
const mockRedirect = vi.fn();

// Mock dependencies
vi.mock("@tanstack/react-router", () => ({
  createFileRoute: (_path: string) => (options: unknown) => {
    const opts = options as {
      component: React.ComponentType;
      beforeLoad: () => Promise<unknown>;
    };
    return {
      ...opts,
      useRouteContext: () => ({
        session: { data: mockSessionData },
      }),
    };
  },
  redirect: (opts: unknown) => {
    mockRedirect(opts);
    throw new Error("Redirect");
  },
}));

vi.mock("@/components/settings/settings-page", () => ({
  default: ({ session }: { session: unknown }) => (
    <div data-testid="settings-page">
      Settings for {(session as typeof mockSessionData).user.name}
    </div>
  ),
}));

vi.mock("@/lib/auth-client", () => ({
  authClient: {
    getSession: vi.fn(() =>
      Promise.resolve({
        data: mockHasSession ? mockSessionData : null,
      })
    ),
  },
}));

// Helper to render the actual component
async function renderSettingsRoute() {
  const module = await import("./index");
  const route = module.Route as unknown as { component: React.ComponentType };
  const RouteComponent = route.component;
  return render(<RouteComponent />);
}

describe("settings route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockHasSession = true;
  });

  describe("Route export", () => {
    it("exports Route", async () => {
      const module = await import("./index");
      expect(module.Route).toBeDefined();
    });
  });

  describe("component rendering", () => {
    it("renders SettingsPage with session data", async () => {
      await renderSettingsRoute();
      expect(screen.getByTestId("settings-page")).toBeInTheDocument();
      expect(screen.getByText("Settings for Test User")).toBeInTheDocument();
    });
  });

  describe("beforeLoad guard", () => {
    it("redirects to login when no session", async () => {
      mockHasSession = false;
      const module = await import("./index");
      const route = module.Route as unknown as {
        beforeLoad: () => Promise<unknown>;
      };

      await expect(route.beforeLoad()).rejects.toThrow("Redirect");
      expect(mockRedirect).toHaveBeenCalledWith({
        to: "/login",
        throw: true,
      });
    });

    it("returns session when authenticated", async () => {
      mockHasSession = true;
      const module = await import("./index");
      const route = module.Route as unknown as {
        beforeLoad: () => Promise<{
          session: { data: typeof mockSessionData };
        }>;
      };

      const result = await route.beforeLoad();
      expect(result.session).toBeDefined();
      expect(result.session.data).toEqual(mockSessionData);
    });
  });

  describe("SessionData type", () => {
    it("session data has correct structure", () => {
      expect(mockSessionData.user.id).toBe("1");
      expect(mockSessionData.user.name).toBe("Test User");
      expect(mockSessionData.user.email).toBe("test@example.com");
      expect(mockSessionData.user.emailVerified).toBe(true);
      expect(mockSessionData.session.id).toBe("session-1");
      expect(mockSessionData.session.userId).toBe("1");
    });
  });
});
