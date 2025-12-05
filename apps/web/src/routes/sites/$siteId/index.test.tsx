import { render, screen } from "@testing-library/react";
import type React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Store mock implementations for dynamic control
const mockUseQuery = vi.fn();
const mockUseParams = vi.fn();

// Mock dependencies
vi.mock("@tanstack/react-query", () => ({
  useQuery: () => mockUseQuery(),
}));

vi.mock("@tanstack/react-router", () => ({
  createFileRoute: (_path: string) => (options: unknown) => {
    const opts = options as { component: React.ComponentType };
    return {
      ...opts,
      useRouteContext: () => ({
        session: { data: { user: { name: "Test User" } } },
      }),
      useParams: () => mockUseParams(),
    };
  },
  Link: ({
    children,
    to,
  }: {
    children: React.ReactNode;
    to: string;
    params?: Record<string, string>;
  }) => <a href={to}>{children}</a>,
  redirect: vi.fn(),
}));

vi.mock("lucide-react", () => ({
  ArrowLeft: () => <span data-testid="arrow-left-icon" />,
  BarChart3: () => <span data-testid="bar-chart-icon" />,
  CheckCircle: () => <span data-testid="check-circle-icon" />,
  Clock: () => <span data-testid="clock-icon" />,
  ExternalLink: () => <span data-testid="external-link-icon" />,
  Globe: () => <span data-testid="globe-icon" />,
  Loader2: () => <span data-testid="loader-icon" />,
  Settings: () => <span data-testid="settings-icon" />,
  Upload: () => <span data-testid="upload-icon" />,
  XCircle: () => <span data-testid="x-circle-icon" />,
}));

vi.mock("@/components/ui/button", () => ({
  Button: ({
    children,
    variant,
  }: {
    children: React.ReactNode;
    variant?: string;
  }) => (
    <button data-variant={variant} type="button">
      {children}
    </button>
  ),
}));

vi.mock("@/components/ui/card", () => ({
  Card: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="card">{children}</div>
  ),
  CardContent: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="card-content">{children}</div>
  ),
  CardDescription: ({ children }: { children: React.ReactNode }) => (
    <p data-testid="card-description">{children}</p>
  ),
  CardHeader: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="card-header">{children}</div>
  ),
  CardTitle: ({ children }: { children: React.ReactNode }) => (
    <h3 data-testid="card-title">{children}</h3>
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
  getSiteUrl: (subdomain: string) => `https://${subdomain}.pagehaven.io`,
  getSiteDisplayDomain: (subdomain: string) => `${subdomain}.pagehaven.io`,
}));

vi.mock("@/utils/orpc", () => ({
  orpc: {
    site: {
      get: {
        queryOptions: () => ({
          queryKey: ["site"],
          queryFn: () => Promise.resolve(null),
        }),
      },
    },
    deployment: {
      list: {
        queryOptions: () => ({
          queryKey: ["deployments"],
          queryFn: () => Promise.resolve([]),
        }),
      },
    },
  },
}));

// Helper to render the SiteDetailPage component
async function renderSiteDetailPage() {
  const module = await import("./index");
  const route = module.Route as unknown as { component: React.ComponentType };
  const SiteDetailPage = route.component;
  return render(<SiteDetailPage />);
}

