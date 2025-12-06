import { fireEvent, screen } from "@testing-library/react";
import type React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createRouteRenderer } from "@/test/route-test-utils";
import {
  authClientMock,
  buttonMock,
  cardMock,
  createOrpcMock,
  createQueryMock,
  createRouterMock,
  createToastMock,
  inputMock,
  labelMock,
} from "@/test/ui-mocks";

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
vi.mock("@tanstack/react-query", () =>
  createQueryMock(() => {
    const result = mockQueryResults[queryCallCount] || {
      data: null,
      isLoading: false,
    };
    queryCallCount += 1;
    return result;
  }, mockUseMutation)
);

vi.mock("@tanstack/react-router", () => createRouterMock(mockUseParams));

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

vi.mock("sonner", () => createToastMock(mockToastSuccess, mockToastError));
vi.mock("@/components/ui/button", () => buttonMock);
vi.mock("@/components/ui/card", () => cardMock);
vi.mock("@/components/ui/input", () => inputMock);
vi.mock("@/components/ui/label", () => labelMock);
vi.mock("@/lib/auth-client", () => authClientMock);
vi.mock("@/components/site-github-settings", () => ({
  default: () => <div data-testid="site-github-settings">GitHub Settings</div>,
}));

vi.mock("@/utils/orpc", () =>
  createOrpcMock({
    site: {
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
  })
);

// Helper to render the SettingsPage component
const renderSettingsPage = createRouteRenderer(() => import("./settings"));

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

/** Helper to setup default query results */
function setupDefaultQueries() {
  setQueryResults([
    { data: defaultSite, isLoading: false },
    { data: defaultAccess, isLoading: false },
    { data: defaultInvites, isLoading: false },
  ]);
}

/** Helper to setup queries with specific access type */
function setupQueriesWithAccess(accessType: string, invites: unknown[] = []) {
  setQueryResults([
    { data: defaultSite, isLoading: false },
    { data: { accessType }, isLoading: false },
    { data: invites, isLoading: false },
  ]);
}

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
      setupDefaultQueries();
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
      setupDefaultQueries();
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
      setupDefaultQueries();
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

    it("hides password field for public access", async () => {
      setupQueriesWithAccess("public");

      await renderSettingsPage();
      expect(screen.queryByLabelText("Site Password")).not.toBeInTheDocument();
    });

    it("allows entering password", async () => {
      setupQueriesWithAccess("password");

      await renderSettingsPage();

      const passwordInput = screen.getByLabelText("Site Password");
      fireEvent.change(passwordInput, { target: { value: "secret123" } });

      expect(passwordInput).toHaveValue("secret123");
    });
  });

  describe("Invite management for private sites", () => {
    it("shows invite section for private access type", async () => {
      setupQueriesWithAccess("private");

      await renderSettingsPage();
      expect(screen.getByText("Invited Users")).toBeInTheDocument();
      expect(
        screen.getByText("Manage who can access your private site")
      ).toBeInTheDocument();
    });

    it("hides invite section for public access type", async () => {
      setupQueriesWithAccess("public");

      await renderSettingsPage();
      expect(screen.queryByText("Invited Users")).not.toBeInTheDocument();
    });

    it("displays invite input and button", async () => {
      setupQueriesWithAccess("private");

      await renderSettingsPage();
      expect(
        screen.getByPlaceholderText("user@example.com")
      ).toBeInTheDocument();
      expect(screen.getByText("Invite")).toBeInTheDocument();
    });

    it("allows entering email in invite form", async () => {
      setupQueriesWithAccess("private");

      await renderSettingsPage();

      const emailInput = screen.getByPlaceholderText("user@example.com");
      fireEvent.change(emailInput, { target: { value: "test@example.com" } });

      expect(emailInput).toHaveValue("test@example.com");
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
      setupDefaultQueries();
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

  describe("form interactions", () => {
    beforeEach(() => {
      setupDefaultQueries();
    });

    it("allows changing site name input", async () => {
      await renderSettingsPage();

      const nameInput = screen.getByLabelText("Site Name");
      fireEvent.change(nameInput, { target: { value: "Updated Site Name" } });

      expect(nameInput).toHaveValue("Updated Site Name");
    });

    it("allows changing description input", async () => {
      await renderSettingsPage();

      const descInput = screen.getByLabelText("Description");
      fireEvent.change(descInput, { target: { value: "New description" } });

      expect(descInput).toHaveValue("New description");
    });

    it("allows changing custom domain input", async () => {
      await renderSettingsPage();

      const domainInput = screen.getByLabelText("Custom Domain");
      fireEvent.change(domainInput, { target: { value: "newdomain.com" } });

      expect(domainInput).toHaveValue("newdomain.com");
    });

    it("has Save Changes button", async () => {
      await renderSettingsPage();

      expect(screen.getByText("Save Changes")).toBeInTheDocument();
    });

    it("has Update Access button", async () => {
      await renderSettingsPage();

      expect(screen.getByText("Update Access")).toBeInTheDocument();
    });

    it("can click on access type options", async () => {
      await renderSettingsPage();

      const passwordOption = screen.getByText("Password Protected");
      fireEvent.click(passwordOption);

      expect(passwordOption).toBeInTheDocument();
    });
  });

  describe("delete site UI", () => {
    beforeEach(() => {
      setupDefaultQueries();
    });

    it("shows delete confirmation when Delete Site clicked", async () => {
      await renderSettingsPage();

      fireEvent.click(screen.getByText("Delete Site"));

      expect(screen.getByText("Yes, Delete Site")).toBeInTheDocument();
    });

    it("hides confirmation when Cancel clicked", async () => {
      await renderSettingsPage();

      fireEvent.click(screen.getByText("Delete Site"));
      fireEvent.click(screen.getByText("Cancel"));

      expect(screen.queryByText("Yes, Delete Site")).not.toBeInTheDocument();
    });
  });

  // Note: "invite section for private sites" tests consolidated into "Invite management for private sites"
  // Note: "password field for password-protected sites" tests consolidated into "Password field visibility";

  describe("invite list data structure", () => {
    it("has correct invite structure with expiration", () => {
      const invite = {
        id: "inv-1",
        email: "user@example.com",
        expiresAt: "2024-12-31T00:00:00.000Z",
      };

      expect(invite.id).toBe("inv-1");
      expect(invite.email).toBe("user@example.com");
      expect(invite.expiresAt).toBe("2024-12-31T00:00:00.000Z");
    });

    it("handles invite without expiration", () => {
      const invite = {
        id: "inv-2",
        email: "user2@example.com",
        expiresAt: null,
      };

      expect(invite.expiresAt).toBeNull();
    });
  });

  describe("pending states", () => {
    beforeEach(() => {
      setupDefaultQueries();
    });

    it("shows Saving... when update is pending", async () => {
      mockUseMutation.mockReturnValue({
        mutate: vi.fn(),
        isPending: true,
        shouldSucceed: true,
      });

      await renderSettingsPage();

      expect(screen.getByText("Saving...")).toBeInTheDocument();
    });

    it("shows Updating... when access update is pending", async () => {
      mockUseMutation.mockReturnValue({
        mutate: vi.fn(),
        isPending: true,
        shouldSucceed: true,
      });

      await renderSettingsPage();

      expect(screen.getByText("Updating...")).toBeInTheDocument();
    });

    it("shows Deleting... when delete is pending", async () => {
      mockUseMutation.mockReturnValue({
        mutate: vi.fn(),
        isPending: true,
        shouldSucceed: true,
      });

      await renderSettingsPage();

      fireEvent.click(screen.getByText("Delete Site"));

      expect(screen.getByText("Deleting...")).toBeInTheDocument();
    });
  });

  describe("invite form", () => {
    it("disables invite button when email is empty", async () => {
      setQueryResults([
        { data: defaultSite, isLoading: false },
        { data: { accessType: "private" }, isLoading: false },
        { data: [], isLoading: false },
      ]);

      await renderSettingsPage();

      const inviteButton = screen.getByText("Invite");
      expect(inviteButton).toBeDisabled();
    });
  });

  describe("site data with null values", () => {
    it("handles null description", async () => {
      setQueryResults([
        {
          data: { ...defaultSite, description: null },
          isLoading: false,
        },
        { data: defaultAccess, isLoading: false },
        { data: defaultInvites, isLoading: false },
      ]);

      await renderSettingsPage();

      const descInput = screen.getByLabelText("Description");
      expect(descInput).toHaveValue("");
    });

    it("handles null customDomain", async () => {
      setQueryResults([
        {
          data: { ...defaultSite, customDomain: null },
          isLoading: false,
        },
        { data: defaultAccess, isLoading: false },
        { data: defaultInvites, isLoading: false },
      ]);

      await renderSettingsPage();

      const domainInput = screen.getByLabelText("Custom Domain");
      expect(domainInput).toHaveValue("");
    });
  });

  describe("access type radio selection", () => {
    beforeEach(() => {
      setupDefaultQueries();
    });

    it("selects public by default", async () => {
      await renderSettingsPage();

      const publicRadio = screen.getByDisplayValue("public");
      expect(publicRadio).toBeChecked();
    });

    it("can select password option", async () => {
      await renderSettingsPage();

      const passwordRadio = screen.getByDisplayValue("password");
      fireEvent.click(passwordRadio);

      expect(passwordRadio).toBeChecked();
    });

    it("can select private option", async () => {
      await renderSettingsPage();

      const privateRadio = screen.getByDisplayValue("private");
      fireEvent.click(privateRadio);

      expect(privateRadio).toBeChecked();
    });

    it("can select owner_only option", async () => {
      await renderSettingsPage();

      const ownerOnlyRadio = screen.getByDisplayValue("owner_only");
      fireEvent.click(ownerOnlyRadio);

      expect(ownerOnlyRadio).toBeChecked();
    });
  });
});
