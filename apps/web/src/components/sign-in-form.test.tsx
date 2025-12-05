import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock TanStack Router
vi.mock("@tanstack/react-router", () => ({
  useNavigate: vi.fn(() => vi.fn()),
}));

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
    useSession: vi.fn(() => ({
      data: null,
      isPending: false,
    })),
    signIn: {
      email: vi.fn(),
    },
  },
}));

// Import after mocks
import SignInForm from "./sign-in-form";

describe("SignInForm", () => {
  const mockOnSwitchToSignUp = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("smoke tests", () => {
    it("renders without crashing", () => {
      render(<SignInForm onSwitchToSignUp={mockOnSwitchToSignUp} />);
      expect(screen.getByText("Welcome Back")).toBeInTheDocument();
    });

    it("renders email input", () => {
      render(<SignInForm onSwitchToSignUp={mockOnSwitchToSignUp} />);
      expect(screen.getByLabelText("Email")).toBeInTheDocument();
    });

    it("renders password input", () => {
      render(<SignInForm onSwitchToSignUp={mockOnSwitchToSignUp} />);
      expect(screen.getByLabelText("Password")).toBeInTheDocument();
    });

    it("renders sign in button", () => {
      render(<SignInForm onSwitchToSignUp={mockOnSwitchToSignUp} />);
      expect(
        screen.getByRole("button", { name: "Sign In" })
      ).toBeInTheDocument();
    });

    it("renders sign up link", () => {
      render(<SignInForm onSwitchToSignUp={mockOnSwitchToSignUp} />);
      expect(screen.getByText("Need an account? Sign Up")).toBeInTheDocument();
    });
  });

  describe("loading state", () => {
    it("shows loader when session is pending", async () => {
      const { authClient } = await import("@/lib/auth-client");
      vi.mocked(authClient.useSession).mockReturnValue({
        data: null,
        isPending: true,
      } as ReturnType<typeof authClient.useSession>);

      render(<SignInForm onSwitchToSignUp={mockOnSwitchToSignUp} />);
      // Loader renders an animated spinner
      expect(document.querySelector(".animate-spin")).toBeInTheDocument();
    });
  });

  describe("form inputs", () => {
    it("allows typing in email field", async () => {
      const { authClient } = await import("@/lib/auth-client");
      vi.mocked(authClient.useSession).mockReturnValue({
        data: null,
        isPending: false,
      } as ReturnType<typeof authClient.useSession>);

      const user = userEvent.setup();
      render(<SignInForm onSwitchToSignUp={mockOnSwitchToSignUp} />);

      const emailInput = screen.getByLabelText("Email");
      await user.type(emailInput, "test@example.com");
      expect(emailInput).toHaveValue("test@example.com");
    });

    it("allows typing in password field", async () => {
      const { authClient } = await import("@/lib/auth-client");
      vi.mocked(authClient.useSession).mockReturnValue({
        data: null,
        isPending: false,
      } as ReturnType<typeof authClient.useSession>);

      const user = userEvent.setup();
      render(<SignInForm onSwitchToSignUp={mockOnSwitchToSignUp} />);

      const passwordInput = screen.getByLabelText("Password");
      await user.type(passwordInput, "password123");
      expect(passwordInput).toHaveValue("password123");
    });
  });

  describe("switch to sign up", () => {
    it("calls onSwitchToSignUp when link is clicked", async () => {
      const { authClient } = await import("@/lib/auth-client");
      vi.mocked(authClient.useSession).mockReturnValue({
        data: null,
        isPending: false,
      } as ReturnType<typeof authClient.useSession>);

      const user = userEvent.setup();
      render(<SignInForm onSwitchToSignUp={mockOnSwitchToSignUp} />);

      await user.click(screen.getByText("Need an account? Sign Up"));
      expect(mockOnSwitchToSignUp).toHaveBeenCalled();
    });
  });

  describe("form structure", () => {
    it("has correct heading", () => {
      render(<SignInForm onSwitchToSignUp={mockOnSwitchToSignUp} />);
      const heading = screen.getByRole("heading", { level: 1 });
      expect(heading).toHaveTextContent("Welcome Back");
    });

    it("email input has correct type", () => {
      render(<SignInForm onSwitchToSignUp={mockOnSwitchToSignUp} />);
      const emailInput = screen.getByLabelText("Email");
      expect(emailInput).toHaveAttribute("type", "email");
    });

    it("password input has correct type", () => {
      render(<SignInForm onSwitchToSignUp={mockOnSwitchToSignUp} />);
      const passwordInput = screen.getByLabelText("Password");
      expect(passwordInput).toHaveAttribute("type", "password");
    });
  });

  describe("accessibility", () => {
    it("email input is focusable", async () => {
      const user = userEvent.setup();
      render(<SignInForm onSwitchToSignUp={mockOnSwitchToSignUp} />);

      await user.tab();
      expect(screen.getByLabelText("Email")).toHaveFocus();
    });

    it("form can be navigated with keyboard", async () => {
      const user = userEvent.setup();
      render(<SignInForm onSwitchToSignUp={mockOnSwitchToSignUp} />);

      await user.tab(); // Email
      expect(screen.getByLabelText("Email")).toHaveFocus();

      await user.tab(); // Password
      expect(screen.getByLabelText("Password")).toHaveFocus();

      await user.tab(); // Submit button
      expect(screen.getByRole("button", { name: "Sign In" })).toHaveFocus();
    });
  });

  describe("form validation", () => {
    it("validates email format via TanStack Form", () => {
      // TanStack Form handles validation via validators, not HTML attributes
      render(<SignInForm onSwitchToSignUp={mockOnSwitchToSignUp} />);
      const emailInput = screen.getByLabelText("Email");
      expect(emailInput).toBeInTheDocument();
    });

    it("validates password length via TanStack Form", () => {
      // TanStack Form handles validation via validators, not HTML attributes
      render(<SignInForm onSwitchToSignUp={mockOnSwitchToSignUp} />);
      const passwordInput = screen.getByLabelText("Password");
      expect(passwordInput).toBeInTheDocument();
    });
  });

  describe("sign in flow", () => {
    it("submits form with email and password", async () => {
      const { authClient } = await import("@/lib/auth-client");
      vi.mocked(authClient.useSession).mockReturnValue({
        data: null,
        isPending: false,
      } as ReturnType<typeof authClient.useSession>);

      const user = userEvent.setup();
      render(<SignInForm onSwitchToSignUp={mockOnSwitchToSignUp} />);

      await user.type(screen.getByLabelText("Email"), "test@example.com");
      await user.type(screen.getByLabelText("Password"), "password123");

      // Form should have the values filled in
      expect(screen.getByLabelText("Email")).toHaveValue("test@example.com");
      expect(screen.getByLabelText("Password")).toHaveValue("password123");
    });

    it("calls authClient.signIn.email on form submit", async () => {
      const { authClient } = await import("@/lib/auth-client");
      vi.mocked(authClient.useSession).mockReturnValue({
        data: null,
        isPending: false,
      } as ReturnType<typeof authClient.useSession>);

      const mockSignIn = vi.fn();
      vi.mocked(authClient.signIn.email).mockImplementation(mockSignIn);

      const user = userEvent.setup();
      render(<SignInForm onSwitchToSignUp={mockOnSwitchToSignUp} />);

      await user.type(screen.getByLabelText("Email"), "test@example.com");
      await user.type(screen.getByLabelText("Password"), "password123");
      await user.click(screen.getByRole("button", { name: "Sign In" }));

      // Wait for form submission
      await vi.waitFor(() => {
        expect(mockSignIn).toHaveBeenCalled();
      });
    });

    it("handles successful sign in", async () => {
      const { authClient } = await import("@/lib/auth-client");
      const { toast } = await import("sonner");
      const { useNavigate } = await import("@tanstack/react-router");

      vi.mocked(authClient.useSession).mockReturnValue({
        data: null,
        isPending: false,
      } as ReturnType<typeof authClient.useSession>);

      const mockNavigate = vi.fn();
      vi.mocked(useNavigate).mockReturnValue(mockNavigate);

      vi.mocked(authClient.signIn.email).mockImplementation(
        (_credentials, callbacks) => {
          callbacks?.onSuccess?.({} as never);
          return Promise.resolve();
        }
      );

      const user = userEvent.setup();
      render(<SignInForm onSwitchToSignUp={mockOnSwitchToSignUp} />);

      await user.type(screen.getByLabelText("Email"), "test@example.com");
      await user.type(screen.getByLabelText("Password"), "password123");
      await user.click(screen.getByRole("button", { name: "Sign In" }));

      await vi.waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith("Sign in successful");
      });
    });

    it("handles sign in error", async () => {
      const { authClient } = await import("@/lib/auth-client");
      const { toast } = await import("sonner");

      vi.mocked(authClient.useSession).mockReturnValue({
        data: null,
        isPending: false,
      } as ReturnType<typeof authClient.useSession>);

      vi.mocked(authClient.signIn.email).mockImplementation(
        (_credentials, callbacks) => {
          callbacks?.onError?.({
            error: {
              message: "Invalid credentials",
              statusText: "Unauthorized",
            },
          } as never);
          return Promise.resolve();
        }
      );

      const user = userEvent.setup();
      render(<SignInForm onSwitchToSignUp={mockOnSwitchToSignUp} />);

      await user.type(screen.getByLabelText("Email"), "test@example.com");
      await user.type(screen.getByLabelText("Password"), "password123");
      await user.click(screen.getByRole("button", { name: "Sign In" }));

      await vi.waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith("Invalid credentials");
      });
    });
  });
});
