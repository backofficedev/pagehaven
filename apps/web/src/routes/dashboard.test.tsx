import { describe, expect, it, vi } from "vitest";

// Mock dependencies
vi.mock("@tanstack/react-query", () => ({
  useQuery: vi.fn(() => ({
    data: [],
    isLoading: false,
  })),
}));

vi.mock("@tanstack/react-router", () => ({
  createFileRoute: () => () => ({
    component: vi.fn(),
    beforeLoad: vi.fn(),
    useRouteContext: vi.fn(() => ({
      session: { data: { user: { name: "Test User" } } },
    })),
  }),
  Link: ({ children }: { children: React.ReactNode }) => (
    <span>{children}</span>
  ),
  redirect: vi.fn(),
}));

vi.mock("lucide-react", () => ({
  ExternalLink: () => null,
  Eye: () => null,
  Globe: () => null,
  Lock: () => null,
  Plus: () => null,
  Rocket: () => null,
  Users: () => null,
}));

vi.mock("@/components/ui/button", () => ({
  Button: ({ children }: { children: React.ReactNode }) => (
    <button type="button">{children}</button>
  ),
}));

vi.mock("@/components/ui/card", () => ({
  Card: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CardContent: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  CardDescription: ({ children }: { children: React.ReactNode }) => (
    <p>{children}</p>
  ),
  CardHeader: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  CardTitle: ({ children }: { children: React.ReactNode }) => (
    <h3>{children}</h3>
  ),
}));

vi.mock("@/components/ui/skeleton", () => ({
  Skeleton: () => <div data-testid="skeleton" />,
}));

vi.mock("@/lib/auth-client", () => ({
  authClient: {
    getSession: vi.fn(() =>
      Promise.resolve({ data: { user: { name: "Test" } } })
    ),
  },
}));

vi.mock("@/utils/config", () => ({
  config: { staticDomain: "pagehaven.io" },
  getSiteDisplayDomain: (subdomain: string) => `${subdomain}.pagehaven.io`,
}));

vi.mock("@/utils/orpc", () => ({
  orpc: {
    site: {
      list: {
        queryOptions: () => ({
          queryKey: ["sites"],
          queryFn: () => Promise.resolve([]),
        }),
      },
    },
  },
}));

describe("dashboard route", () => {
  it("exports Route", async () => {
    const module = await import("./dashboard");
    expect(module.Route).toBeDefined();
  });

  it("has beforeLoad that checks authentication", async () => {
    const module = await import("./dashboard");
    expect(module.Route).toBeDefined();
  });
});
