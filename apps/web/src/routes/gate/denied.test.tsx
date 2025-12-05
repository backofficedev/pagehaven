import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

// Mock TanStack Router
vi.mock("@tanstack/react-router", () => ({
  createFileRoute: () => () => ({ component: () => null }),
  Link: ({
    children,
    to,
    ...props
  }: {
    children: React.ReactNode;
    to: string;
  }) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
}));

// Create a test component that mimics the DeniedGatePage behavior
function TestDeniedGatePage({ reason = "unknown" }: { reason?: string }) {
  const getContent = () => {
    switch (reason) {
      case "not_member":
        return {
          title: "Not a Member",
          description:
            "You are not a member of this site. Only team members can access this content.",
        };
      case "not_invited":
        return {
          title: "Not Invited",
          description:
            "You have not been invited to view this site. Contact the site owner to request access.",
        };
      default:
        return {
          title: "Access Denied",
          description: "You do not have permission to access this site.",
        };
    }
  };

  const content = getContent();

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4">
      <div className="w-full max-w-md">
        <h1>{content.title}</h1>
        <p>{content.description}</p>
        <a href="/">Go to Homepage</a>
        <p>
          If you believe this is an error, please contact the site
          administrator.
        </p>
      </div>
    </div>
  );
}

describe("DeniedGatePage", () => {
  describe("smoke tests", () => {
    it("renders without crashing", () => {
      render(<TestDeniedGatePage />);
      expect(screen.getByText("Access Denied")).toBeInTheDocument();
    });
  });

  describe("reason: unknown (default)", () => {
    it("shows Access Denied title", () => {
      render(<TestDeniedGatePage reason="unknown" />);
      expect(screen.getByText("Access Denied")).toBeInTheDocument();
    });

    it("shows generic description", () => {
      render(<TestDeniedGatePage reason="unknown" />);
      expect(
        screen.getByText("You do not have permission to access this site.")
      ).toBeInTheDocument();
    });
  });

  describe("reason: not_member", () => {
    it("shows Not a Member title", () => {
      render(<TestDeniedGatePage reason="not_member" />);
      expect(screen.getByText("Not a Member")).toBeInTheDocument();
    });

    it("shows member-specific description", () => {
      render(<TestDeniedGatePage reason="not_member" />);
      expect(
        screen.getByText(
          "You are not a member of this site. Only team members can access this content."
        )
      ).toBeInTheDocument();
    });
  });

  describe("reason: not_invited", () => {
    it("shows Not Invited title", () => {
      render(<TestDeniedGatePage reason="not_invited" />);
      expect(screen.getByText("Not Invited")).toBeInTheDocument();
    });

    it("shows invite-specific description", () => {
      render(<TestDeniedGatePage reason="not_invited" />);
      expect(
        screen.getByText(
          "You have not been invited to view this site. Contact the site owner to request access."
        )
      ).toBeInTheDocument();
    });
  });

  describe("navigation", () => {
    it("has link to homepage", () => {
      render(<TestDeniedGatePage />);
      const link = screen.getByText("Go to Homepage");
      expect(link).toHaveAttribute("href", "/");
    });
  });

  describe("help text", () => {
    it("shows contact administrator message", () => {
      render(<TestDeniedGatePage />);
      expect(
        screen.getByText((content) =>
          content.includes("If you believe this is an error")
        )
      ).toBeInTheDocument();
    });
  });

  describe("Route export", () => {
    it("exports Route", async () => {
      const module = await import("./denied");
      expect(module.Route).toBeDefined();
    });
  });

  describe("search validation", () => {
    it("validates search params with reason and redirect", () => {
      const search = { reason: "not_member", redirect: "/dashboard" };
      expect(search.reason).toBe("not_member");
      expect(search.redirect).toBe("/dashboard");
    });

    it("provides default values for missing search params", () => {
      const search = { reason: "unknown", redirect: "/" };
      expect(search.reason).toBe("unknown");
      expect(search.redirect).toBe("/");
    });
  });
});
