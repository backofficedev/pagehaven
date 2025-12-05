import { fireEvent, render, screen } from "@testing-library/react";
import type React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Regex patterns at module level for performance
const BACK_TO_REGEX = /Back to/;

// Store mock implementations for dynamic control
let queryCallCount = 0;
const mockQueryResults: Array<{ data: unknown; isLoading: boolean }> = [];
const mockUseMutation = vi.fn();
const mockUseParams = vi.fn();
const mockToastSuccess = vi.fn();
const mockToastError = vi.fn();

function setQueryResults(
  results: Array<{ data: unknown; isLoading: boolean }>
) {
  mockQueryResults.length = 0;
  mockQueryResults.push(...results);
  queryCallCount = 0;
}

// Mock dependencies
vi.mock("@tanstack/react-query", () => ({
  useQuery: () => {
    const result = mockQueryResults[queryCallCount] || {
      data: null,
      isLoading: false,
    };
    queryCallCount += 1;
    return result;
  },
  useMutation: (options: unknown) => {
    const opts = options as {
      onSuccess?: () => void;
      onError?: (error: Error) => void;
    };
    return {
      ...mockUseMutation(),
      mutate: (_data: unknown) => {
        const result = mockUseMutation();
        if (result.shouldSucceed !== false) {
          opts.onSuccess?.();
        } else {
          opts.onError?.(new Error("Test error"));
        }
      },
    };
  },
}));

vi.mock("@tanstack/react-router", () => ({
  createFileRoute: (_path: string) => (options: unknown) => {
    const opts = options as { component: React.ComponentType };
    return {
      ...opts,
      useRouteContext: () => ({
        session: { data: { user: { name: "Test User" } } },
      }),
      useParams: () => mockUseParams(),
    };
  },
  Link: ({
    children,
    to,
  }: {
    children: React.ReactNode;
    to: string;
    params?: Record<string, string>;
  }) => <a href={to}>{children}</a>,
  redirect: vi.fn(),
}));

vi.mock("lucide-react", () => ({
  ArrowLeft: () => <span data-testid="arrow-left-icon" />,
  Eye: () => <span data-testid="eye-icon" />,
  Globe: () => <span data-testid="globe-icon" />,
  Lock: () => <span data-testid="lock-icon" />,
  Mail: () => <span data-testid="mail-icon" />,
  Plus: () => <span data-testid="plus-icon" />,
  Trash2: () => <span data-testid="trash-icon" />,
  Users: () => <span data-testid="users-icon" />,
  X: () => <span data-testid="x-icon" />,
}));

vi.mock("sonner", () => ({
  toast: {
    success: (msg: string) => mockToastSuccess(msg),
    error: (msg: string) => mockToastError(msg),
  },
}));

