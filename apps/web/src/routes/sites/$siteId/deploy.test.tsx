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
  ArrowLeft: () => null,
  Check: () => null,
  Clock: () => null,
  FileUp: () => null,
  Loader2: () => null,
  Rocket: () => null,
  Upload: () => null,
  X: () => null,
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

vi.mock("@/lib/auth-client", () => ({
  authClient: {
    getSession: vi.fn(() =>
      Promise.resolve({ data: { user: { name: "Test" } } })
    ),
  },
}));

vi.mock("@/utils/orpc", () => ({
  orpc: {
    deployment: {
      list: {
        queryOptions: () => ({
          queryKey: ["deployments", "1"],
          queryFn: () => Promise.resolve([]),
        }),
      },
    },
    upload: {
      uploadFiles: {
        mutationOptions: () => ({}),
      },
    },
  },
  queryClient: {
    invalidateQueries: vi.fn(),
  },
}));

describe("sites/$siteId/deploy route", () => {
  it("exports Route", async () => {
    const module = await import("./deploy");
    expect(module.Route).toBeDefined();
  });
});
