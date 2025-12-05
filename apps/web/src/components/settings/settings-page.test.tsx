import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createMockSession } from "@/test/fixtures";

// Mock child components
vi.mock("@/components/settings/profile-form", () => ({
  default: () => <div data-testid="profile-form">Profile Form</div>,
}));

vi.mock("@/components/settings/change-password-form", () => ({
  default: () => (
    <div data-testid="change-password-form">Change Password Form</div>
  ),
}));

vi.mock("@/components/settings/sessions-manager", () => ({
  default: () => <div data-testid="sessions-manager">Sessions Manager</div>,
}));

vi.mock("@/components/settings/delete-account-form", () => ({
  default: () => (
    <div data-testid="delete-account-form">Delete Account Form</div>
  ),
}));

// Import after mocks
import SettingsPage from "./settings-page";

const mockSession = createMockSession();

describe("SettingsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("smoke tests", () => {
    it("renders without crashing", () => {
      render(<SettingsPage session={mockSession} />);
      expect(
        screen.getByRole("heading", { name: "Account Settings" })
      ).toBeInTheDocument();
    });

    it("renders description text", () => {
      render(<SettingsPage session={mockSession} />);
      expect(
        screen.getByText(
          "Manage your profile, security, and account preferences"
        )
      ).toBeInTheDocument();
    });

    it("renders all tab triggers", () => {
      render(<SettingsPage session={mockSession} />);
      expect(screen.getByRole("tab", { name: "Profile" })).toBeInTheDocument();
      expect(screen.getByRole("tab", { name: "Security" })).toBeInTheDocument();
      expect(screen.getByRole("tab", { name: "Sessions" })).toBeInTheDocument();
      expect(
        screen.getByRole("tab", { name: "Danger Zone" })
      ).toBeInTheDocument();
    });
  });

  describe("tab navigation", () => {
    it("shows profile form by default", () => {
      render(<SettingsPage session={mockSession} />);
      expect(screen.getByTestId("profile-form")).toBeInTheDocument();
    });

    it("shows change password form when security tab is clicked", async () => {
      const user = userEvent.setup();
      render(<SettingsPage session={mockSession} />);

      await user.click(screen.getByRole("tab", { name: "Security" }));
      expect(screen.getByTestId("change-password-form")).toBeInTheDocument();
    });

    it("shows sessions manager when sessions tab is clicked", async () => {
      const user = userEvent.setup();
      render(<SettingsPage session={mockSession} />);

      await user.click(screen.getByRole("tab", { name: "Sessions" }));
      expect(screen.getByTestId("sessions-manager")).toBeInTheDocument();
    });

    it("shows delete account form when danger zone tab is clicked", async () => {
      const user = userEvent.setup();
      render(<SettingsPage session={mockSession} />);

      await user.click(screen.getByRole("tab", { name: "Danger Zone" }));
      expect(screen.getByTestId("delete-account-form")).toBeInTheDocument();
    });
  });

  describe("accessibility", () => {
    it("has correct ARIA roles", () => {
      render(<SettingsPage session={mockSession} />);
      expect(screen.getByRole("tablist")).toBeInTheDocument();
      expect(screen.getAllByRole("tab")).toHaveLength(4);
    });

    it("supports keyboard navigation between tabs", async () => {
      const user = userEvent.setup();
      render(<SettingsPage session={mockSession} />);

      const profileTab = screen.getByRole("tab", { name: "Profile" });
      profileTab.focus();

      await user.keyboard("{ArrowRight}");
      expect(screen.getByRole("tab", { name: "Security" })).toHaveFocus();
    });
  });
});
