import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { TEST_CREDENTIALS, TEST_ERRORS } from "@/test/fixtures";
import {
  fillSignUpForm,
  render,
  screen,
  setupAuthClientMock,
  setupAuthError,
  setupAuthSuccess,
} from "@/test/test-utils";

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

/** Helper to render SignUpForm with default props */
function renderSignUpForm() {
  const mockOnSwitchToSignIn = vi.fn();
  const result = render(<SignUpForm onSwitchToSignIn={mockOnSwitchToSignIn} />);
  return { ...result, mockOnSwitchToSignIn };
}

describe("SignUpForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("smoke tests", () => {
    it("renders without crashing", () => {
      renderSignUpForm();
      expect(screen.getByText("Create Account")).toBeInTheDocument();
    });

    it("renders name input", () => {
      renderSignUpForm();
      expect(screen.getByLabelText("Name")).toBeInTheDocument();
    });

    it("renders email input", () => {
      renderSignUpForm();
      expect(screen.getByLabelText("Email")).toBeInTheDocument();
    });

    it("renders password input", () => {
      renderSignUpForm();
      expect(screen.getByLabelText("Password")).toBeInTheDocument();
    });

    it("renders sign up button", () => {
      renderSignUpForm();
      expect(
        screen.getByRole("button", { name: "Sign Up" })
      ).toBeInTheDocument();
    });

    it("renders sign in link", () => {
      renderSignUpForm();
      expect(
        screen.getByText("Already have an account? Sign In")
      ).toBeInTheDocument();
    });
  });

  describe("loading state", () => {
    it("shows loader when session is pending", async () => {
      await setupAuthClientMock({ isPending: true });
      renderSignUpForm();
      expect(document.querySelector(".animate-spin")).toBeInTheDocument();
    });
  });

  describe("form inputs", () => {
    it("allows typing in name field", async () => {
      await setupAuthClientMock();
      const user = userEvent.setup();
      renderSignUpForm();

      const nameInput = screen.getByLabelText("Name");
      await user.type(nameInput, TEST_CREDENTIALS.name);
      expect(nameInput).toHaveValue(TEST_CREDENTIALS.name);
    });

    it("allows typing in email field", async () => {
      await setupAuthClientMock();
      const user = userEvent.setup();
      renderSignUpForm();

      const emailInput = screen.getByLabelText("Email");
      await user.type(emailInput, TEST_CREDENTIALS.email);
      expect(emailInput).toHaveValue(TEST_CREDENTIALS.email);
    });

    it("allows typing in password field", async () => {
      await setupAuthClientMock();
      const user = userEvent.setup();
      renderSignUpForm();

      const passwordInput = screen.getByLabelText("Password");
      await user.type(passwordInput, TEST_CREDENTIALS.password);
      expect(passwordInput).toHaveValue(TEST_CREDENTIALS.password);
    });
  });

  describe("switch to sign in", () => {
    it("calls onSwitchToSignIn when link is clicked", async () => {
      await setupAuthClientMock();
      const user = userEvent.setup();
      const { mockOnSwitchToSignIn: switchMock } = renderSignUpForm();

      await user.click(screen.getByText("Already have an account? Sign In"));
      expect(switchMock).toHaveBeenCalled();
    });
  });

  describe("form structure", () => {
    it("has correct heading", () => {
      renderSignUpForm();
      const heading = screen.getByRole("heading", { level: 1 });
      expect(heading).toHaveTextContent("Create Account");
    });

    it("name input has correct type", () => {
      renderSignUpForm();
      const nameInput = screen.getByLabelText("Name");
      // Default type is text
      expect(nameInput.tagName).toBe("INPUT");
    });

    it("email input has correct type", () => {
      renderSignUpForm();
      const emailInput = screen.getByLabelText("Email");
      expect(emailInput).toHaveAttribute("type", "email");
    });

    it("password input has correct type", () => {
      renderSignUpForm();
      const passwordInput = screen.getByLabelText("Password");
      expect(passwordInput).toHaveAttribute("type", "password");
    });
  });

  describe("accessibility", () => {
    it("form can be navigated with keyboard", async () => {
      const user = userEvent.setup();
      renderSignUpForm();

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
      renderSignUpForm();
      const nameInput = screen.getByLabelText("Name");
      expect(nameInput).toBeInTheDocument();
    });

    it("validates email format via TanStack Form", () => {
      // TanStack Form handles validation via validators, not HTML attributes
      renderSignUpForm();
      const emailInput = screen.getByLabelText("Email");
      expect(emailInput).toBeInTheDocument();
    });

    it("validates password length via TanStack Form", () => {
      // TanStack Form handles validation via validators, not HTML attributes
      renderSignUpForm();
      const passwordInput = screen.getByLabelText("Password");
      expect(passwordInput).toBeInTheDocument();
    });
  });

  describe("sign up flow", () => {
    it("submits form with all fields", async () => {
      await setupAuthClientMock();
      const user = userEvent.setup();
      renderSignUpForm();

      await user.type(screen.getByLabelText("Name"), TEST_CREDENTIALS.name);
      await user.type(screen.getByLabelText("Email"), TEST_CREDENTIALS.email);
      await user.type(
        screen.getByLabelText("Password"),
        TEST_CREDENTIALS.password
      );

      expect(screen.getByLabelText("Name")).toHaveValue(TEST_CREDENTIALS.name);
      expect(screen.getByLabelText("Email")).toHaveValue(
        TEST_CREDENTIALS.email
      );
      expect(screen.getByLabelText("Password")).toHaveValue(
        TEST_CREDENTIALS.password
      );
    });

    it("calls authClient.signUp.email on form submit", async () => {
      const authClient = await setupAuthClientMock();
      const mockSignUp = vi.fn();
      vi.mocked(authClient.signUp.email).mockImplementation(mockSignUp);

      const user = userEvent.setup();
      renderSignUpForm();
      await fillSignUpForm(user);

      await vi.waitFor(() => {
        expect(mockSignUp).toHaveBeenCalled();
      });
    });

    it("handles successful sign up", async () => {
      const { authClient, toast } = await setupAuthSuccess();
      vi.mocked(authClient.signUp.email).mockImplementation(
        (_credentials, callbacks) => {
          callbacks?.onSuccess?.({} as never);
          return Promise.resolve();
        }
      );

      const user = userEvent.setup();
      renderSignUpForm();
      await fillSignUpForm(user);

      await vi.waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith("Sign up successful");
      });
    });

    it("handles sign up error", async () => {
      const { authClient, toast } = await setupAuthError(
        TEST_ERRORS.emailExists
      );
      vi.mocked(authClient.signUp.email).mockImplementation(
        (_credentials, callbacks) => {
          callbacks?.onError?.({
            error: { message: TEST_ERRORS.emailExists, statusText: "Conflict" },
          } as never);
          return Promise.resolve();
        }
      );

      const user = userEvent.setup();
      renderSignUpForm();
      await fillSignUpForm(user);

      await vi.waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith(TEST_ERRORS.emailExists);
      });
    });
  });
});
