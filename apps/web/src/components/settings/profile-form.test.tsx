import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createMockSession } from "@/test/fixtures";

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
    updateUser: vi.fn(),
    changeEmail: vi.fn(),
  },
}));

// Import after mocks
import ProfileForm from "./profile-form";

const mockSession = createMockSession({
  user: { image: "https://example.com/avatar.jpg" },
});

/** Helper to render ProfileForm with default session */
function renderProfileForm() {
  return render(<ProfileForm session={mockSession} />);
}

/** Helper to fill and submit email change form */
async function fillAndSubmitEmailChangeForm(
  user: ReturnType<typeof userEvent.setup>
) {
  await user.type(
    screen.getByLabelText("New Email Address"),
    "newemail@example.com"
  );
  await user.type(screen.getByLabelText("Confirm Password"), "password123");
  await user.click(screen.getByRole("button", { name: "Change Email" }));
}

describe("ProfileForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("smoke tests", () => {
    it("renders without crashing", () => {
      renderProfileForm();
      expect(screen.getByText("Profile Information")).toBeInTheDocument();
    });

    it("renders profile information card", () => {
      renderProfileForm();
      expect(
        screen.getByText("Update your personal information and profile picture")
      ).toBeInTheDocument();
    });

    it("renders change email card", () => {
      renderProfileForm();
      expect(
        screen.getByText(
          "Update your email address. A confirmation will be sent to your current email."
        )
      ).toBeInTheDocument();
    });

    it("renders name input with default value", () => {
      renderProfileForm();
      expect(screen.getByLabelText("Name")).toHaveValue("Test User");
    });

    it("renders profile image URL input with default value", () => {
      renderProfileForm();
      expect(screen.getByLabelText("Profile Image URL")).toHaveValue(
        "https://example.com/avatar.jpg"
      );
    });

    it("displays current email", () => {
      renderProfileForm();
      expect(screen.getByText("test@example.com")).toBeInTheDocument();
    });
  });

  describe("profile form inputs", () => {
    it("allows editing name", async () => {
      const user = userEvent.setup();
      renderProfileForm();

      const nameInput = screen.getByLabelText("Name");
      await user.clear(nameInput);
      await user.type(nameInput, "New Name");
      expect(nameInput).toHaveValue("New Name");
    });

    it("allows editing profile image URL", async () => {
      const user = userEvent.setup();
      renderProfileForm();

      const imageInput = screen.getByLabelText("Profile Image URL");
      await user.clear(imageInput);
      await user.type(imageInput, "https://new-image.com/avatar.jpg");
      expect(imageInput).toHaveValue("https://new-image.com/avatar.jpg");
    });
  });

  describe("email form inputs", () => {
    it("allows typing new email", async () => {
      const user = userEvent.setup();
      renderProfileForm();

      const emailInput = screen.getByLabelText("New Email Address");
      await user.type(emailInput, "newemail@example.com");
      expect(emailInput).toHaveValue("newemail@example.com");
    });

    it("allows typing password for email change", async () => {
      const user = userEvent.setup();
      renderProfileForm();

      const passwordInput = screen.getByLabelText("Confirm Password");
      await user.type(passwordInput, "password123");
      expect(passwordInput).toHaveValue("password123");
    });
  });

  describe("form submission", () => {
    it("calls updateUser on profile form submit", async () => {
      const { authClient } = await import("@/lib/auth-client");
      vi.mocked(authClient.updateUser).mockResolvedValue(undefined);

      const user = userEvent.setup();
      renderProfileForm();

      await user.click(screen.getByRole("button", { name: "Update Profile" }));

      expect(authClient.updateUser).toHaveBeenCalled();
    });

    it("handles successful profile update", async () => {
      const { authClient } = await import("@/lib/auth-client");
      const { toast } = await import("sonner");

      vi.mocked(authClient.updateUser).mockImplementation(
        (_data, callbacks) => {
          callbacks?.onSuccess?.({} as never);
          return Promise.resolve();
        }
      );

      const user = userEvent.setup();
      renderProfileForm();

      await user.click(screen.getByRole("button", { name: "Update Profile" }));

      await vi.waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith(
          "Profile updated successfully"
        );
      });
    });

    it("handles profile update error", async () => {
      const { authClient } = await import("@/lib/auth-client");
      const { toast } = await import("sonner");

      vi.mocked(authClient.updateUser).mockImplementation(
        (_data, callbacks) => {
          callbacks?.onError?.({
            error: { message: "Update failed" },
          } as never);
          return Promise.resolve();
        }
      );

      const user = userEvent.setup();
      renderProfileForm();

      await user.click(screen.getByRole("button", { name: "Update Profile" }));

      await vi.waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith("Update failed");
      });
    });

    it("calls changeEmail on email form submit", async () => {
      const { authClient } = await import("@/lib/auth-client");
      vi.mocked(authClient.changeEmail).mockResolvedValue(undefined);

      const user = userEvent.setup();
      renderProfileForm();
      await fillAndSubmitEmailChangeForm(user);

      await vi.waitFor(() => {
        expect(authClient.changeEmail).toHaveBeenCalled();
      });
    });

    it("handles successful email change", async () => {
      const { authClient } = await import("@/lib/auth-client");
      const { toast } = await import("sonner");

      vi.mocked(authClient.changeEmail).mockImplementation(
        (_data, callbacks) => {
          callbacks?.onSuccess?.({} as never);
          return Promise.resolve();
        }
      );

      const user = userEvent.setup();
      renderProfileForm();
      await fillAndSubmitEmailChangeForm(user);

      await vi.waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith(
          "Email change confirmation sent to your current email"
        );
      });
    });

    it("handles email change error", async () => {
      const { authClient } = await import("@/lib/auth-client");
      const { toast } = await import("sonner");

      vi.mocked(authClient.changeEmail).mockImplementation(
        (_data, callbacks) => {
          callbacks?.onError?.({
            error: { message: "Email change failed" },
          } as never);
          return Promise.resolve();
        }
      );

      const user = userEvent.setup();
      renderProfileForm();
      await fillAndSubmitEmailChangeForm(user);

      await vi.waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith("Email change failed");
      });
    });
  });

  describe("accessibility", () => {
    it("name input is focusable", async () => {
      const user = userEvent.setup();
      renderProfileForm();

      await user.tab();
      expect(screen.getByLabelText("Name")).toHaveFocus();
    });
  });
});
