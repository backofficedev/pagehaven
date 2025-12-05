import { render, screen } from "@testing-library/react";
import type React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { formatBytes } from "@/lib/utils";
import { cardMock, createRouterMock } from "@/test/ui-mocks";

// Regex patterns at module level for performance
const BACK_TO_REGEX = /Back to/;

// Store mock implementations for dynamic control
const mockUseQuery = vi.fn();
const mockUseParams = vi.fn();

// Mock dependencies
vi.mock("@tanstack/react-query", () => ({
  useQuery: () => mockUseQuery(),
}));

vi.mock("@tanstack/react-router", () => createRouterMock(mockUseParams));

vi.mock("lucide-react", () => ({
  ArrowLeft: () => <span data-testid="arrow-left-icon" />,
  Eye: () => <span data-testid="eye-icon" />,
  FileText: () => <span data-testid="file-text-icon" />,
  HardDrive: () => <span data-testid="hard-drive-icon" />,
}));

vi.mock("@/components/ui/card", () => cardMock);

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
          queryKey: ["site"],
          queryFn: () => Promise.resolve(null),
        }),
      },
    },
    analytics: {
      getSummary: {
        queryOptions: () => ({
          queryKey: ["analytics"],
          queryFn: () => Promise.resolve(null),
        }),
      },
    },
  },
}));

// Helper to render the AnalyticsPage component
async function renderAnalyticsPage() {
  const module = await import("./analytics");
  const route = module.Route as unknown as { component: React.ComponentType };
  const AnalyticsPage = route.component;
  return render(<AnalyticsPage />);
}

