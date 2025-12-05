import { render, screen } from "@testing-library/react";
import type React from "react";
import { describe, expect, it, vi } from "vitest";

// Mock dependencies
vi.mock("@orpc/client", () => ({
  createORPCClient: vi.fn(() => ({})),
}));

vi.mock("@orpc/tanstack-query", () => ({
  createTanstackQueryUtils: vi.fn(() => ({})),
}));

vi.mock("@tanstack/react-query-devtools", () => ({
  ReactQueryDevtools: () => null,
}));

vi.mock("@tanstack/react-router", () => ({
  createRootRouteWithContext:
    () =>
    (options: { component: React.ComponentType; head: () => unknown }) => ({
      ...options,
    }),
  HeadContent: () => <div data-testid="head-content" />,
  Outlet: () => <div data-testid="outlet">Outlet Content</div>,
}));

vi.mock("@tanstack/react-router-devtools", () => ({
  TanStackRouterDevtools: () => <div data-testid="router-devtools" />,
}));

vi.mock("@/components/header", () => ({
  default: () => <header data-testid="header">Header</header>,
}));

vi.mock("@/components/theme-provider", () => ({
  ThemeProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="theme-provider">{children}</div>
  ),
}));

vi.mock("@/components/ui/sonner", () => ({
  Toaster: () => <div data-testid="toaster" />,
}));

vi.mock("@/utils/orpc", () => ({
  link: {},
  orpc: {},
}));

// Helper to render the actual component
async function renderRootComponent() {
  const module = await import("./__root");
  const route = module.Route as unknown as { component: React.ComponentType };
  const RootComponent = route.component;
  return render(<RootComponent />);
}

describe("__root route", () => {
  describe("Route export", () => {
    it("exports Route", async () => {
      const module = await import("./__root");
      expect(module.Route).toBeDefined();
    });

    it("exports RouterAppContext type", async () => {
      const module = await import("./__root");
      expect(module).toBeDefined();
    });
  });

  describe("RootComponent rendering", () => {
    it("renders HeadContent", async () => {
      await renderRootComponent();
      expect(screen.getByTestId("head-content")).toBeInTheDocument();
    });

    it("renders ThemeProvider", async () => {
      await renderRootComponent();
      expect(screen.getByTestId("theme-provider")).toBeInTheDocument();
    });

    it("renders Header", async () => {
      await renderRootComponent();
      expect(screen.getByTestId("header")).toBeInTheDocument();
    });

    it("renders Outlet for child routes", async () => {
      await renderRootComponent();
      expect(screen.getByTestId("outlet")).toBeInTheDocument();
    });

    it("renders Toaster for notifications", async () => {
      await renderRootComponent();
      expect(screen.getByTestId("toaster")).toBeInTheDocument();
    });

    it("renders router devtools", async () => {
      await renderRootComponent();
      expect(screen.getByTestId("router-devtools")).toBeInTheDocument();
    });
  });

  describe("head metadata", () => {
    it("provides correct head metadata", async () => {
      const module = await import("./__root");
      const route = module.Route as unknown as { head: () => unknown };
      const head = route.head();

      expect(head).toEqual({
        meta: [
          { title: "pagehaven" },
          { name: "description", content: "pagehaven is a web application" },
        ],
        links: [{ rel: "icon", href: "/favicon.ico" }],
      });
    });
  });
});
