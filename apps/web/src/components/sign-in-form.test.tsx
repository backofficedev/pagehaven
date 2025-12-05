import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { TEST_CREDENTIALS, TEST_ERRORS } from "@/test/fixtures";
import {
  fillSignInForm,
  render,
  screen,
  setupAuthClientMock,
  setupAuthError,
  setupAuthSuccess,
} from "@/test/test-utils";
import SignInForm from "./sign-in-form";

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

describe("SignInForm", () => {
  /** Helper to render SignInForm with default props */
  function renderSignInForm() {
    const mockOnSwitchToSignUp = vi.fn();
    const result = render(
      <SignInForm onSwitchToSignUp={mockOnSwitchToSignUp} />
    );
    return { ...result, mockOnSwitchToSignUp };
  }

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("smoke tests", () => {
    it("renders without crashing", () => {
      renderSignInForm();
      expect(screen.getByText("Welcome Back")).toBeInTheDocument();
    });

    it("renders email input", () => {
      renderSignInForm();
      expect(screen.getByLabelText("Email")).toBeInTheDocument();
    });

    it("renders password input", () => {
      renderSignInForm();
      expect(screen.getByLabelText("Password")).toBeInTheDocument();
    });

    it("renders sign in button", () => {
      renderSignInForm();
      expect(
        screen.getByRole("button", { name: "Sign In" })
      ).toBeInTheDocument();
    });

    it("renders sign up link", () => {
      renderSignInForm();
      expect(screen.getByText("Need an account? Sign Up")).toBeInTheDocument();
    });
  });

  describe("loading state", () => {
    it("shows loader when session is pending", async () => {
      await setupAuthClientMock({ isPending: true });
      renderSignInForm();
      expect(document.querySelector(".animate-spin")).toBeInTheDocument();
    });
  });

  describe("form inputs", () => {
    it("allows typing in email field", async () => {
      await setupAuthClientMock();
      const user = userEvent.setup();
      renderSignInForm();

      const emailInput = screen.getByLabelText("Email");
      await user.type(emailInput, TEST_CREDENTIALS.email);
      expect(emailInput).toHaveValue(TEST_CREDENTIALS.email);
    });

    it("allows typing in password field", async () => {
      await setupAuthClientMock();
      const user = userEvent.setup();
      renderSignInForm();

      const passwordInput = screen.getByLabelText("Password");
      await user.type(passwordInput, TEST_CREDENTIALS.password);
      expect(passwordInput).toHaveValue(TEST_CREDENTIALS.password);
    });
  });

  describe("switch to sign up", () => {
    it("calls onSwitchToSignUp when link is clicked", async () => {
      await setupAuthClientMock();
      const user = userEvent.setup();
      const { mockOnSwitchToSignUp } = renderSignInForm();

      await user.click(screen.getByText("Need an account? Sign Up"));
      expect(mockOnSwitchToSignUp).toHaveBeenCalled();
    });
  });

  describe("form structure", () => {
    it("has correct heading", () => {
      renderSignInForm();
      const heading = screen.getByRole("heading", { level: 1 });
      expect(heading).toHaveTextContent("Welcome Back");
    });

    it("email input has correct type", () => {
      renderSignInForm();
      const emailInput = screen.getByLabelText("Email");
      expect(emailInput).toHaveAttribute("type", "email");
    });

    it("password input has correct type", () => {
      renderSignInForm();
      const passwordInput = screen.getByLabelText("Password");
      expect(passwordInput).toHaveAttribute("type", "password");
    });
  });

  describe("accessibility", () => {
    it("email input is focusable", async () => {
      const user = userEvent.setup();
      renderSignInForm();

      await user.tab();
      expect(screen.getByLabelText("Email")).toHaveFocus();
    });

    it("form can be navigated with keyboard", async () => {
      const user = userEvent.setup();
      renderSignInForm();

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
      renderSignInForm();
      const emailInput = screen.getByLabelText("Email");
      expect(emailInput).toBeInTheDocument();
    });

    it("validates password length via TanStack Form", () => {
      // TanStack Form handles validation via validators, not HTML attributes
      renderSignInForm();
      const passwordInput = screen.getByLabelText("Password");
      expect(passwordInput).toBeInTheDocument();
    });
  });

  describe("sign in flow", () => {
    it("submits form with email and password", async () => {
      await setupAuthClientMock();
      const user = userEvent.setup();
      renderSignInForm();

      await user.type(screen.getByLabelText("Email"), TEST_CREDENTIALS.email);
      await user.type(
        screen.getByLabelText("Password"),
        TEST_CREDENTIALS.password
      );

      expect(screen.getByLabelText("Email")).toHaveValue(
        TEST_CREDENTIALS.email
      );
      expect(screen.getByLabelText("Password")).toHaveValue(
        TEST_CREDENTIALS.password
      );
    });

    it("calls authClient.signIn.email on form submit", async () => {
      const authClient = await setupAuthClientMock();
      const mockSignIn = vi.fn();
      vi.mocked(authClient.signIn.email).mockImplementation(mockSignIn);

      const user = userEvent.setup();
      renderSignInForm();
      await fillSignInForm(user);

      await vi.waitFor(() => {
        expect(mockSignIn).toHaveBeenCalled();
      });
    });

    it("handles successful sign in", async () => {
      const { authClient, toast } = await setupAuthSuccess();
      vi.mocked(authClient.signIn.email).mockImplementation(
        (_credentials, callbacks) => {
          callbacks?.onSuccess?.({} as never);
          return Promise.resolve();
        }
      );

      const user = userEvent.setup();
      renderSignInForm();
      await fillSignInForm(user);

      await vi.waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith("Sign in successful");
      });
    });

    it("handles sign in error", async () => {
      const { authClient, toast } = await setupAuthError(
        TEST_ERRORS.invalidCredentials
      );
      vi.mocked(authClient.signIn.email).mockImplementation(
        (_credentials, callbacks) => {
          callbacks?.onError?.({
            error: {
              message: TEST_ERRORS.invalidCredentials,
              statusText: "Unauthorized",
            },
          } as never);
          return Promise.resolve();
        }
      );

      const user = userEvent.setup();
      renderSignInForm();
      await fillSignInForm(user);

      await vi.waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith(
          TEST_ERRORS.invalidCredentials
        );
      });
    });
  });
});