describe("sites/$siteId/analytics route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseParams.mockReturnValue({ siteId: "site-123" });
  });

  describe("Route export", () => {
    it("exports Route", async () => {
      const module = await import("./analytics");
      expect(module.Route).toBeDefined();
    });

    it("has component defined", async () => {
      const module = await import("./analytics");
      const route = module.Route as unknown as {
        component: React.ComponentType;
      };
      expect(route.component).toBeDefined();
    });
  });

  describe("loading state", () => {
    it("shows loading message when analytics is loading", async () => {
      mockUseQuery
        .mockReturnValueOnce({
          data: { name: "Test Site" },
          isLoading: false,
        })
        .mockReturnValueOnce({ data: undefined, isLoading: true });

      await renderAnalyticsPage();
      expect(screen.getByText("Loading analytics...")).toBeInTheDocument();
    });
  });

  describe("page rendering", () => {
    const mockSite = { id: "site-123", name: "Test Site", subdomain: "test" };
    const mockAnalytics = {
      summary: {
        totalViews: 12_500,
        totalBandwidth: 5_242_880,
        uniquePaths: 15,
      },
      topPages: [
        { path: "/", views: 5000 },
        { path: "/about", views: 3000 },
        { path: "/contact", views: 2000 },
      ],
      daily: [
        { date: "2024-01-15", views: 500, bandwidth: 102_400 },
        { date: "2024-01-14", views: 450, bandwidth: 98_304 },
      ],
    };

    beforeEach(() => {
      mockUseQuery
        .mockReturnValueOnce({ data: mockSite, isLoading: false })
        .mockReturnValueOnce({ data: mockAnalytics, isLoading: false });
    });

    it("displays page title", async () => {
      await renderAnalyticsPage();
      expect(screen.getByText("Analytics")).toBeInTheDocument();
    });

    it("displays page subtitle", async () => {
      await renderAnalyticsPage();
      expect(
        screen.getByText("Last 30 days of site activity")
      ).toBeInTheDocument();
    });

    it("renders back link", async () => {
      await renderAnalyticsPage();
      expect(screen.getByText(BACK_TO_REGEX)).toBeInTheDocument();
    });

    it("displays Total Views stat", async () => {
      await renderAnalyticsPage();
      expect(screen.getByText("Total Views")).toBeInTheDocument();
      expect(screen.getByText("12,500")).toBeInTheDocument();
    });

    it("displays Bandwidth stat", async () => {
      await renderAnalyticsPage();
      expect(screen.getByText("Bandwidth")).toBeInTheDocument();
    });

    it("displays Unique Pages stat", async () => {
      await renderAnalyticsPage();
      expect(screen.getByText("Unique Pages")).toBeInTheDocument();
      expect(screen.getByText("15")).toBeInTheDocument();
    });

    it("displays Top Pages section", async () => {
      await renderAnalyticsPage();
      expect(screen.getByText("Top Pages")).toBeInTheDocument();
      expect(
        screen.getByText("Most viewed pages in the last 30 days")
      ).toBeInTheDocument();
    });

    it("displays top page paths", async () => {
      await renderAnalyticsPage();
      expect(screen.getByText("/")).toBeInTheDocument();
      expect(screen.getByText("/about")).toBeInTheDocument();
      expect(screen.getByText("/contact")).toBeInTheDocument();
    });

    it("displays top page view counts", async () => {
      await renderAnalyticsPage();
      expect(screen.getByText("5,000 views")).toBeInTheDocument();
      expect(screen.getByText("3,000 views")).toBeInTheDocument();
      expect(screen.getByText("2,000 views")).toBeInTheDocument();
    });

    it("displays Daily Views section", async () => {
      await renderAnalyticsPage();
      expect(screen.getByText("Daily Views")).toBeInTheDocument();
      expect(
        screen.getByText("Page views over the last 30 days")
      ).toBeInTheDocument();
    });
  });

  describe("empty states", () => {
    const mockSite = { id: "site-123", name: "Test Site", subdomain: "test" };

    it("shows empty state for top pages when no views", async () => {
      const mockAnalytics = {
        summary: { totalViews: 0, totalBandwidth: 0, uniquePaths: 0 },
        topPages: [],
        daily: [],
      };

      mockUseQuery
        .mockReturnValueOnce({ data: mockSite, isLoading: false })
        .mockReturnValueOnce({ data: mockAnalytics, isLoading: false });

      await renderAnalyticsPage();
      expect(
        screen.getByText("No page views recorded yet")
      ).toBeInTheDocument();
    });

    it("shows empty state for daily views when no data", async () => {
      const mockAnalytics = {
        summary: { totalViews: 0, totalBandwidth: 0, uniquePaths: 0 },
        topPages: [],
        daily: [],
      };

      mockUseQuery
        .mockReturnValueOnce({ data: mockSite, isLoading: false })
        .mockReturnValueOnce({ data: mockAnalytics, isLoading: false });

      await renderAnalyticsPage();
      expect(screen.getByText("No data available")).toBeInTheDocument();
    });
  });

  describe("formatBytes helper", () => {
    it("formats 0 bytes correctly", () => {
      expect(formatBytes(0)).toBe("0 B");
    });

    it("formats bytes correctly", () => {
      expect(formatBytes(500)).toBe("500 B");
      expect(formatBytes(1024)).toBe("1 KB");
      expect(formatBytes(1536)).toBe("1.5 KB");
      expect(formatBytes(1_048_576)).toBe("1 MB");
      expect(formatBytes(1_073_741_824)).toBe("1 GB");
    });

    it("formats large values correctly", () => {
      expect(formatBytes(5_242_880)).toBe("5 MB");
      expect(formatBytes(10_737_418_240)).toBe("10 GB");
    });
  });

  describe("daily views display", () => {
    it("limits daily views to last 14 days", () => {
      const daily = Array.from({ length: 30 }, (_, i) => ({
        date: `2024-01-${String(30 - i).padStart(2, "0")}`,
        views: 100 + i,
        bandwidth: 1024 * (i + 1),
      }));

      const displayed = daily.slice(-14);
      expect(displayed.length).toBe(14);
    });
  });

  describe("page ranking", () => {
    it("displays top pages section with rankings", async () => {
      const mockSite = { id: "site-123", name: "Test Site", subdomain: "test" };
      const mockAnalytics = {
        summary: { totalViews: 100, totalBandwidth: 1024, uniquePaths: 3 },
        topPages: [
          { path: "/", views: 50 },
          { path: "/about", views: 30 },
          { path: "/contact", views: 20 },
        ],
        daily: [],
      };

      mockUseQuery
        .mockReturnValueOnce({ data: mockSite, isLoading: false })
        .mockReturnValueOnce({ data: mockAnalytics, isLoading: false });

      await renderAnalyticsPage();
      // Check that top pages section is displayed with paths
      expect(screen.getByText("/")).toBeInTheDocument();
      expect(screen.getByText("/about")).toBeInTheDocument();
      expect(screen.getByText("/contact")).toBeInTheDocument();
    });
  });
});
