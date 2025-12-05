import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type React from "react";
import { describe, expect, it, vi } from "vitest";

// Mock dependencies
vi.mock("@tanstack/react-router", () => ({
  createFileRoute: (_path: string) => (options: unknown) => {
    const opts = options as { component: React.ComponentType };
    return { ...opts };
  },
  useNavigate: () => vi.fn(),
}));

vi.mock("@/components/sign-in-form", () => ({
  default: ({ onSwitchToSignUp }: { onSwitchToSignUp: () => void }) => (
    <div data-testid="sign-in-form">
      <button onClick={onSwitchToSignUp} type="button">
        Switch to Sign Up
      </button>
    </div>
  ),
}));

vi.mock("@/components/sign-up-form", () => ({
  default: ({ onSwitchToSignIn }: { onSwitchToSignIn: () => void }) => (
    <div data-testid="sign-up-form">
      <button onClick={onSwitchToSignIn} type="button">
        Switch to Sign In
      </button>
    </div>
  ),
}));

// Helper to render the actual component
async function renderLoginRoute() {
  const module = await import("./login");
  const route = module.Route as unknown as { component: React.ComponentType };
  const RouteComponent = route.component;
  return render(<RouteComponent />);
}

describe("login route", () => {
  describe("Route export", () => {
    it("exports Route", async () => {
      const module = await import("./login");
      expect(module.Route).toBeDefined();
    });
  });

  describe("initial state", () => {
    it("shows sign up form by default", async () => {
      await renderLoginRoute();
      expect(screen.getByTestId("sign-up-form")).toBeInTheDocument();
    });

    it("does not show sign in form initially", async () => {
      await renderLoginRoute();
      expect(screen.queryByTestId("sign-in-form")).not.toBeInTheDocument();
    });
  });

  describe("form switching", () => {
    it("switches to sign in form when clicking switch button", async () => {
      const user = userEvent.setup();
      await renderLoginRoute();

      await user.click(screen.getByText("Switch to Sign In"));

      expect(screen.getByTestId("sign-in-form")).toBeInTheDocument();
      expect(screen.queryByTestId("sign-up-form")).not.toBeInTheDocument();
    });

    it("switches back to sign up form from sign in", async () => {
      const user = userEvent.setup();
      await renderLoginRoute();

      // Switch to sign in
      await user.click(screen.getByText("Switch to Sign In"));
      expect(screen.getByTestId("sign-in-form")).toBeInTheDocument();

      // Switch back to sign up
      await user.click(screen.getByText("Switch to Sign Up"));
      expect(screen.getByTestId("sign-up-form")).toBeInTheDocument();
    });
  });
});
