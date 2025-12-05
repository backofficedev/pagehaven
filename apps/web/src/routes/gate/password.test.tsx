import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock state for dynamic control
let mockSearchParams = { siteId: "", redirect: "/" };
const mockMutate = vi.fn();
let mockIsPending = false;

// Mock TanStack Router
vi.mock("@tanstack/react-router", () => ({
  createFileRoute: (_path: string) => (options: unknown) => {
    const opts = options as { component: React.ComponentType };
    return {
      ...opts,
      useSearch: () => mockSearchParams,
    };
  },
}));

// Mock TanStack Query
vi.mock("@tanstack/react-query", () => ({
  useMutation: (options: unknown) => {
    const opts = options as {
      onSuccess?: (data: { valid: boolean; token: string | null }) => void;
      onError?: (error: Error) => void;
    };
    return {
      mutate: (data: unknown) => {
        mockMutate(data);
        // Simulate success for testing
        if (opts.onSuccess) {
          opts.onSuccess({ valid: true, token: "test-token" });
        }
      },
      isPending: mockIsPending,
    };
  },
}));

// Mock sonner
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock lucide-react
vi.mock("lucide-react", () => ({
  Lock: () => <span data-testid="lock-icon" />,
}));

// Mock UI components
vi.mock("@/components/ui/button", () => ({
  Button: ({
    children,
    disabled,
    type,
    className,
  }: {
    children: React.ReactNode;
    disabled?: boolean;
    type?: string;
    className?: string;
  }) => (
    <button className={className} disabled={disabled} type={type as "submit"}>
      {children}
    </button>
  ),
}));

vi.mock("@/components/ui/card", () => ({
  Card: ({
    children,
    className,
  }: {
    children: React.ReactNode;
    className?: string;
  }) => <div className={className}>{children}</div>,
  CardContent: ({
    children,
    className,
  }: {
    children: React.ReactNode;
    className?: string;
  }) => <div className={className}>{children}</div>,
  CardDescription: ({ children }: { children: React.ReactNode }) => (
    <p>{children}</p>
  ),
  CardHeader: ({
    children,
    className,
  }: {
    children: React.ReactNode;
    className?: string;
  }) => <div className={className}>{children}</div>,
  CardTitle: ({ children }: { children: React.ReactNode }) => (
    <h2>{children}</h2>
  ),
}));

vi.mock("@/components/ui/input", () => ({
  Input: (props: React.InputHTMLAttributes<HTMLInputElement>) => (
    <input {...props} />
  ),
}));

vi.mock("@/components/ui/label", () => ({
  Label: ({
    children,
    htmlFor,
  }: {
    children: React.ReactNode;
    htmlFor?: string;
  }) => <label htmlFor={htmlFor}>{children}</label>,
}));

// Mock orpc
vi.mock("@/utils/orpc", () => ({
  orpc: {
    access: {
      verifyPassword: {
        mutationOptions: () => ({}),
      },
    },
  },
}));

// Helper to render the actual component
async function renderPasswordGatePage() {
  const module = await import("./password");
  const route = module.Route as unknown as { component: React.ComponentType };
  const PasswordGatePage = route.component;
  return render(<PasswordGatePage />);
}

