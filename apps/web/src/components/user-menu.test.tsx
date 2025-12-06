import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { authClientWithSessionMock, tanstackRouterMock } from "@/test/ui-mocks";

vi.mock("@tanstack/react-router", () => tanstackRouterMock);
vi.mock("@/lib/auth-client", () => authClientWithSessionMock);

import UserMenu from "./user-menu";

/** Helper to mock unauthenticated state */
async function mockUnauthenticated() {
  const { authClient } = await import("@/lib/auth-client");
  vi.mocked(authClient.useSession).mockReturnValue({
    data: null,
    isPending: false,
  } as ReturnType<typeof authClient.useSession>);
}

/** Helper to mock authenticated state with given session */
async function mockAuthenticated(session: {
  user: { id: string; name: string; email: string };
  session: { id: string };
}) {
  const { authClient } = await import("@/lib/auth-client");
  vi.mocked(authClient.useSession).mockReturnValue({
    data: session,
    isPending: false,
  } as ReturnType<typeof authClient.useSession>);
  return authClient;
}

describe("UserMenu", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("smoke tests", () => {
    it("renders without crashing", () => {
      render(<UserMenu />);
      // When not logged in, shows Sign In button
      expect(screen.getByText("Sign In")).toBeInTheDocument();
    });
  });

  describe("loading state", () => {
    it("shows skeleton when session is pending", async () => {
      const { authClient } = await import("@/lib/auth-client");
      vi.mocked(authClient.useSession).mockReturnValue({
        data: null,
        isPending: true,
      } as ReturnType<typeof authClient.useSession>);

      render(<UserMenu />);
      expect(
        document.querySelector("[data-slot='skeleton']")
      ).toBeInTheDocument();
    });
  });

  describe("unauthenticated state", () => {
    it("shows Sign In button when not logged in", async () => {
      await mockUnauthenticated();
      render(<UserMenu />);
      expect(screen.getByText("Sign In")).toBeInTheDocument();
    });

    it("Sign In button links to /login", async () => {
      await mockUnauthenticated();
      render(<UserMenu />);
      const signInLink = screen.getByText("Sign In").closest("a");
      expect(signInLink).toHaveAttribute("href", "/login");
    });
  });

  describe("authenticated state", () => {
    const johnSession = {
      user: { id: "user-123", name: "John Doe", email: "john@example.com" },
      session: { id: "session-123" },
    };

    it("shows user name when logged in", async () => {
      await mockAuthenticated(johnSession);

      render(<UserMenu />);
      expect(screen.getByText("John Doe")).toBeInTheDocument();
    });

    it("opens dropdown menu on click", async () => {
      await mockAuthenticated(johnSession);

      const user = userEvent.setup();
      render(<UserMenu />);

      await user.click(screen.getByText("John Doe"));
      await waitFor(() => {
        expect(screen.getByText("My Account")).toBeInTheDocument();
      });
    });

    it("shows user email in dropdown", async () => {
      await mockAuthenticated(johnSession);

      const user = userEvent.setup();
      render(<UserMenu />);

      await user.click(screen.getByText("John Doe"));
      await waitFor(() => {
        expect(screen.getByText("john@example.com")).toBeInTheDocument();
      });
    });

    it("shows Sign Out button in dropdown", async () => {
      await mockAuthenticated(johnSession);

      const user = userEvent.setup();
      render(<UserMenu />);

      await user.click(screen.getByText("John Doe"));
      await waitFor(() => {
        expect(screen.getByText("Sign Out")).toBeInTheDocument();
      });
    });

    it("calls signOut when Sign Out is clicked", async () => {
      const authClient = await mockAuthenticated(johnSession);

      const user = userEvent.setup();
      render(<UserMenu />);

      await user.click(screen.getByText("John Doe"));
      await waitFor(() => {
        expect(screen.getByText("Sign Out")).toBeInTheDocument();
      });

      await user.click(screen.getByText("Sign Out"));
      expect(authClient.signOut).toHaveBeenCalled();
    });
  });

  describe("dropdown menu structure", () => {
    const janeSession = {
      user: { id: "user-123", name: "Jane Smith", email: "jane@example.com" },
      session: { id: "session-456" },
    };

    it("has My Account label", async () => {
      await mockAuthenticated(janeSession);

      const user = userEvent.setup();
      render(<UserMenu />);

      await user.click(screen.getByText("Jane Smith"));
      await waitFor(() => {
        expect(screen.getByText("My Account")).toBeInTheDocument();
      });
    });

    it("has separator between label and items", async () => {
      await mockAuthenticated(janeSession);

      const user = userEvent.setup();
      render(<UserMenu />);

      await user.click(screen.getByText("Jane Smith"));
      await waitFor(() => {
        const separator = document.querySelector(
          "[data-slot='dropdown-menu-separator']"
        );
        expect(separator).toBeInTheDocument();
      });
    });
  });
});
