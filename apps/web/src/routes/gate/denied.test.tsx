import { render, screen } from "@testing-library/react";
import type React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { buttonMock, cardMock, createGateRouterMock } from "@/test/ui-mocks";

// Mock state for dynamic control
let mockSearchParams = { reason: "unknown", redirect: "/" };
const mockUseSearch = () => mockSearchParams;

// Mock TanStack Router
vi.mock("@tanstack/react-router", () => createGateRouterMock(mockUseSearch));

// Mock lucide-react
vi.mock("lucide-react", () => ({
  Home: () => <span data-testid="home-icon" />,
  ShieldX: () => <span data-testid="shield-x-icon" />,
  UserX: () => <span data-testid="user-x-icon" />,
}));

// Mock UI components
vi.mock("@/components/ui/button", () => buttonMock);
vi.mock("@/components/ui/card", () => cardMock);

// Helper to render the actual component
async function renderDeniedGatePage() {
  const module = await import("./denied");
  const route = module.Route as unknown as { component: React.ComponentType };
  const DeniedGatePage = route.component;
  return render(<DeniedGatePage />);
}

describe("DeniedGatePage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSearchParams = { reason: "unknown", redirect: "/" };
  });

  describe("Route export", () => {
    it("exports Route", async () => {
      const module = await import("./denied");
      expect(module.Route).toBeDefined();
    });
  });

  describe("reason: unknown (default)", () => {
    beforeEach(() => {
      mockSearchParams = { reason: "unknown", redirect: "/" };
    });

    it("shows Access Denied title", async () => {
      await renderDeniedGatePage();
      expect(screen.getByText("Access Denied")).toBeInTheDocument();
    });

    it("shows generic description", async () => {
      await renderDeniedGatePage();
      expect(
        screen.getByText("You do not have permission to access this site.")
      ).toBeInTheDocument();
    });

    it("shows ShieldX icon", async () => {
      await renderDeniedGatePage();
      expect(screen.getByTestId("shield-x-icon")).toBeInTheDocument();
    });
  });

  describe("reason: not_member", () => {
    beforeEach(() => {
      mockSearchParams = { reason: "not_member", redirect: "/" };
    });

    it("shows Not a Member title", async () => {
      await renderDeniedGatePage();
      expect(screen.getByText("Not a Member")).toBeInTheDocument();
    });

    it("shows member-specific description", async () => {
      await renderDeniedGatePage();
      expect(
        screen.getByText(
          "You are not a member of this site. Only team members can access this content."
        )
      ).toBeInTheDocument();
    });

    it("shows UserX icon", async () => {
      await renderDeniedGatePage();
      expect(screen.getByTestId("user-x-icon")).toBeInTheDocument();
    });
  });

  describe("reason: not_invited", () => {
    beforeEach(() => {
      mockSearchParams = { reason: "not_invited", redirect: "/" };
    });

    it("shows Not Invited title", async () => {
      await renderDeniedGatePage();
      expect(screen.getByText("Not Invited")).toBeInTheDocument();
    });

    it("shows invite-specific description", async () => {
      await renderDeniedGatePage();
      expect(
        screen.getByText(
          "You have not been invited to view this site. Contact the site owner to request access."
        )
      ).toBeInTheDocument();
    });

    it("shows ShieldX icon for not_invited", async () => {
      await renderDeniedGatePage();
      expect(screen.getByTestId("shield-x-icon")).toBeInTheDocument();
    });
  });

  describe("navigation", () => {
    it("has link to homepage", async () => {
      await renderDeniedGatePage();
      const link = screen.getByRole("link");
      expect(link).toHaveAttribute("href", "/");
    });

    it("shows Go to Homepage button", async () => {
      await renderDeniedGatePage();
      expect(screen.getByText("Go to Homepage")).toBeInTheDocument();
    });

    it("shows Home icon in button", async () => {
      await renderDeniedGatePage();
      expect(screen.getByTestId("home-icon")).toBeInTheDocument();
    });
  });

  describe("help text", () => {
    it("shows contact administrator message", async () => {
      await renderDeniedGatePage();
      expect(
        screen.getByText((content) =>
          content.includes("If you believe this is an error")
        )
      ).toBeInTheDocument();
    });
  });

  describe("search validation", () => {
    /** Helper to validate search params */
    const validateSearch = (search: Record<string, unknown>) => ({
      reason: (search.reason as string) || "unknown",
      redirect: (search.redirect as string) || "/",
    });

    it("validates search params with reason and redirect", () => {
      const result = validateSearch({
        reason: "not_member",
        redirect: "/dashboard",
      });
      expect(result.reason).toBe("not_member");
      expect(result.redirect).toBe("/dashboard");
    });

    it("provides default values for missing search params", () => {
      const result = validateSearch({});
      expect(result.reason).toBe("unknown");
      expect(result.redirect).toBe("/");
    });
  });
});
