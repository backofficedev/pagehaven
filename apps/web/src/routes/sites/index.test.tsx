import { describe, expect, it, vi } from "vitest";

// Mock dependencies
vi.mock("@tanstack/react-query", () => ({
  useQuery: vi.fn(() => ({
    data: [],
    isLoading: false,
  })),
  useMutation: vi.fn(() => ({
    mutate: vi.fn(),
    isPending: false,
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
  Eye: () => null,
  Globe: () => null,
  Lock: () => null,
  Plus: () => null,
  Users: () => null,
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock("@/components/ui/button", () => ({
  Button: ({
    children,
    onClick,
  }: {
    children: React.ReactNode;
    onClick?: () => void;
  }) => (
    <button onClick={onClick} type="button">
      {children}
    </button>
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

vi.mock("@/components/ui/input", () => ({
  Input: (props: React.InputHTMLAttributes<HTMLInputElement>) => (
    <input {...props} />
  ),
}));

vi.mock("@/components/ui/label", () => ({
  Label: ({ children }: { children: React.ReactNode }) => (
    <span>{children}</span>
  ),
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
      create: {
        mutationOptions: () => ({}),
      },
    },
  },
  queryClient: {
    invalidateQueries: vi.fn(),
  },
}));

describe("sites route", () => {
  it("exports Route", async () => {
    const module = await import("./index");
    expect(module.Route).toBeDefined();
  });
});
