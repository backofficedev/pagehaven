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
    resetPassword: vi.fn(),
  },
}));

// Import after mocks
import ResetPasswordPage from "./reset-password-page";

describe("ResetPasswordPage", () => {
  const mockToken = "test-reset-token";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("smoke tests", () => {
    it("renders without crashing", () => {
      render(<ResetPasswordPage token={mockToken} />);
      expect(
        screen.getByRole("heading", { name: "Set New Password" })
      ).toBeInTheDocument();
    });

    it("renders new password input", () => {
      render(<ResetPasswordPage token={mockToken} />);
      expect(screen.getByLabelText("New Password")).toBeInTheDocument();
    });

    it("renders confirm password input", () => {
      render(<ResetPasswordPage token={mockToken} />);
      expect(screen.getByLabelText("Confirm New Password")).toBeInTheDocument();
    });

    it("renders submit button", () => {
      render(<ResetPasswordPage token={mockToken} />);
      expect(
        screen.getByRole("button", { name: "Reset Password" })
      ).toBeInTheDocument();
    });

    it("renders back to sign in link", () => {
      render(<ResetPasswordPage token={mockToken} />);
      expect(
        screen.getByRole("button", { name: "Back to Sign In" })
      ).toBeInTheDocument();
    });

    it("renders description text", () => {
      render(<ResetPasswordPage token={mockToken} />);
      expect(
        screen.getByText("Enter your new password below.")
      ).toBeInTheDocument();
    });
  });

  describe("form inputs", () => {
    it("allows typing in new password field", async () => {
      const user = userEvent.setup();
      render(<ResetPasswordPage token={mockToken} />);

      const passwordInput = screen.getByLabelText("New Password");
      await user.type(passwordInput, "newpassword123");
      expect(passwordInput).toHaveValue("newpassword123");
    });

    it("allows typing in confirm password field", async () => {
      const user = userEvent.setup();
      render(<ResetPasswordPage token={mockToken} />);

      const confirmInput = screen.getByLabelText("Confirm New Password");
      await user.type(confirmInput, "newpassword123");
      expect(confirmInput).toHaveValue("newpassword123");
    });

    it("password inputs have correct type", () => {
      render(<ResetPasswordPage token={mockToken} />);
      expect(screen.getByLabelText("New Password")).toHaveAttribute(
        "type",
        "password"
      );
      expect(screen.getByLabelText("Confirm New Password")).toHaveAttribute(
        "type",
        "password"
      );
    });
  });

  describe("form submission", () => {
    it("calls resetPassword on submit", async () => {
      const { authClient } = await import("@/lib/auth-client");
      vi.mocked(authClient.resetPassword).mockResolvedValue(undefined);

      const user = userEvent.setup();
      render(<ResetPasswordPage token={mockToken} />);

      await user.type(screen.getByLabelText("New Password"), "newpassword123");
      await user.type(
        screen.getByLabelText("Confirm New Password"),
        "newpassword123"
      );
      await user.click(screen.getByRole("button", { name: "Reset Password" }));

      expect(authClient.resetPassword).toHaveBeenCalledWith(
        expect.objectContaining({
          newPassword: "newpassword123",
          token: mockToken,
        }),
        expect.any(Object)
      );
    });
  });

  describe("accessibility", () => {
    it("new password input is focusable", async () => {
      const user = userEvent.setup();
      render(<ResetPasswordPage token={mockToken} />);

      await user.tab();
      expect(screen.getByLabelText("New Password")).toHaveFocus();
    });

    it("form can be navigated with keyboard", async () => {
      const user = userEvent.setup();
      render(<ResetPasswordPage token={mockToken} />);

      await user.tab(); // New Password
      expect(screen.getByLabelText("New Password")).toHaveFocus();

      await user.tab(); // Confirm Password
      expect(screen.getByLabelText("Confirm New Password")).toHaveFocus();

      await user.tab(); // Submit button
      expect(
        screen.getByRole("button", { name: "Reset Password" })
      ).toHaveFocus();
    });
  });
});
