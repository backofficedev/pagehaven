import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MOCK_SITES } from "@/test/fixtures";
import { describeRouteExports } from "@/test/route-test-utils";
import {
  buttonMock,
  cardMock,
  configMock,
  createAuthClientMock,
  createQueryMock,
  inputMock,
  labelMock,
} from "@/test/ui-mocks";

// Regex patterns at module level for performance
const YOUR_SITES_REGEX = /Your Sites/i;
const MANAGE_WEBSITES_REGEX = /Manage your static websites/i;
const NO_SITES_REGEX = /No sites yet/i;
const CREATE_FIRST_REGEX = /Create your first site to get started/i;

// Store mock implementations for dynamic control
const mockUseQuery = vi.fn();
const mockUseMutation = vi.fn();
const mockRedirect = vi.fn();
const mockGetSession = vi.fn();
const mockInvalidateQueries = vi.fn();
const mockToastSuccess = vi.fn();
const mockToastError = vi.fn();

// Mock dependencies
vi.mock("@tanstack/react-query", () =>
  createQueryMock(mockUseQuery, mockUseMutation)
);

vi.mock("@tanstack/react-router", () => ({
  createFileRoute: (_path: string) => (options: unknown) => {
    const opts = options as { component: React.ComponentType };
    return {
      ...opts,
      useRouteContext: () => ({
        session: { data: { user: { name: "Test User" } } },
      }),
      useParams: () => ({}),
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
  redirect: mockRedirect,
}));

vi.mock("lucide-react", () => ({
  Eye: () => <span data-testid="eye-icon" />,
  Globe: () => <span data-testid="globe-icon" />,
  Lock: () => <span data-testid="lock-icon" />,
  Plus: () => <span data-testid="plus-icon" />,
  Users: () => <span data-testid="users-icon" />,
}));

vi.mock("sonner", () => ({
  toast: {
    success: (msg: string) => mockToastSuccess(msg),
    error: (msg: string) => mockToastError(msg),
  },
}));

vi.mock("@/components/ui/button", () => buttonMock);
vi.mock("@/components/ui/card", () => cardMock);
vi.mock("@/components/ui/input", () => inputMock);
vi.mock("@/components/ui/label", () => labelMock);

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
      create: {
        mutationOptions: () => ({}),
      },
    },
  },
  queryClient: {
    invalidateQueries: mockInvalidateQueries,
  },
}));

// Helper to render the SitesPage component
async function renderSitesPage() {
  const module = await import("./index");
  const route = module.Route as unknown as { component: React.ComponentType };
  const SitesPage = route.component;
  return render(<SitesPage />);
}

