import { describe, expect, it, vi } from "vitest";

// Mock dependencies
vi.mock("@tanstack/react-query", () => ({
  useQuery: vi.fn(() => ({
    data: { id: "1", name: "Test Site", subdomain: "test" },
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
  useNavigate: () => vi.fn(),
}));

vi.mock("lucide-react", () => ({
  ArrowLeft: () => null,
  Eye: () => null,
  Globe: () => null,
  Key: () => null,
  Lock: () => null,
  Save: () => null,
  Trash2: () => null,
  Users: () => null,
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
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
      update: {
        mutationOptions: () => ({}),
      },
      delete: {
        mutationOptions: () => ({}),
      },
    },
    access: {
      get: {
        queryOptions: () => ({
          queryKey: ["access", "1"],
          queryFn: () => Promise.resolve({ type: "public" }),
        }),
      },
      update: {
        mutationOptions: () => ({}),
      },
    },
  },
  queryClient: {
    invalidateQueries: vi.fn(),
  },
}));

describe("sites/$siteId/settings route", () => {
  it("exports Route", async () => {
    const module = await import("./settings");
    expect(module.Route).toBeDefined();
  });
});
