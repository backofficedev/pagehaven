import { describe, expect, it, vi } from "vitest";

// Mock dependencies
vi.mock("@tanstack/react-query", () => ({
  useQuery: vi.fn(() => ({
    data: { views: [], totalViews: 0 },
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
  ArrowLeft: () => null,
  BarChart3: () => null,
  Calendar: () => null,
  Eye: () => null,
  TrendingUp: () => null,
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

vi.mock("@/utils/orpc", () => ({
  orpc: {
    analytics: {
      getSiteAnalytics: {
        queryOptions: () => ({
          queryKey: ["analytics", "1"],
          queryFn: () => Promise.resolve({ views: [], totalViews: 0 }),
        }),
      },
    },
  },
}));

describe("sites/$siteId/analytics route", () => {
  it("exports Route", async () => {
    const module = await import("./analytics");
    expect(module.Route).toBeDefined();
  });
});