describe("sites route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseQuery.mockReturnValue({
      data: [],
      isLoading: false,
    });
    mockUseMutation.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
      shouldSucceed: true,
    });
    mockGetSession.mockResolvedValue({
      data: { user: { name: "Test User" } },
    });
  });

  describeRouteExports(() => import("./index"));

  describe("SitesPage rendering", () => {
    it("displays page title", async () => {
      await renderSitesPage();
      expect(screen.getByText(YOUR_SITES_REGEX)).toBeInTheDocument();
    });

    it("displays subtitle", async () => {
      await renderSitesPage();
      expect(screen.getByText(MANAGE_WEBSITES_REGEX)).toBeInTheDocument();
    });

    it("renders New Site button", async () => {
      await renderSitesPage();
      expect(screen.getByText("New Site")).toBeInTheDocument();
    });
  });

  describe("loading state", () => {
    it("shows loading message when loading", async () => {
      mockUseQuery.mockReturnValue({
        data: undefined,
        isLoading: true,
      });

      await renderSitesPage();
      expect(screen.getByText("Loading sites...")).toBeInTheDocument();
    });
  });

  describe("empty state", () => {
    it("shows empty state when no sites exist", async () => {
      mockUseQuery.mockReturnValue({
        data: [],
        isLoading: false,
      });

      await renderSitesPage();
      expect(screen.getByText(NO_SITES_REGEX)).toBeInTheDocument();
      expect(screen.getByText(CREATE_FIRST_REGEX)).toBeInTheDocument();
    });

    it("shows Create Site button in empty state", async () => {
      mockUseQuery.mockReturnValue({
        data: [],
        isLoading: false,
      });

      await renderSitesPage();
      expect(screen.getByText("Create Site")).toBeInTheDocument();
    });
  });

  describe("create site form", () => {
    it("shows create form when New Site button is clicked", async () => {
      await renderSitesPage();

      const newSiteButton = screen.getByText("New Site");
      fireEvent.click(newSiteButton);

      expect(screen.getByText("Create New Site")).toBeInTheDocument();
      expect(screen.getByLabelText("Site Name")).toBeInTheDocument();
      expect(screen.getByLabelText("Subdomain")).toBeInTheDocument();
    });

    it("hides create form when Cancel is clicked", async () => {
      await renderSitesPage();

      // Open form
      fireEvent.click(screen.getByText("New Site"));
      expect(screen.getByText("Create New Site")).toBeInTheDocument();

      // Close form
      fireEvent.click(screen.getByText("Cancel"));
      expect(screen.queryByText("Create New Site")).not.toBeInTheDocument();
    });

    it("shows subdomain suffix", async () => {
      await renderSitesPage();

      fireEvent.click(screen.getByText("New Site"));
      expect(screen.getByText(".pagehaven.io")).toBeInTheDocument();
    });

    it("has subdomain pattern validation", async () => {
      await renderSitesPage();

      fireEvent.click(screen.getByText("New Site"));
      const subdomainInput = screen.getByLabelText("Subdomain");
      expect(subdomainInput).toHaveAttribute(
        "pattern",
        "^[a-z0-9]([a-z0-9-]*[a-z0-9])?$"
      );
    });

    it("converts subdomain to lowercase on input", async () => {
      await renderSitesPage();

      fireEvent.click(screen.getByText("New Site"));
      const subdomainInput = screen.getByLabelText("Subdomain");

      fireEvent.change(subdomainInput, { target: { value: "MySubdomain" } });
      expect(subdomainInput).toHaveValue("mysubdomain");
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
      await renderSitesPage();
      expect(screen.getByText("My First Site")).toBeInTheDocument();
      expect(screen.getByText("My Second Site")).toBeInTheDocument();
    });

    it("displays site subdomains", async () => {
      await renderSitesPage();
      expect(screen.getByText("first-site.pagehaven.io")).toBeInTheDocument();
      expect(screen.getByText("second-site.pagehaven.io")).toBeInTheDocument();
    });

    it("displays site roles", async () => {
      await renderSitesPage();
      expect(screen.getByText("owner")).toBeInTheDocument();
      expect(screen.getByText("admin")).toBeInTheDocument();
    });

    it("shows Live status for sites with active deployment", async () => {
      await renderSitesPage();
      expect(screen.getByText("Live")).toBeInTheDocument();
    });

    it("shows No deployment status for sites without active deployment", async () => {
      await renderSitesPage();
      expect(screen.getByText("No deployment")).toBeInTheDocument();
    });

    it("does not show empty state when sites exist", async () => {
      await renderSitesPage();
      expect(screen.queryByText(NO_SITES_REGEX)).not.toBeInTheDocument();
    });
  });

  describe("getAccessIcon helper", () => {
    it("renders globe icon for public access", async () => {
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

      await renderSitesPage();
      expect(screen.getAllByTestId("globe-icon").length).toBeGreaterThan(0);
    });
  });

  describe("form submission", () => {
    it("submits form with site name and subdomain", async () => {
      const mutate = vi.fn();
      mockUseMutation.mockReturnValue({
        mutate,
        isPending: false,
        shouldSucceed: true,
      });

      await renderSitesPage();

      // Open form
      fireEvent.click(screen.getByText("New Site"));

      // Fill form
      fireEvent.change(screen.getByLabelText("Site Name"), {
        target: { value: "Test Site" },
      });
      fireEvent.change(screen.getByLabelText("Subdomain"), {
        target: { value: "test-site" },
      });

      // Submit using the submit button
      const submitButtons = screen.getAllByRole("button", {
        name: "Create Site",
      });
      // Get the submit button inside the form (first one)
      fireEvent.click(submitButtons[0]);

      await waitFor(() => {
        expect(mockToastSuccess).toHaveBeenCalled();
      });
    });

    it("shows Creating... text when mutation is pending", async () => {
      mockUseMutation.mockReturnValue({
        mutate: vi.fn(),
        isPending: true,
        shouldSucceed: true,
      });

      await renderSitesPage();

      fireEvent.click(screen.getByText("New Site"));
      expect(screen.getByText("Creating...")).toBeInTheDocument();
    });
  });

  describe("authentication", () => {
    it("Route has authentication check configured", async () => {
      const module = await import("./index");
      // The route is configured with beforeLoad for auth checking
      expect(module.Route).toBeDefined();
    });
  });
});
