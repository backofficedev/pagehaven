import { render, screen } from "@testing-library/react";
import { ThemeProvider } from "next-themes";
import { describe, expect, it, vi } from "vitest";

// Mock TanStack Router
vi.mock("@tanstack/react-router", () => ({
  Link: ({
    children,
    to,
    ...props
  }: {
    children: React.ReactNode;
    to: string;
  }) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
  useNavigate: vi.fn(() => vi.fn()),
  useRouter: vi.fn(() => ({
    navigate: vi.fn(),
  })),
}));

// Mock next-themes
vi.mock("next-themes", async () => {
  const actual = await vi.importActual("next-themes");
  return {
    ...actual,
    useTheme: vi.fn(() => ({
      theme: "light",
      setTheme: vi.fn(),
      themes: ["light", "dark", "system"],
    })),
  };
});

// Mock auth client
vi.mock("@/lib/auth-client", () => ({
  authClient: {
    useSession: vi.fn(() => ({
      data: null,
      isPending: false,
    })),
    signOut: vi.fn(),
  },
}));

// Import after mocks
import Header from "./header";

// Helper to render with providers
function renderWithProviders(ui: React.ReactElement) {
  return render(<ThemeProvider attribute="class">{ui}</ThemeProvider>);
}

describe("Header", () => {
  describe("smoke tests", () => {
    it("renders without crashing", () => {
      renderWithProviders(<Header />);
      expect(screen.getByRole("navigation")).toBeInTheDocument();
    });
  });

  describe("navigation links", () => {
    it("renders Home link", () => {
      renderWithProviders(<Header />);
      expect(screen.getByText("Home")).toBeInTheDocument();
    });

    it("renders Sites link", () => {
      renderWithProviders(<Header />);
      expect(screen.getByText("Sites")).toBeInTheDocument();
    });

    it("renders Dashboard link", () => {
      renderWithProviders(<Header />);
      expect(screen.getByText("Dashboard")).toBeInTheDocument();
    });

    it("Home link points to /", () => {
      renderWithProviders(<Header />);
      const homeLink = screen.getByText("Home");
      expect(homeLink).toHaveAttribute("href", "/");
    });

    it("Sites link points to /sites", () => {
      renderWithProviders(<Header />);
      const sitesLink = screen.getByText("Sites");
      expect(sitesLink).toHaveAttribute("href", "/sites");
    });

    it("Dashboard link points to /dashboard", () => {
      renderWithProviders(<Header />);
      const dashboardLink = screen.getByText("Dashboard");
      expect(dashboardLink).toHaveAttribute("href", "/dashboard");
    });
  });

  describe("structure", () => {
    it("renders nav element", () => {
      renderWithProviders(<Header />);
      expect(screen.getByRole("navigation")).toBeInTheDocument();
    });

    it("renders horizontal rule separator", () => {
      const { container } = renderWithProviders(<Header />);
      expect(container.querySelector("hr")).toBeInTheDocument();
    });

    it("renders ModeToggle component", () => {
      renderWithProviders(<Header />);
      // ModeToggle renders a button with "Toggle theme" sr-only text
      expect(screen.getByText("Toggle theme")).toBeInTheDocument();
    });
  });

  describe("styling", () => {
    it("has flex layout for main container", () => {
      const { container } = renderWithProviders(<Header />);
      const flexContainer = container.querySelector(".flex.flex-row");
      expect(flexContainer).toBeInTheDocument();
    });

    it("has gap between nav links", () => {
      renderWithProviders(<Header />);
      const nav = screen.getByRole("navigation");
      expect(nav).toHaveClass("gap-4");
    });
  });
});
