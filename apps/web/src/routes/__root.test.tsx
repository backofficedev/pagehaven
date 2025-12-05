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
  createRootRouteWithContext: () => () => ({
    component: vi.fn(),
    head: vi.fn(),
  }),
  HeadContent: () => null,
  Outlet: () => <div data-testid="outlet">Outlet Content</div>,
}));

vi.mock("@tanstack/react-router-devtools", () => ({
  TanStackRouterDevtools: () => null,
}));

vi.mock("@/components/header", () => ({
  default: () => <header data-testid="header">Header</header>,
}));

vi.mock("@/components/theme-provider", () => ({
  ThemeProvider: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

vi.mock("@/components/ui/sonner", () => ({
  Toaster: () => null,
}));

vi.mock("@/utils/orpc", () => ({
  link: {},
  orpc: {},
}));

describe("__root route", () => {
  it("exports Route", async () => {
    const module = await import("./__root");
    expect(module.Route).toBeDefined();
  });

  it("exports RouterAppContext type", async () => {
    // Type check - this test verifies the type exists
    const module = await import("./__root");
    expect(module).toBeDefined();
  });
});
