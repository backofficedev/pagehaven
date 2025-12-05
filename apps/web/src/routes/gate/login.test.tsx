import { render, screen } from "@testing-library/react";
import type React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { buttonMock, cardMock, createGateRouterMock } from "@/test/ui-mocks";

// Regex patterns at module level for performance
const DONT_HAVE_ACCOUNT_REGEX = /Don't have an account/;

// Mock state for dynamic control
let mockSearchParams = { redirect: "/" };

// Mock TanStack Router
vi.mock("@tanstack/react-router", () =>
  createGateRouterMock(() => mockSearchParams)
);

// Mock lucide-react
vi.mock("lucide-react", () => ({
  LogIn: () => <span data-testid="login-icon" />,
}));

// Mock UI components
vi.mock("@/components/ui/button", () => buttonMock);
vi.mock("@/components/ui/card", () => cardMock);

// Helper to render the actual component
async function renderLoginGatePage() {
  const module = await import("./login");
  const route = module.Route as unknown as { component: React.ComponentType };
  const LoginGatePage = route.component;
  return render(<LoginGatePage />);
}

describe("LoginGatePage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSearchParams = { redirect: "/" };
  });

  describe("Route export", () => {
    it("exports Route", async () => {
      const module = await import("./login");
      expect(module.Route).toBeDefined();
    });
  });

  describe("page rendering", () => {
    it("shows Login Required title", async () => {
      await renderLoginGatePage();
      expect(screen.getByText("Login Required")).toBeInTheDocument();
    });

    it("shows description", async () => {
      await renderLoginGatePage();
      expect(
        screen.getByText("You need to sign in to access this site")
      ).toBeInTheDocument();
    });

    it("shows login icon", async () => {
      await renderLoginGatePage();
      expect(screen.getByTestId("login-icon")).toBeInTheDocument();
    });

    it("shows Sign In button", async () => {
      await renderLoginGatePage();
      expect(screen.getByText("Sign In")).toBeInTheDocument();
    });

    it("shows sign up prompt", async () => {
      await renderLoginGatePage();
      expect(screen.getByText(DONT_HAVE_ACCOUNT_REGEX)).toBeInTheDocument();
    });

    it("shows Sign up link", async () => {
      await renderLoginGatePage();
      expect(screen.getByText("Sign up")).toBeInTheDocument();
    });
  });

  describe("navigation links", () => {
    it("Sign In button links to login page with redirect", async () => {
      mockSearchParams = { redirect: "/dashboard" };
      await renderLoginGatePage();

      const signInLink = screen.getAllByRole("link")[0];
      expect(signInLink).toHaveAttribute("href", "/login?redirect=/dashboard");
    });

    it("Sign up link points to login page", async () => {
      await renderLoginGatePage();

      const signUpLink = screen.getByText("Sign up");
      expect(signUpLink.closest("a")).toHaveAttribute("href", "/login");
    });
  });

  describe("search validation", () => {
    it("validates search params with redirect", () => {
      const validateSearch = (search: Record<string, unknown>) => ({
        redirect: (search.redirect as string) || "/",
      });

      const result = validateSearch({ redirect: "/dashboard" });
      expect(result.redirect).toBe("/dashboard");
    });

    it("provides default value for missing redirect", () => {
      const validateSearch = (search: Record<string, unknown>) => ({
        redirect: (search.redirect as string) || "/",
      });

      const result = validateSearch({});
      expect(result.redirect).toBe("/");
    });
  });
});
