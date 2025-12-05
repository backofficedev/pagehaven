import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { simpleLinkMock, simpleToastMock } from "@/test/ui-mocks";

// Mock TanStack Router
vi.mock("@tanstack/react-router", () => simpleLinkMock);

// Mock sonner toast
vi.mock("sonner", () => simpleToastMock);

// Mock auth client
vi.mock("@/lib/auth-client", () => ({
  authClient: {
    requestPasswordReset: vi.fn(),
  },
}));

// Import after mocks
import ForgotPasswordPage from "./forgot-password-page";

const DESCRIPTION_REGEX = /Enter your email address and we'll send you a link/;

describe("ForgotPasswordPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("smoke tests", () => {
    it("renders without crashing", () => {
      render(<ForgotPasswordPage />);
      expect(
        screen.getByRole("heading", { name: "Reset Password" })
      ).toBeInTheDocument();
    });

    it("renders email input", () => {
      render(<ForgotPasswordPage />);
      expect(screen.getByLabelText("Email")).toBeInTheDocument();
    });

    it("renders submit button", () => {
      render(<ForgotPasswordPage />);
      expect(
        screen.getByRole("button", { name: "Send Reset Link" })
      ).toBeInTheDocument();
    });

    it("renders back to sign in link", () => {
      render(<ForgotPasswordPage />);
      expect(
        screen.getByRole("button", { name: "Back to Sign In" })
      ).toBeInTheDocument();
    });

    it("renders description text", () => {
      render(<ForgotPasswordPage />);
      expect(screen.getByText(DESCRIPTION_REGEX)).toBeInTheDocument();
    });
  });

  describe("form inputs", () => {
    it("allows typing in email field", async () => {
      const user = userEvent.setup();
      render(<ForgotPasswordPage />);

      const emailInput = screen.getByLabelText("Email");
      await user.type(emailInput, "test@example.com");
      expect(emailInput).toHaveValue("test@example.com");
    });

    it("email input has correct type", () => {
      render(<ForgotPasswordPage />);
      const emailInput = screen.getByLabelText("Email");
      expect(emailInput).toHaveAttribute("type", "email");
    });
  });

  describe("form submission", () => {
    it("calls requestPasswordReset on submit", async () => {
      const { authClient } = await import("@/lib/auth-client");
      vi.mocked(authClient.requestPasswordReset).mockResolvedValue(undefined);

      const user = userEvent.setup();
      render(<ForgotPasswordPage />);

      await user.type(screen.getByLabelText("Email"), "test@example.com");
      await user.click(screen.getByRole("button", { name: "Send Reset Link" }));

      expect(authClient.requestPasswordReset).toHaveBeenCalledWith(
        expect.objectContaining({
          email: "test@example.com",
        }),
        expect.any(Object)
      );
    });
  });

  describe("accessibility", () => {
    it("email input is focusable", async () => {
      const user = userEvent.setup();
      render(<ForgotPasswordPage />);

      await user.tab();
      expect(screen.getByLabelText("Email")).toHaveFocus();
    });

    it("form can be navigated with keyboard", async () => {
      const user = userEvent.setup();
      render(<ForgotPasswordPage />);

      await user.tab(); // Email
      expect(screen.getByLabelText("Email")).toHaveFocus();

      await user.tab(); // Submit button
      expect(
        screen.getByRole("button", { name: "Send Reset Link" })
      ).toHaveFocus();
    });
  });
});
