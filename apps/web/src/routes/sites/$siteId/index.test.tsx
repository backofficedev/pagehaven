import { describe, expect, it, vi } from "vitest";

// Mock dependencies
vi.mock("@tanstack/react-query", () => ({
  useQuery: vi.fn(() => ({
    data: { id: "1", name: "Test Site", subdomain: "test" },
    isLoading: false,
  })),
}));

vi.mock("@tanstack/react-router", () => ({
  createFileRoute: () => () => ({
    component: vi.fn(),
    beforeLoad: vi.fn(),
  }),
  Link: ({ children }: { children: React.ReactNode }) => (
    <span>{children}</span>
  ),
  redirect: vi.fn(),
}));

vi.mock("lucide-react", () => ({
  BarChart3: () => null,
  ExternalLink: () => null,
  Globe: () => null,
  Rocket: () => null,
  Settings: () => null,
  Upload: () => null,
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
  getSiteUrl: (subdomain: string) => `https://${subdomain}.pagehaven.io`,
  getSiteDisplayDomain: (subdomain: string) => `${subdomain}.pagehaven.io`,
}));

vi.mock("@/utils/orpc", () => ({
  orpc: {
    site: {
      get: {
        queryOptions: () => ({
          queryKey: ["site", "1"],
          queryFn: () =>
            Promise.resolve({ id: "1", name: "Test", subdomain: "test" }),
        }),
      },
    },
  },
}));

describe("sites/$siteId route", () => {
  it("exports Route", async () => {
    const module = await import("./index");
    expect(module.Route).toBeDefined();
  });
});