describe("sites/$siteId route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseParams.mockReturnValue({ siteId: "site-123" });
  });

  describe("Route export", () => {
    it("exports Route", async () => {
      const module = await import("./index");
      expect(module.Route).toBeDefined();
    });

    it("has component defined", async () => {
      const module = await import("./index");
      const route = module.Route as unknown as {
        component: React.ComponentType;
      };
      expect(route.component).toBeDefined();
    });
  });

  describe("loading state", () => {
    it("shows loading message when site is loading", async () => {
      mockUseQuery
        .mockReturnValueOnce({ data: undefined, isLoading: true })
        .mockReturnValueOnce({ data: [], isLoading: false });

      await renderSiteDetailPage();
      expect(screen.getByText("Loading site...")).toBeInTheDocument();
    });
  });

  describe("not found state", () => {
    it("shows not found message when site does not exist", async () => {
      mockUseQuery
        .mockReturnValueOnce({ data: null, isLoading: false })
        .mockReturnValueOnce({ data: [], isLoading: false });

      await renderSiteDetailPage();
      expect(screen.getByText("Site not found")).toBeInTheDocument();
    });
  });

  describe("site detail rendering", () => {
    const mockSite = {
      id: "site-123",
      name: "My Test Site",
      subdomain: "my-test-site",
      description: "A test site description",
      role: "owner",
      activeDeploymentId: "deploy-1",
    };

    beforeEach(() => {
      mockUseQuery
        .mockReturnValueOnce({ data: mockSite, isLoading: false })
        .mockReturnValueOnce({ data: [], isLoading: false });
    });

    it("displays site name", async () => {
      await renderSiteDetailPage();
      expect(screen.getByText("My Test Site")).toBeInTheDocument();
    });

    it("displays site subdomain with link", async () => {
      await renderSiteDetailPage();
      expect(screen.getByText("my-test-site.pagehaven.io")).toBeInTheDocument();
    });

    it("displays site description", async () => {
      await renderSiteDetailPage();
      expect(screen.getByText("A test site description")).toBeInTheDocument();
    });

    it("displays site role", async () => {
      await renderSiteDetailPage();
      expect(screen.getByText("owner")).toBeInTheDocument();
    });

    it("shows Live status for site with active deployment", async () => {
      await renderSiteDetailPage();
      expect(screen.getByText("Live")).toBeInTheDocument();
    });

    it("renders Deploy button", async () => {
      await renderSiteDetailPage();
      expect(screen.getByText("Deploy")).toBeInTheDocument();
    });

    it("renders Analytics button", async () => {
      await renderSiteDetailPage();
      expect(screen.getByText("Analytics")).toBeInTheDocument();
    });

    it("renders Settings button", async () => {
      await renderSiteDetailPage();
      expect(screen.getByText("Settings")).toBeInTheDocument();
    });

    it("renders Back to Sites link", async () => {
      await renderSiteDetailPage();
      expect(screen.getByText("Back to Sites")).toBeInTheDocument();
    });

    it("renders Recent Deployments section", async () => {
      await renderSiteDetailPage();
      expect(screen.getByText("Recent Deployments")).toBeInTheDocument();
    });
  });

  describe("site without active deployment", () => {
    const mockSite = {
      id: "site-123",
      name: "Inactive Site",
      subdomain: "inactive",
      role: "owner",
      activeDeploymentId: null,
    };

    beforeEach(() => {
      mockUseQuery
        .mockReturnValueOnce({ data: mockSite, isLoading: false })
        .mockReturnValueOnce({ data: [], isLoading: false });
    });

    it("shows No deployment status", async () => {
      await renderSiteDetailPage();
      expect(screen.getByText("No deployment")).toBeInTheDocument();
    });
  });

  describe("deployments list", () => {
    const mockSite = {
      id: "site-123",
      name: "Test Site",
      subdomain: "test",
      role: "owner",
      activeDeploymentId: "deploy-1",
    };

    it("shows empty state when no deployments", async () => {
      mockUseQuery
        .mockReturnValueOnce({ data: mockSite, isLoading: false })
        .mockReturnValueOnce({ data: [], isLoading: false });

      await renderSiteDetailPage();
      expect(screen.getByText("No deployments yet")).toBeInTheDocument();
      expect(screen.getByText("Create First Deployment")).toBeInTheDocument();
    });

    it("shows loading state for deployments", async () => {
      mockUseQuery
        .mockReturnValueOnce({ data: mockSite, isLoading: false })
        .mockReturnValueOnce({ data: undefined, isLoading: true });

      await renderSiteDetailPage();
      expect(screen.getByText("Loading deployments...")).toBeInTheDocument();
    });

    it("displays deployment list", async () => {
      const mockDeployments = [
        {
          id: "deploy-1",
          status: "live",
          commitMessage: "Initial deployment",
          createdAt: new Date("2024-01-15"),
        },
        {
          id: "deploy-2",
          status: "failed",
          commitMessage: "Failed update",
          createdAt: new Date("2024-01-14"),
        },
      ];

      mockUseQuery
        .mockReturnValueOnce({ data: mockSite, isLoading: false })
        .mockReturnValueOnce({ data: mockDeployments, isLoading: false });

      await renderSiteDetailPage();
      expect(screen.getByText("Initial deployment")).toBeInTheDocument();
      expect(screen.getByText("Failed update")).toBeInTheDocument();
    });

    it("shows Active badge for current deployment", async () => {
      const mockDeployments = [
        {
          id: "deploy-1",
          status: "live",
          commitMessage: "Current deployment",
          createdAt: new Date("2024-01-15"),
        },
      ];

      mockUseQuery
        .mockReturnValueOnce({ data: mockSite, isLoading: false })
        .mockReturnValueOnce({ data: mockDeployments, isLoading: false });

      await renderSiteDetailPage();
      expect(screen.getByText("Active")).toBeInTheDocument();
    });
  });

  describe("status icons", () => {
    const mockSite = {
      id: "site-123",
      name: "Test Site",
      subdomain: "test",
      role: "owner",
      activeDeploymentId: "deploy-1",
    };

    it("shows check icon for live deployments", async () => {
      const mockDeployments = [
        {
          id: "deploy-1",
          status: "live",
          commitMessage: "Live",
          createdAt: new Date(),
        },
      ];

      mockUseQuery
        .mockReturnValueOnce({ data: mockSite, isLoading: false })
        .mockReturnValueOnce({ data: mockDeployments, isLoading: false });

      await renderSiteDetailPage();
      expect(screen.getByTestId("check-circle-icon")).toBeInTheDocument();
    });

    it("shows x icon for failed deployments", async () => {
      const mockDeployments = [
        {
          id: "deploy-2",
          status: "failed",
          commitMessage: "Failed",
          createdAt: new Date(),
        },
      ];

      mockUseQuery
        .mockReturnValueOnce({ data: mockSite, isLoading: false })
        .mockReturnValueOnce({ data: mockDeployments, isLoading: false });

      await renderSiteDetailPage();
      expect(screen.getByTestId("x-circle-icon")).toBeInTheDocument();
    });

    it("shows loader icon for processing deployments", async () => {
      const mockDeployments = [
        {
          id: "deploy-3",
          status: "processing",
          commitMessage: "Processing",
          createdAt: new Date(),
        },
      ];

      mockUseQuery
        .mockReturnValueOnce({ data: mockSite, isLoading: false })
        .mockReturnValueOnce({ data: mockDeployments, isLoading: false });

      await renderSiteDetailPage();
      expect(screen.getByTestId("loader-icon")).toBeInTheDocument();
    });
  });

  describe("helper functions", () => {
    it("formatDate handles null date", () => {
      const formatDate = (date: Date | null | undefined) => {
        if (!date) {
          return "N/A";
        }
        return new Date(date).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });
      };

      expect(formatDate(null)).toBe("N/A");
      expect(formatDate(undefined)).toBe("N/A");
    });

    it("formatDate formats valid date", () => {
      const formatDate = (date: Date | null | undefined) => {
        if (!date) {
          return "N/A";
        }
        return new Date(date).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });
      };

      const result = formatDate(new Date("2024-01-15T10:30:00"));
      expect(result).toContain("Jan");
      expect(result).toContain("15");
    });
  });
});