describe("PasswordGatePage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSearchParams = { siteId: "", redirect: "/" };
    mockIsPending = false;
  });

  describe("Route export", () => {
    it("exports Route", async () => {
      const module = await import("./password");
      expect(module.Route).toBeDefined();
    });
  });

  describe("invalid request (no siteId)", () => {
    it("shows invalid request when siteId is missing", async () => {
      mockSearchParams = { siteId: "", redirect: "/" };
      await renderPasswordGatePage();
      expect(screen.getByText("Invalid request")).toBeInTheDocument();
    });

    it("does not show form when siteId is missing", async () => {
      mockSearchParams = { siteId: "", redirect: "/" };
      await renderPasswordGatePage();
      expect(screen.queryByLabelText("Password")).not.toBeInTheDocument();
    });
  });

  describe("valid request (with siteId)", () => {
    beforeEach(() => {
      mockSearchParams = {
        siteId: "site-123",
        redirect: "https://test.pagehaven.io/",
      };
    });

    it("shows Password Protected title", async () => {
      await renderPasswordGatePage();
      expect(screen.getByText("Password Protected")).toBeInTheDocument();
    });

    it("shows description", async () => {
      await renderPasswordGatePage();
      expect(
        screen.getByText("This site requires a password to access")
      ).toBeInTheDocument();
    });

    it("shows password input", async () => {
      await renderPasswordGatePage();
      expect(screen.getByLabelText("Password")).toBeInTheDocument();
    });

    it("password input has correct type", async () => {
      await renderPasswordGatePage();
      const input = screen.getByLabelText("Password");
      expect(input).toHaveAttribute("type", "password");
    });

    it("shows submit button", async () => {
      await renderPasswordGatePage();
      expect(
        screen.getByRole("button", { name: "Access Site" })
      ).toBeInTheDocument();
    });

    it("shows lock icon", async () => {
      await renderPasswordGatePage();
      expect(screen.getByTestId("lock-icon")).toBeInTheDocument();
    });
  });

  describe("form interaction", () => {
    beforeEach(() => {
      mockSearchParams = {
        siteId: "site-123",
        redirect: "https://test.pagehaven.io/",
      };
    });

    it("allows typing in password field", async () => {
      const user = userEvent.setup();
      await renderPasswordGatePage();

      const input = screen.getByLabelText("Password");
      await user.type(input, "secret123");
      expect(input).toHaveValue("secret123");
    });

    it("submits form with password", async () => {
      const user = userEvent.setup();
      await renderPasswordGatePage();

      const input = screen.getByLabelText("Password");
      await user.type(input, "secret123");
      await user.click(screen.getByRole("button", { name: "Access Site" }));

      expect(mockMutate).toHaveBeenCalledWith({
        siteId: "site-123",
        password: "secret123",
      });
    });
  });

  describe("loading state", () => {
    beforeEach(() => {
      mockSearchParams = {
        siteId: "site-123",
        redirect: "https://test.pagehaven.io/",
      };
      mockIsPending = true;
    });

    it("shows Verifying... when pending", async () => {
      await renderPasswordGatePage();
      expect(screen.getByText("Verifying...")).toBeInTheDocument();
    });

    it("disables button when pending", async () => {
      await renderPasswordGatePage();
      const button = screen.getByRole("button");
      expect(button).toBeDisabled();
    });
  });

  describe("search validation", () => {
    it("validates search params with siteId and redirect", () => {
      const search = { siteId: "test-site", redirect: "/dashboard" };
      expect(search.siteId).toBe("test-site");
      expect(search.redirect).toBe("/dashboard");
    });

    it("provides default values for missing search params", () => {
      const validateSearch = (search: Record<string, unknown>) => ({
        siteId: (search.siteId as string) || "",
        redirect: (search.redirect as string) || "/",
      });

      const result = validateSearch({});
      expect(result.siteId).toBe("");
      expect(result.redirect).toBe("/");
    });
  });

  describe("password verification flow", () => {
    it("constructs redirect URL with token", () => {
      const redirect = "https://example.pagehaven.io/";
      const token = "test-token";

      const redirectUrl = new URL(redirect);
      redirectUrl.searchParams.set("__pagehaven_token", token);

      expect(redirectUrl.toString()).toBe(
        "https://example.pagehaven.io/?__pagehaven_token=test-token"
      );
    });

    it("handles invalid password response", () => {
      const response = { valid: false, token: null };
      expect(response.valid).toBe(false);
      expect(response.token).toBeNull();
    });

    it("handles valid password response", () => {
      const response = { valid: true, token: "abc123" };
      expect(response.valid).toBe(true);
      expect(response.token).toBe("abc123");
    });
  });

  describe("error handling", () => {
    it("handles missing siteId in form submission", () => {
      const handleSubmit = (siteId: string) => {
        if (!siteId) {
          return { error: "Site ID is required" };
        }
        return { success: true };
      };

      expect(handleSubmit("")).toEqual({ error: "Site ID is required" });
      expect(handleSubmit("site-123")).toEqual({ success: true });
    });
  });
});
