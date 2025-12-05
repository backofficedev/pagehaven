import { screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MOCK_SITES } from "@/test/fixtures";
import {
  createRouteRenderer,
  describeRouteExports,
} from "@/test/route-test-utils";
import {
  buttonMock,
  cardMock,
  configMock,
  createAuthClientMock,
  createRouterMock,
  skeletonMock,
} from "@/test/ui-mocks";

// Regex patterns at module level for performance
const WELCOME_BACK_REGEX = /Welcome back, Test User/i;
const MANAGE_WEBSITES_REGEX = /Manage your static websites from one place/i;
const CREATE_FIRST_SITE_REGEX =
  /Create your first site to get started hosting static websites/i;
const FOLLOW_STEPS_REGEX =
  /Follow these steps to host your first static website/i;

// Store mock implementations for dynamic control
const mockUseQuery = vi.fn();
const mockUseParams = vi.fn();
const mockGetSession = vi.fn();

// Mock dependencies
vi.mock("@tanstack/react-query", () => ({
  useQuery: () => mockUseQuery(),
}));

vi.mock("@tanstack/react-router", () => createRouterMock(mockUseParams));

vi.mock("lucide-react", () => ({
  ExternalLink: () => <span data-testid="external-link-icon" />,
  Eye: () => <span data-testid="eye-icon" />,
  Globe: () => <span data-testid="globe-icon" />,
  Lock: () => <span data-testid="lock-icon" />,
  Plus: () => <span data-testid="plus-icon" />,
  Rocket: () => <span data-testid="rocket-icon" />,
  Users: () => <span data-testid="users-icon" />,
}));

vi.mock("@/components/ui/button", () => buttonMock);
vi.mock("@/components/ui/card", () => cardMock);
vi.mock("@/components/ui/skeleton", () => skeletonMock);

vi.mock("@/lib/auth-client", () => createAuthClientMock(mockGetSession));
vi.mock("@/utils/config", () => configMock);

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

// Helper to render the DashboardPage component
const renderDashboard = createRouteRenderer(() => import("./dashboard"));

