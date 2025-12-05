import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ThemeProvider } from "next-themes";
import { describe, expect, it, vi } from "vitest";
import { ModeToggle } from "./mode-toggle";

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

// Helper to render with ThemeProvider
function renderWithTheme(ui: React.ReactElement) {
  return render(<ThemeProvider attribute="class">{ui}</ThemeProvider>);
}

describe("ModeToggle", () => {
  describe("smoke tests", () => {
    it("renders without crashing", () => {
      renderWithTheme(<ModeToggle />);
      expect(screen.getByRole("button")).toBeInTheDocument();
    });

    it("has accessible label", () => {
      renderWithTheme(<ModeToggle />);
      expect(screen.getByText("Toggle theme")).toBeInTheDocument();
    });
  });

  describe("button", () => {
    it("renders as icon button", () => {
      renderWithTheme(<ModeToggle />);
      const button = screen.getByRole("button");
      expect(button).toHaveClass("size-9"); // icon size class
    });

    it("renders sun and moon icons", () => {
      renderWithTheme(<ModeToggle />);
      // Both icons should be present (visibility controlled by CSS)
      const svgs = document.querySelectorAll("svg");
      expect(svgs.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe("dropdown menu", () => {
    it("opens dropdown and shows all theme options on click", async () => {
      const user = userEvent.setup();
      renderWithTheme(<ModeToggle />);

      await user.click(screen.getByRole("button"));
      await waitFor(() => {
        expect(screen.getByText("Light")).toBeInTheDocument();
        expect(screen.getByText("Dark")).toBeInTheDocument();
        expect(screen.getByText("System")).toBeInTheDocument();
      });
    });
  });

  describe("theme selection", () => {
    it("calls setTheme with light when Light is clicked", async () => {
      const mockSetTheme = vi.fn();
      const { useTheme } = await import("next-themes");
      vi.mocked(useTheme).mockReturnValue({
        theme: "dark",
        setTheme: mockSetTheme,
        themes: ["light", "dark", "system"],
        systemTheme: "light",
        resolvedTheme: "dark",
        forcedTheme: undefined,
      });

      const user = userEvent.setup();
      renderWithTheme(<ModeToggle />);

      await user.click(screen.getByRole("button"));
      await waitFor(() => {
        expect(screen.getByText("Light")).toBeInTheDocument();
      });
      await user.click(screen.getByText("Light"));
      expect(mockSetTheme).toHaveBeenCalledWith("light");
    });

    it("calls setTheme with dark when Dark is clicked", async () => {
      const mockSetTheme = vi.fn();
      const { useTheme } = await import("next-themes");
      vi.mocked(useTheme).mockReturnValue({
        theme: "light",
        setTheme: mockSetTheme,
        themes: ["light", "dark", "system"],
        systemTheme: "light",
        resolvedTheme: "light",
        forcedTheme: undefined,
      });

      const user = userEvent.setup();
      renderWithTheme(<ModeToggle />);

      await user.click(screen.getByRole("button"));
      await waitFor(() => {
        expect(screen.getByText("Dark")).toBeInTheDocument();
      });
      await user.click(screen.getByText("Dark"));
      expect(mockSetTheme).toHaveBeenCalledWith("dark");
    });

    it("calls setTheme with system when System is clicked", async () => {
      const mockSetTheme = vi.fn();
      const { useTheme } = await import("next-themes");
      vi.mocked(useTheme).mockReturnValue({
        theme: "light",
        setTheme: mockSetTheme,
        themes: ["light", "dark", "system"],
        systemTheme: "light",
        resolvedTheme: "light",
        forcedTheme: undefined,
      });

      const user = userEvent.setup();
      renderWithTheme(<ModeToggle />);

      await user.click(screen.getByRole("button"));
      await waitFor(() => {
        expect(screen.getByText("System")).toBeInTheDocument();
      });
      await user.click(screen.getByText("System"));
      expect(mockSetTheme).toHaveBeenCalledWith("system");
    });
  });

  describe("accessibility", () => {
    it("button is focusable", async () => {
      const user = userEvent.setup();
      renderWithTheme(<ModeToggle />);

      await user.tab();
      expect(screen.getByRole("button")).toHaveFocus();
    });

    it("opens menu with keyboard", async () => {
      const user = userEvent.setup();
      renderWithTheme(<ModeToggle />);

      const button = screen.getByRole("button");
      button.focus();
      await user.keyboard("{Enter}");

      await waitFor(() => {
        expect(screen.getByText("Light")).toBeInTheDocument();
      });
    });

    it("has sr-only label for screen readers", () => {
      renderWithTheme(<ModeToggle />);
      const srLabel = screen.getByText("Toggle theme");
      expect(srLabel).toHaveClass("sr-only");
    });
  });
});
