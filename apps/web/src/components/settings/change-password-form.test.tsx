import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock sonner toast
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock auth client
vi.mock("@/lib/auth-client", () => ({
  authClient: {
    changePassword: vi.fn(),
  },
}));

// Import after mocks
import ChangePasswordForm from "./change-password-form";

describe("ChangePasswordForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("smoke tests", () => {
    it("renders without crashing", () => {
      render(<ChangePasswordForm />);
      expect(
        screen.getByText("Update your password to keep your account secure")
      ).toBeInTheDocument();
    });

    it("renders description text", () => {
      render(<ChangePasswordForm />);
      expect(
        screen.getByText("Update your password to keep your account secure")
      ).toBeInTheDocument();
    });

    it("renders current password input", () => {
      render(<ChangePasswordForm />);
      expect(screen.getByLabelText("Current Password")).toBeInTheDocument();
    });

    it("renders new password input", () => {
      render(<ChangePasswordForm />);
      expect(screen.getByLabelText("New Password")).toBeInTheDocument();
    });

    it("renders confirm password input", () => {
      render(<ChangePasswordForm />);
      expect(screen.getByLabelText("Confirm New Password")).toBeInTheDocument();
    });

    it("renders revoke sessions checkbox", () => {
      render(<ChangePasswordForm />);
      expect(
        screen.getByLabelText("Sign out from all other devices")
      ).toBeInTheDocument();
    });

    it("renders submit button", () => {
      render(<ChangePasswordForm />);
      expect(
        screen.getByRole("button", { name: "Change Password" })
      ).toBeInTheDocument();
    });
  });

  describe("form inputs", () => {
    it("allows typing in current password field", async () => {
      const user = userEvent.setup();
      render(<ChangePasswordForm />);

      const input = screen.getByLabelText("Current Password");
      await user.type(input, "currentpass123");
      expect(input).toHaveValue("currentpass123");
    });

    it("allows typing in new password field", async () => {
      const user = userEvent.setup();
      render(<ChangePasswordForm />);

      const input = screen.getByLabelText("New Password");
      await user.type(input, "newpass123");
      expect(input).toHaveValue("newpass123");
    });

    it("allows typing in confirm password field", async () => {
      const user = userEvent.setup();
      render(<ChangePasswordForm />);

      const input = screen.getByLabelText("Confirm New Password");
      await user.type(input, "newpass123");
      expect(input).toHaveValue("newpass123");
    });

    it("revoke sessions checkbox is checked by default", () => {
      render(<ChangePasswordForm />);
      expect(
        screen.getByLabelText("Sign out from all other devices")
      ).toBeChecked();
    });

    it("allows toggling revoke sessions checkbox", async () => {
      const user = userEvent.setup();
      render(<ChangePasswordForm />);

      const checkbox = screen.getByLabelText("Sign out from all other devices");
      await user.click(checkbox);
      expect(checkbox).not.toBeChecked();
    });

    it("password inputs have correct type", () => {
      render(<ChangePasswordForm />);
      expect(screen.getByLabelText("Current Password")).toHaveAttribute(
        "type",
        "password"
      );
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
    it("calls changePassword on submit", async () => {
      const { authClient } = await import("@/lib/auth-client");
      vi.mocked(authClient.changePassword).mockResolvedValue(undefined);

      const user = userEvent.setup();
      render(<ChangePasswordForm />);

      await user.type(screen.getByLabelText("Current Password"), "current123");
      await user.type(screen.getByLabelText("New Password"), "newpass123");
      await user.type(
        screen.getByLabelText("Confirm New Password"),
        "newpass123"
      );
      await user.click(screen.getByRole("button", { name: "Change Password" }));

      expect(authClient.changePassword).toHaveBeenCalled();
    });
  });

  describe("accessibility", () => {
    it("current password input is focusable", async () => {
      const user = userEvent.setup();
      render(<ChangePasswordForm />);

      await user.tab();
      expect(screen.getByLabelText("Current Password")).toHaveFocus();
    });

    it("form can be navigated with keyboard", async () => {
      const user = userEvent.setup();
      render(<ChangePasswordForm />);

      await user.tab(); // Current Password
      expect(screen.getByLabelText("Current Password")).toHaveFocus();

      await user.tab(); // New Password
      expect(screen.getByLabelText("New Password")).toHaveFocus();

      await user.tab(); // Confirm Password
      expect(screen.getByLabelText("Confirm New Password")).toHaveFocus();
    });
  });
});