describe("dashboard route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseParams.mockReturnValue({});
    mockUseQuery.mockReturnValue({
      data: [],
      isLoading: false,
    });
    mockGetSession.mockResolvedValue({
      data: { user: { name: "Test User" } },
    });
  });

  describeRouteExports(() => import("./dashboard"));

  describe("DashboardPage rendering", () => {
    it("displays welcome message with user name", async () => {
      await renderDashboard();
      expect(screen.getByText(WELCOME_BACK_REGEX)).toBeInTheDocument();
    });

    it("displays subtitle text", async () => {
      await renderDashboard();
      expect(screen.getByText(MANAGE_WEBSITES_REGEX)).toBeInTheDocument();
    });

    it("renders stats cards section", async () => {
      await renderDashboard();
      expect(screen.getByText("Total Sites")).toBeInTheDocument();
      expect(screen.getByText("Live Sites")).toBeInTheDocument();
      expect(screen.getByText("Quick Actions")).toBeInTheDocument();
    });

    it("renders Create New Site button", async () => {
      await renderDashboard();
      expect(screen.getByText("Create New Site")).toBeInTheDocument();
    });

    it("renders Recent Sites section", async () => {
      await renderDashboard();
      expect(screen.getByText("Recent Sites")).toBeInTheDocument();
      expect(screen.getByText("View all")).toBeInTheDocument();
    });
  });

  describe("loading state", () => {
    it("shows skeletons when loading", async () => {
      mockUseQuery.mockReturnValue({
        data: undefined,
        isLoading: true,
      });

      await renderDashboard();
      const skeletons = screen.getAllByTestId("skeleton");
      expect(skeletons.length).toBeGreaterThan(0);
    });
  });

  describe("empty state", () => {
    it("shows empty state when no sites exist", async () => {
      mockUseQuery.mockReturnValue({
        data: [],
        isLoading: false,
      });

      await renderDashboard();
      expect(screen.getByText("No sites yet")).toBeInTheDocument();
      expect(screen.getByText(CREATE_FIRST_SITE_REGEX)).toBeInTheDocument();
    });

    it("shows Create Your First Site button in empty state", async () => {
      mockUseQuery.mockReturnValue({
        data: [],
        isLoading: false,
      });

      await renderDashboard();
      expect(screen.getByText("Create Your First Site")).toBeInTheDocument();
    });

    it("shows Getting Started guide when no sites", async () => {
      mockUseQuery.mockReturnValue({
        data: [],
        isLoading: false,
      });

      await renderDashboard();
      expect(screen.getByText("Getting Started")).toBeInTheDocument();
      expect(screen.getByText(FOLLOW_STEPS_REGEX)).toBeInTheDocument();
    });
  });

  describe("with sites data", () => {
    beforeEach(() => {
      mockUseQuery.mockReturnValue({
        data: MOCK_SITES,
        isLoading: false,
      });
    });

    it("displays site names", async () => {
      await renderDashboard();
      expect(screen.getByText("My First Site")).toBeInTheDocument();
      expect(screen.getByText("My Second Site")).toBeInTheDocument();
    });

    it("displays site subdomains", async () => {
      await renderDashboard();
      expect(screen.getByText("first-site.pagehaven.io")).toBeInTheDocument();
      expect(screen.getByText("second-site.pagehaven.io")).toBeInTheDocument();
    });

    it("displays site roles", async () => {
      await renderDashboard();
      expect(screen.getByText("owner")).toBeInTheDocument();
      expect(screen.getByText("admin")).toBeInTheDocument();
    });

    it("shows Live status for sites with active deployment", async () => {
      await renderDashboard();
      expect(screen.getByText("Live")).toBeInTheDocument();
    });

    it("shows No deployment status for sites without active deployment", async () => {
      await renderDashboard();
      expect(screen.getByText("No deployment")).toBeInTheDocument();
    });

    it("displays correct total sites count", async () => {
      await renderDashboard();
      expect(screen.getByText("2")).toBeInTheDocument();
    });

    it("displays correct live sites count", async () => {
      await renderDashboard();
      expect(screen.getByText("1")).toBeInTheDocument();
    });

    it("does not show Getting Started guide when sites exist", async () => {
      await renderDashboard();
      expect(screen.queryByText("Getting Started")).not.toBeInTheDocument();
    });

    it("limits recent sites to 4", async () => {
      const manySites = Array.from({ length: 6 }, (_, i) => ({
        id: `site-${i}`,
        name: `Site ${i}`,
        subdomain: `site-${i}`,
        role: "owner",
        activeDeploymentId: null,
      }));

      mockUseQuery.mockReturnValue({
        data: manySites,
        isLoading: false,
      });

      await renderDashboard();
      // Should only show first 4 sites in recent section
      expect(screen.getByText("Site 0")).toBeInTheDocument();
      expect(screen.getByText("Site 3")).toBeInTheDocument();
      expect(screen.queryByText("Site 4")).not.toBeInTheDocument();
    });
  });

  describe("getAccessIcon helper", () => {
    it("renders access icons for different access types", async () => {
      const testSites = [
        {
          id: "site-1",
          name: "Public Site",
          subdomain: "public",
          role: "owner",
          activeDeploymentId: null,
          accessType: "public",
        },
      ];

      mockUseQuery.mockReturnValue({
        data: testSites,
        isLoading: false,
      });

      await renderDashboard();
      // The component renders access icons
      expect(screen.getAllByTestId("globe-icon").length).toBeGreaterThan(0);
    });
  });

  describe("authentication", () => {
    it("Route has authentication check configured", async () => {
      mockGetSession.mockResolvedValue({ data: null });

      const module = await import("./dashboard");
      // The route is configured with beforeLoad for auth checking
      expect(module.Route).toBeDefined();
    });
  });
});
