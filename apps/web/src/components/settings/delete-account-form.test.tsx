import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { simpleToastMock, useNavigateMock } from "@/test/ui-mocks";

// Mock TanStack Router
vi.mock("@tanstack/react-router", () => useNavigateMock);

// Mock sonner toast
vi.mock("sonner", () => simpleToastMock);

// Mock auth client
vi.mock("@/lib/auth-client", () => ({
  authClient: {
    deleteUser: vi.fn(),
  },
}));

// Import after mocks
import DeleteAccountForm from "./delete-account-form";

const DESCRIPTION_REGEX =
  /Permanently delete your account and all associated data/;

describe("DeleteAccountForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("smoke tests", () => {
    it("renders without crashing", () => {
      render(<DeleteAccountForm />);
      expect(screen.getByText("Delete Account")).toBeInTheDocument();
    });

    it("renders description text", () => {
      render(<DeleteAccountForm />);
      expect(screen.getByText(DESCRIPTION_REGEX)).toBeInTheDocument();
    });

    it("renders warning section", () => {
      render(<DeleteAccountForm />);
      expect(screen.getByText("Warning:")).toBeInTheDocument();
    });

    it("renders warning items", () => {
      render(<DeleteAccountForm />);
      expect(
        screen.getByText("• All your personal data will be permanently deleted")
      ).toBeInTheDocument();
      expect(
        screen.getByText("• Your sites and associated data will be removed")
      ).toBeInTheDocument();
      expect(
        screen.getByText("• You will lose access to all account features")
      ).toBeInTheDocument();
      expect(
        screen.getByText("• This action cannot be reversed")
      ).toBeInTheDocument();
    });

    it("renders password input", () => {
      render(<DeleteAccountForm />);
      expect(
        screen.getByLabelText("Enter your password to confirm")
      ).toBeInTheDocument();
    });

    it("renders delete phrase input", () => {
      render(<DeleteAccountForm />);
      expect(
        screen.getByLabelText("Type 'DELETE MY ACCOUNT' to confirm")
      ).toBeInTheDocument();
    });

    it("renders confirmation checkbox", () => {
      render(<DeleteAccountForm />);
      expect(
        screen.getByLabelText(
          "I understand that this action is permanent and cannot be undone"
        )
      ).toBeInTheDocument();
    });

    it("renders submit button", () => {
      render(<DeleteAccountForm />);
      expect(
        screen.getByRole("button", { name: "Delete My Account" })
      ).toBeInTheDocument();
    });
  });

  describe("form inputs", () => {
    it("allows typing in password field", async () => {
      const user = userEvent.setup();
      render(<DeleteAccountForm />);

      const input = screen.getByLabelText("Enter your password to confirm");
      await user.type(input, "password123");
      expect(input).toHaveValue("password123");
    });

    it("allows typing in delete phrase field", async () => {
      const user = userEvent.setup();
      render(<DeleteAccountForm />);

      const input = screen.getByLabelText(
        "Type 'DELETE MY ACCOUNT' to confirm"
      );
      await user.type(input, "DELETE MY ACCOUNT");
      expect(input).toHaveValue("DELETE MY ACCOUNT");
    });

    it("confirmation checkbox is unchecked by default", () => {
      render(<DeleteAccountForm />);
      expect(
        screen.getByLabelText(
          "I understand that this action is permanent and cannot be undone"
        )
      ).not.toBeChecked();
    });

    it("allows toggling confirmation checkbox", async () => {
      const user = userEvent.setup();
      render(<DeleteAccountForm />);

      const checkbox = screen.getByLabelText(
        "I understand that this action is permanent and cannot be undone"
      );
      await user.click(checkbox);
      expect(checkbox).toBeChecked();
    });

    it("password input has correct type", () => {
      render(<DeleteAccountForm />);
      expect(
        screen.getByLabelText("Enter your password to confirm")
      ).toHaveAttribute("type", "password");
    });
  });

  describe("form submission", () => {
    it("calls deleteUser on submit with valid inputs", async () => {
      const { authClient } = await import("@/lib/auth-client");
      vi.mocked(authClient.deleteUser).mockResolvedValue(undefined);

      const user = userEvent.setup();
      render(<DeleteAccountForm />);

      await user.type(
        screen.getByLabelText("Enter your password to confirm"),
        "password123"
      );
      await user.type(
        screen.getByLabelText("Type 'DELETE MY ACCOUNT' to confirm"),
        "DELETE MY ACCOUNT"
      );
      await user.click(
        screen.getByLabelText(
          "I understand that this action is permanent and cannot be undone"
        )
      );
      await user.click(
        screen.getByRole("button", { name: "Delete My Account" })
      );

      expect(authClient.deleteUser).toHaveBeenCalled();
    });
  });

  describe("styling", () => {
    it("has destructive border on card", () => {
      const { container } = render(<DeleteAccountForm />);
      const card = container.querySelector(".border-destructive");
      expect(card).toBeInTheDocument();
    });

    it("has destructive variant on submit button", () => {
      render(<DeleteAccountForm />);
      const button = screen.getByRole("button", { name: "Delete My Account" });
      expect(button).toBeInTheDocument();
    });
  });

  describe("accessibility", () => {
    it("password input is focusable", async () => {
      const user = userEvent.setup();
      render(<DeleteAccountForm />);

      await user.tab();
      expect(
        screen.getByLabelText("Enter your password to confirm")
      ).toHaveFocus();
    });
  });
});
