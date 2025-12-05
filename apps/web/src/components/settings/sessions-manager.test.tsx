import { render, screen, waitFor } from "@testing-library/react";
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
    listSessions: vi.fn(),
    revokeSession: vi.fn(),
  },
}));

// Import after mocks
import SessionsManager from "./sessions-manager";

const mockCurrentSession = {
  token: "current-token",
  current: true,
  expiresAt: new Date("2024-12-31"),
  deviceInfo: {
    userAgent: "Chrome/120.0 on Mac",
    ip: "192.168.1.1",
  },
};

const mockOtherSession = {
  token: "other-token",
  current: false,
  expiresAt: new Date("2024-12-31"),
  deviceInfo: {
    userAgent: "Firefox/120.0 on Windows",
    ip: "192.168.1.2",
  },
};

describe("SessionsManager", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("loading state", () => {
    it("shows loader while loading sessions", async () => {
      const { authClient } = await import("@/lib/auth-client");
      // Create a promise that never resolves to keep loading state
      let _pendingResolve: (value: unknown) => void;
      vi.mocked(authClient.listSessions).mockReturnValue(
        new Promise((resolve) => {
          _pendingResolve = resolve;
        })
      );

      render(<SessionsManager />);
      expect(document.querySelector(".animate-spin")).toBeInTheDocument();
    });
  });

  describe("smoke tests", () => {
    it("renders without crashing after loading", async () => {
      const { authClient } = await import("@/lib/auth-client");
      vi.mocked(authClient.listSessions).mockResolvedValue({
        data: [mockCurrentSession],
      });

      render(<SessionsManager />);

      await waitFor(() => {
        expect(screen.getByText("Current Session")).toBeInTheDocument();
      });
    });

    it("renders current session card", async () => {
      const { authClient } = await import("@/lib/auth-client");
      vi.mocked(authClient.listSessions).mockResolvedValue({
        data: [mockCurrentSession],
      });

      render(<SessionsManager />);

      await waitFor(() => {
        expect(
          screen.getByText("This is the device you're currently using")
        ).toBeInTheDocument();
      });
    });

    it("renders other sessions card", async () => {
      const { authClient } = await import("@/lib/auth-client");
      vi.mocked(authClient.listSessions).mockResolvedValue({
        data: [mockCurrentSession],
      });

      render(<SessionsManager />);

      await waitFor(() => {
        expect(screen.getByText("Other Sessions")).toBeInTheDocument();
      });
    });
  });

  describe("session display", () => {
    it("displays current session info", async () => {
      const { authClient } = await import("@/lib/auth-client");
      vi.mocked(authClient.listSessions).mockResolvedValue({
        data: [mockCurrentSession],
      });

      render(<SessionsManager />);

      await waitFor(() => {
        expect(screen.getByText("Device:")).toBeInTheDocument();
        expect(screen.getByText("Last Active:")).toBeInTheDocument();
        expect(screen.getByText("IP Address:")).toBeInTheDocument();
      });
    });

    it("shows no other sessions message when only current session exists", async () => {
      const { authClient } = await import("@/lib/auth-client");
      vi.mocked(authClient.listSessions).mockResolvedValue({
        data: [mockCurrentSession],
      });

      render(<SessionsManager />);

      await waitFor(() => {
        expect(
          screen.getByText("No other active sessions")
        ).toBeInTheDocument();
      });
    });

    it("displays other sessions when they exist", async () => {
      const { authClient } = await import("@/lib/auth-client");
      vi.mocked(authClient.listSessions).mockResolvedValue({
        data: [mockCurrentSession, mockOtherSession],
      });

      render(<SessionsManager />);

      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: "Revoke" })
        ).toBeInTheDocument();
      });
    });

    it("shows sign out all button when other sessions exist", async () => {
      const { authClient } = await import("@/lib/auth-client");
      vi.mocked(authClient.listSessions).mockResolvedValue({
        data: [mockCurrentSession, mockOtherSession],
      });

      render(<SessionsManager />);

      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: "Sign Out All Other Devices" })
        ).toBeInTheDocument();
      });
    });
  });

  describe("session revocation", () => {
    it("calls revokeSession when revoke button is clicked", async () => {
      const { authClient } = await import("@/lib/auth-client");
      vi.mocked(authClient.listSessions).mockResolvedValue({
        data: [mockCurrentSession, mockOtherSession],
      });
      vi.mocked(authClient.revokeSession).mockResolvedValue(undefined);

      const user = userEvent.setup();
      render(<SessionsManager />);

      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: "Revoke" })
        ).toBeInTheDocument();
      });

      await user.click(screen.getByRole("button", { name: "Revoke" }));

      expect(authClient.revokeSession).toHaveBeenCalledWith({
        token: "other-token",
      });
    });
  });

  describe("error handling", () => {
    it("shows error toast when loading sessions fails", async () => {
      const { authClient } = await import("@/lib/auth-client");
      const { toast } = await import("sonner");
      vi.mocked(authClient.listSessions).mockRejectedValue(
        new Error("Failed to load")
      );

      render(<SessionsManager />);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith("Failed to load sessions");
      });
    });
  });
});
