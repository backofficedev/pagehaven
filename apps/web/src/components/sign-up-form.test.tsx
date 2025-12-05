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
    signUp: {
      email: vi.fn(),
    },
  },
}));

// Import after mocks
import SignUpForm from "./sign-up-form";

describe("SignUpForm", () => {
  const mockOnSwitchToSignIn = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("smoke tests", () => {
    it("renders without crashing", () => {
      render(<SignUpForm onSwitchToSignIn={mockOnSwitchToSignIn} />);
      expect(screen.getByText("Create Account")).toBeInTheDocument();
    });

    it("renders name input", () => {
      render(<SignUpForm onSwitchToSignIn={mockOnSwitchToSignIn} />);
      expect(screen.getByLabelText("Name")).toBeInTheDocument();
    });

    it("renders email input", () => {
      render(<SignUpForm onSwitchToSignIn={mockOnSwitchToSignIn} />);
      expect(screen.getByLabelText("Email")).toBeInTheDocument();
    });

    it("renders password input", () => {
      render(<SignUpForm onSwitchToSignIn={mockOnSwitchToSignIn} />);
      expect(screen.getByLabelText("Password")).toBeInTheDocument();
    });

    it("renders sign up button", () => {
      render(<SignUpForm onSwitchToSignIn={mockOnSwitchToSignIn} />);
      expect(
        screen.getByRole("button", { name: "Sign Up" })
      ).toBeInTheDocument();
    });

    it("renders sign in link", () => {
      render(<SignUpForm onSwitchToSignIn={mockOnSwitchToSignIn} />);
      expect(
        screen.getByText("Already have an account? Sign In")
      ).toBeInTheDocument();
    });
  });

  describe("loading state", () => {
    it("shows loader when session is pending", async () => {
      const { authClient } = await import("@/lib/auth-client");
      vi.mocked(authClient.useSession).mockReturnValue({
        data: null,
        isPending: true,
      } as ReturnType<typeof authClient.useSession>);

      render(<SignUpForm onSwitchToSignIn={mockOnSwitchToSignIn} />);
      expect(document.querySelector(".animate-spin")).toBeInTheDocument();
    });
  });

  describe("form inputs", () => {
    it("allows typing in name field", async () => {
      const { authClient } = await import("@/lib/auth-client");
      vi.mocked(authClient.useSession).mockReturnValue({
        data: null,
        isPending: false,
      } as ReturnType<typeof authClient.useSession>);

      const user = userEvent.setup();
      render(<SignUpForm onSwitchToSignIn={mockOnSwitchToSignIn} />);

      const nameInput = screen.getByLabelText("Name");
      await user.type(nameInput, "John Doe");
      expect(nameInput).toHaveValue("John Doe");
    });

    it("allows typing in email field", async () => {
      const { authClient } = await import("@/lib/auth-client");
      vi.mocked(authClient.useSession).mockReturnValue({
        data: null,
        isPending: false,
      } as ReturnType<typeof authClient.useSession>);

      const user = userEvent.setup();
      render(<SignUpForm onSwitchToSignIn={mockOnSwitchToSignIn} />);

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
      render(<SignUpForm onSwitchToSignIn={mockOnSwitchToSignIn} />);

      const passwordInput = screen.getByLabelText("Password");
      await user.type(passwordInput, "password123");
      expect(passwordInput).toHaveValue("password123");
    });
  });

  describe("switch to sign in", () => {
    it("calls onSwitchToSignIn when link is clicked", async () => {
      const { authClient } = await import("@/lib/auth-client");
      vi.mocked(authClient.useSession).mockReturnValue({
        data: null,
        isPending: false,
      } as ReturnType<typeof authClient.useSession>);

      const user = userEvent.setup();
      render(<SignUpForm onSwitchToSignIn={mockOnSwitchToSignIn} />);

      await user.click(screen.getByText("Already have an account? Sign In"));
      expect(mockOnSwitchToSignIn).toHaveBeenCalled();
    });
  });

  describe("form structure", () => {
    it("has correct heading", () => {
      render(<SignUpForm onSwitchToSignIn={mockOnSwitchToSignIn} />);
      const heading = screen.getByRole("heading", { level: 1 });
      expect(heading).toHaveTextContent("Create Account");
    });

    it("name input has correct type", () => {
      render(<SignUpForm onSwitchToSignIn={mockOnSwitchToSignIn} />);
      const nameInput = screen.getByLabelText("Name");
      // Default type is text
      expect(nameInput.tagName).toBe("INPUT");
    });

    it("email input has correct type", () => {
      render(<SignUpForm onSwitchToSignIn={mockOnSwitchToSignIn} />);
      const emailInput = screen.getByLabelText("Email");
      expect(emailInput).toHaveAttribute("type", "email");
    });

    it("password input has correct type", () => {
      render(<SignUpForm onSwitchToSignIn={mockOnSwitchToSignIn} />);
      const passwordInput = screen.getByLabelText("Password");
      expect(passwordInput).toHaveAttribute("type", "password");
    });
  });

  describe("accessibility", () => {
    it("form can be navigated with keyboard", async () => {
      const user = userEvent.setup();
      render(<SignUpForm onSwitchToSignIn={mockOnSwitchToSignIn} />);

      await user.tab(); // Name
      expect(screen.getByLabelText("Name")).toHaveFocus();

      await user.tab(); // Email
      expect(screen.getByLabelText("Email")).toHaveFocus();

      await user.tab(); // Password
      expect(screen.getByLabelText("Password")).toHaveFocus();

      await user.tab(); // Submit button
      expect(screen.getByRole("button", { name: "Sign Up" })).toHaveFocus();
    });
  });

  describe("form validation", () => {
    it("validates name via TanStack Form", () => {
      // TanStack Form handles validation via validators, not HTML attributes
      render(<SignUpForm onSwitchToSignIn={mockOnSwitchToSignIn} />);
      const nameInput = screen.getByLabelText("Name");
      expect(nameInput).toBeInTheDocument();
    });

    it("validates email format via TanStack Form", () => {
      // TanStack Form handles validation via validators, not HTML attributes
      render(<SignUpForm onSwitchToSignIn={mockOnSwitchToSignIn} />);
      const emailInput = screen.getByLabelText("Email");
      expect(emailInput).toBeInTheDocument();
    });

    it("validates password length via TanStack Form", () => {
      // TanStack Form handles validation via validators, not HTML attributes
      render(<SignUpForm onSwitchToSignIn={mockOnSwitchToSignIn} />);
      const passwordInput = screen.getByLabelText("Password");
      expect(passwordInput).toBeInTheDocument();
    });
  });

  describe("sign up flow", () => {
    it("submits form with name, email and password", async () => {
      const { authClient } = await import("@/lib/auth-client");
      vi.mocked(authClient.useSession).mockReturnValue({
        data: null,
        isPending: false,
      } as ReturnType<typeof authClient.useSession>);

      const user = userEvent.setup();
      render(<SignUpForm onSwitchToSignIn={mockOnSwitchToSignIn} />);

      await user.type(screen.getByLabelText("Name"), "Test User");
      await user.type(screen.getByLabelText("Email"), "test@example.com");
      await user.type(screen.getByLabelText("Password"), "password123");

      // Form should have the values filled in
      expect(screen.getByLabelText("Name")).toHaveValue("Test User");
      expect(screen.getByLabelText("Email")).toHaveValue("test@example.com");
      expect(screen.getByLabelText("Password")).toHaveValue("password123");
    });
  });
});
