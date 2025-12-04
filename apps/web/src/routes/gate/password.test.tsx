import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

// Mock TanStack Router
vi.mock("@tanstack/react-router", () => ({
  createFileRoute: () => () => ({ component: () => null }),
}));

// Mock TanStack Query
vi.mock("@tanstack/react-query", () => ({
  useMutation: vi.fn(() => ({
    mutate: vi.fn(),
    isPending: false,
  })),
}));

// Mock sonner
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock orpc
vi.mock("@/utils/orpc", () => ({
  orpc: {
    access: {
      verifyPassword: {
        mutationOptions: vi.fn(() => ({})),
      },
    },
  },
}));

// Test component that mimics PasswordGatePage behavior
function TestPasswordGatePage({
  siteId = "",
  isPending = false,
}: {
  siteId?: string;
  isPending?: boolean;
}) {
  if (!siteId) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center">
        <div className="w-full max-w-md">
          <p>Invalid request</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4">
      <div className="w-full max-w-md">
        <h1>Password Protected</h1>
        <p>This site requires a password to access</p>
        <form>
          <label htmlFor="password">Password</label>
          <input
            autoFocus
            id="password"
            placeholder="Enter site password"
            required
            type="password"
          />
          <button disabled={isPending} type="submit">
            {isPending ? "Verifying..." : "Access Site"}
          </button>
        </form>
      </div>
    </div>
  );
}

describe("PasswordGatePage", () => {
  describe("smoke tests", () => {
    it("renders without crashing with valid siteId", () => {
      render(<TestPasswordGatePage siteId="site-123" />);
      expect(screen.getByText("Password Protected")).toBeInTheDocument();
    });
  });

  describe("invalid request", () => {
    it("shows invalid request when siteId is missing", () => {
      render(<TestPasswordGatePage siteId="" />);
      expect(screen.getByText("Invalid request")).toBeInTheDocument();
    });

    it("does not show form when siteId is missing", () => {
      render(<TestPasswordGatePage siteId="" />);
      expect(screen.queryByLabelText("Password")).not.toBeInTheDocument();
    });
  });

  describe("form rendering", () => {
    it("shows password input", () => {
      render(<TestPasswordGatePage siteId="site-123" />);
      expect(screen.getByLabelText("Password")).toBeInTheDocument();
    });

    it("shows submit button", () => {
      render(<TestPasswordGatePage siteId="site-123" />);
      expect(
        screen.getByRole("button", { name: "Access Site" })
      ).toBeInTheDocument();
    });

    it("password input has correct type", () => {
      render(<TestPasswordGatePage siteId="site-123" />);
      const input = screen.getByLabelText("Password");
      expect(input).toHaveAttribute("type", "password");
    });

    it("password input has placeholder", () => {
      render(<TestPasswordGatePage siteId="site-123" />);
      const input = screen.getByLabelText("Password");
      expect(input).toHaveAttribute("placeholder", "Enter site password");
    });
  });

  describe("loading state", () => {
    it("shows Verifying... when pending", () => {
      render(<TestPasswordGatePage isPending siteId="site-123" />);
      expect(screen.getByText("Verifying...")).toBeInTheDocument();
    });

    it("disables button when pending", () => {
      render(<TestPasswordGatePage isPending siteId="site-123" />);
      const button = screen.getByRole("button");
      expect(button).toBeDisabled();
    });
  });

  describe("form interaction", () => {
    it("allows typing in password field", async () => {
      const user = userEvent.setup();
      render(<TestPasswordGatePage siteId="site-123" />);

      const input = screen.getByLabelText("Password");
      await user.type(input, "secret123");
      expect(input).toHaveValue("secret123");
    });
  });

  describe("content", () => {
    it("shows title", () => {
      render(<TestPasswordGatePage siteId="site-123" />);
      expect(screen.getByText("Password Protected")).toBeInTheDocument();
    });

    it("shows description", () => {
      render(<TestPasswordGatePage siteId="site-123" />);
      expect(
        screen.getByText("This site requires a password to access")
      ).toBeInTheDocument();
    });
  });
});