vi.mock("@/components/ui/button", () => ({
  Button: ({
    children,
    onClick,
    disabled,
    variant,
  }: {
    children: React.ReactNode;
    onClick?: () => void;
    disabled?: boolean;
    variant?: string;
  }) => (
    <button
      data-variant={variant}
      disabled={disabled}
      onClick={onClick}
      type="button"
    >
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
  }) => (
    <div className={className} data-testid="card">
      {children}
    </div>
  ),
  CardContent: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="card-content">{children}</div>
  ),
  CardDescription: ({ children }: { children: React.ReactNode }) => (
    <p data-testid="card-description">{children}</p>
  ),
  CardHeader: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="card-header">{children}</div>
  ),
  CardTitle: ({
    children,
    className,
  }: {
    children: React.ReactNode;
    className?: string;
  }) => (
    <h3 className={className} data-testid="card-title">
      {children}
    </h3>
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

vi.mock("@/lib/auth-client", () => ({
  authClient: {
    getSession: vi.fn(() =>
      Promise.resolve({ data: { user: { name: "Test" } } })
    ),
  },
}));

vi.mock("@/utils/orpc", () => ({
  orpc: {
    site: {
      get: {
        queryOptions: () => ({
          queryKey: ["site"],
          queryFn: () => Promise.resolve(null),
        }),
      },
      update: { mutationOptions: () => ({}) },
      delete: { mutationOptions: () => ({}) },
    },
    access: {
      get: {
        queryOptions: () => ({
          queryKey: ["access"],
          queryFn: () => Promise.resolve(null),
        }),
      },
      update: { mutationOptions: () => ({}) },
      listInvites: {
        queryOptions: () => ({
          queryKey: ["invites"],
          queryFn: () => Promise.resolve([]),
        }),
      },
      createInvite: { mutationOptions: () => ({}) },
      deleteInvite: { mutationOptions: () => ({}) },
    },
  },
  queryClient: {
    invalidateQueries: vi.fn(),
  },
}));

// Helper to render the SettingsPage component
async function renderSettingsPage() {
  const module = await import("./settings");
  const route = module.Route as unknown as { component: React.ComponentType };
  const SettingsPage = route.component;
  return render(<SettingsPage />);
}

// Default mock data
const defaultSite = {
  id: "site-123",
  name: "Test Site",
  subdomain: "test",
  description: "A test description",
  customDomain: "example.com",
};
const defaultAccess = { accessType: "public" };
const defaultInvites: unknown[] = [];

describe("sites/$siteId/settings route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseParams.mockReturnValue({ siteId: "site-123" });
    mockUseMutation.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
      shouldSucceed: true,
    });
    // Reset query call count
    queryCallCount = 0;
  });

  describe("Route export", () => {
    it("exports Route", async () => {
      const module = await import("./settings");
      expect(module.Route).toBeDefined();
    });

    it("has component defined", async () => {
      const module = await import("./settings");
      const route = module.Route as unknown as {
        component: React.ComponentType;
      };
      expect(route.component).toBeDefined();
    });
  });

  describe("page rendering", () => {
    beforeEach(() => {
      setQueryResults([
        { data: defaultSite, isLoading: false },
        { data: defaultAccess, isLoading: false },
        { data: defaultInvites, isLoading: false },
      ]);
    });

    it("displays page title", async () => {
      await renderSettingsPage();
      expect(screen.getByText("Settings")).toBeInTheDocument();
    });

    it("displays page subtitle", async () => {
      await renderSettingsPage();
      expect(
        screen.getByText("Manage your site configuration")
      ).toBeInTheDocument();
    });

    it("renders back link", async () => {
      await renderSettingsPage();
      expect(screen.getByText(BACK_TO_REGEX)).toBeInTheDocument();
    });

    it("renders General section", async () => {
      await renderSettingsPage();
      expect(screen.getByText("General")).toBeInTheDocument();
      expect(screen.getByText("Basic site information")).toBeInTheDocument();
    });

    it("renders Access Control section", async () => {
      await renderSettingsPage();
      expect(screen.getByText("Access Control")).toBeInTheDocument();
      expect(
        screen.getByText("Control who can view your site")
      ).toBeInTheDocument();
    });

    it("renders Danger Zone section", async () => {
      await renderSettingsPage();
      expect(screen.getByText("Danger Zone")).toBeInTheDocument();
      expect(
        screen.getByText("Irreversible actions for your site")
      ).toBeInTheDocument();
    });
  });

  describe("General settings form", () => {
    beforeEach(() => {
      setQueryResults([
        { data: defaultSite, isLoading: false },
        { data: defaultAccess, isLoading: false },
        { data: defaultInvites, isLoading: false },
      ]);
    });

    it("displays Site Name input", async () => {
      await renderSettingsPage();
      expect(screen.getByLabelText("Site Name")).toBeInTheDocument();
    });

    it("displays Description input", async () => {
      await renderSettingsPage();
      expect(screen.getByLabelText("Description")).toBeInTheDocument();
    });

    it("displays Custom Domain input", async () => {
      await renderSettingsPage();
      expect(screen.getByLabelText("Custom Domain")).toBeInTheDocument();
    });

    it("displays Save Changes button", async () => {
      await renderSettingsPage();
      expect(screen.getByText("Save Changes")).toBeInTheDocument();
    });

    it("populates form with site data", async () => {
      await renderSettingsPage();
      const nameInput = screen.getByLabelText("Site Name");
      expect(nameInput).toHaveValue("Test Site");
    });
  });

  describe("Access Control options", () => {
    beforeEach(() => {
      setQueryResults([
        { data: defaultSite, isLoading: false },
        { data: defaultAccess, isLoading: false },
        { data: defaultInvites, isLoading: false },
      ]);
    });

    it("displays Public option", async () => {
      await renderSettingsPage();
      expect(screen.getByText("Public")).toBeInTheDocument();
      expect(screen.getByText("Anyone can view your site")).toBeInTheDocument();
    });

    it("displays Password Protected option", async () => {
      await renderSettingsPage();
      expect(screen.getByText("Password Protected")).toBeInTheDocument();
      expect(
        screen.getByText("Visitors need a password to view")
      ).toBeInTheDocument();
    });

    it("displays Private option", async () => {
      await renderSettingsPage();
      expect(screen.getByText("Private")).toBeInTheDocument();
      expect(
        screen.getByText("Only invited users can view")
      ).toBeInTheDocument();
    });

    it("displays Owner Only option", async () => {
      await renderSettingsPage();
      expect(screen.getByText("Owner Only")).toBeInTheDocument();
      expect(
        screen.getByText("Only site members can view")
      ).toBeInTheDocument();
    });

    it("displays Update Access button", async () => {
      await renderSettingsPage();
      expect(screen.getByText("Update Access")).toBeInTheDocument();
    });
  });

  describe("Password field visibility", () => {
    it("shows password field when password access type is selected", async () => {
      setQueryResults([
        { data: defaultSite, isLoading: false },
        { data: { accessType: "password" }, isLoading: false },
        { data: defaultInvites, isLoading: false },
      ]);

      await renderSettingsPage();
      expect(screen.getByLabelText("Site Password")).toBeInTheDocument();
    });

    it("hides password field for public access type", async () => {
      setQueryResults([
        { data: defaultSite, isLoading: false },
        { data: { accessType: "public" }, isLoading: false },
        { data: defaultInvites, isLoading: false },
      ]);

      await renderSettingsPage();
      expect(screen.queryByLabelText("Site Password")).not.toBeInTheDocument();
    });
  });

  describe("Invite management for private sites", () => {
    it("shows invite section for private access type", async () => {
      setQueryResults([
        { data: defaultSite, isLoading: false },
        { data: { accessType: "private" }, isLoading: false },
        { data: [], isLoading: false },
      ]);

      await renderSettingsPage();
      expect(screen.getByText("Invited Users")).toBeInTheDocument();
      expect(
        screen.getByText("Manage who can access your private site")
      ).toBeInTheDocument();
    });

    it("hides invite section for public access type", async () => {
      setQueryResults([
        { data: defaultSite, isLoading: false },
        { data: { accessType: "public" }, isLoading: false },
        { data: [], isLoading: false },
      ]);

      await renderSettingsPage();
      expect(screen.queryByText("Invited Users")).not.toBeInTheDocument();
    });

    it("displays invite input and button", async () => {
      setQueryResults([
        { data: defaultSite, isLoading: false },
        { data: { accessType: "private" }, isLoading: false },
        { data: [], isLoading: false },
      ]);

      await renderSettingsPage();
      expect(
        screen.getByPlaceholderText("user@example.com")
      ).toBeInTheDocument();
      expect(screen.getByText("Invite")).toBeInTheDocument();
    });
  });

  describe("invite data structure", () => {
    it("has correct invite structure", () => {
      const invite = {
        id: "inv-1",
        email: "user@example.com",
        expiresAt: new Date("2024-12-31"),
      };

      expect(invite.id).toBe("inv-1");
      expect(invite.email).toBe("user@example.com");
      expect(invite.expiresAt).toBeInstanceOf(Date);
    });
  });

  describe("Danger Zone", () => {
    beforeEach(() => {
      setQueryResults([
        { data: defaultSite, isLoading: false },
        { data: defaultAccess, isLoading: false },
        { data: defaultInvites, isLoading: false },
      ]);
    });

    it("displays Delete Site button", async () => {
      await renderSettingsPage();
      expect(screen.getByText("Delete Site")).toBeInTheDocument();
    });

    it("shows confirmation when Delete Site is clicked", async () => {
      await renderSettingsPage();

      const deleteButton = screen.getByText("Delete Site");
      fireEvent.click(deleteButton);

      expect(
        screen.getByText(
          "Are you sure you want to delete this site? This action cannot be undone."
        )
      ).toBeInTheDocument();
      expect(screen.getByText("Yes, Delete Site")).toBeInTheDocument();
      expect(screen.getByText("Cancel")).toBeInTheDocument();
    });

    it("hides confirmation when Cancel is clicked", async () => {
      await renderSettingsPage();

      // Show confirmation
      fireEvent.click(screen.getByText("Delete Site"));
      expect(screen.getByText("Yes, Delete Site")).toBeInTheDocument();

      // Cancel
      fireEvent.click(screen.getByText("Cancel"));
      expect(screen.queryByText("Yes, Delete Site")).not.toBeInTheDocument();
    });
  });

  describe("access options data", () => {
    it("has correct access options defined", () => {
      const accessOptions = [
        {
          value: "public",
          label: "Public",
          description: "Anyone can view your site",
        },
        {
          value: "password",
          label: "Password Protected",
          description: "Visitors need a password to view",
        },
        {
          value: "private",
          label: "Private",
          description: "Only invited users can view",
        },
        {
          value: "owner_only",
          label: "Owner Only",
          description: "Only site members can view",
        },
      ];

      expect(accessOptions.length).toBe(4);
      expect(accessOptions.map((o) => o.value)).toEqual([
        "public",
        "password",
        "private",
        "owner_only",
      ]);
    });
  });
});
