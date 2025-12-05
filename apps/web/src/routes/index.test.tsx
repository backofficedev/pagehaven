import { render, screen } from "@testing-library/react";
import type React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock state for dynamic control
let mockHealthCheckData: { status: string } | null = null;
let mockIsLoading = false;

// Mock dependencies
vi.mock("@tanstack/react-router", () => ({
  createFileRoute: (_path: string) => (options: unknown) => {
    const opts = options as { component: React.ComponentType };
    return { ...opts };
  },
}));

vi.mock("@tanstack/react-query", () => ({
  useQuery: () => ({
    data: mockHealthCheckData,
    isLoading: mockIsLoading,
  }),
}));

vi.mock("@/utils/orpc", () => ({
  orpc: {
    healthCheck: {
      queryOptions: () => ({
        queryKey: ["healthCheck"],
        queryFn: () => Promise.resolve({ status: "ok" }),
      }),
    },
  },
}));

// Helper to render the actual component
async function renderHomeComponent() {
  const module = await import("./index");
  const route = module.Route as unknown as { component: React.ComponentType };
  const HomeComponent = route.component;
  return render(<HomeComponent />);
}

describe("index route", () => {
  beforeEach(() => {
    mockHealthCheckData = null;
    mockIsLoading = false;
  });

  describe("Route export", () => {
    it("exports Route", async () => {
      const module = await import("./index");
      expect(module.Route).toBeDefined();
    });
  });

  describe("page rendering", () => {
    it("displays pagehaven ASCII title", async () => {
      await renderHomeComponent();
      // The ASCII art is rendered in a pre element with box-drawing characters
      const preElement = document.querySelector("pre");
      expect(preElement).toBeInTheDocument();
      // Check that it contains box-drawing characters (the ASCII art)
      expect(preElement?.textContent).toContain("██");
    });

    it("displays API Status section", async () => {
      await renderHomeComponent();
      expect(screen.getByText("API Status")).toBeInTheDocument();
    });
  });

  describe("health check states", () => {
    it("shows Checking... when loading", async () => {
      mockIsLoading = true;
      mockHealthCheckData = null;
      await renderHomeComponent();
      expect(screen.getByText("Checking...")).toBeInTheDocument();
    });

    it("shows Connected when health check succeeds", async () => {
      mockIsLoading = false;
      mockHealthCheckData = { status: "ok" };
      await renderHomeComponent();
      expect(screen.getByText("Connected")).toBeInTheDocument();
    });

    it("shows Disconnected when health check fails", async () => {
      mockIsLoading = false;
      mockHealthCheckData = null;
      await renderHomeComponent();
      expect(screen.getByText("Disconnected")).toBeInTheDocument();
    });
  });

  describe("status indicator", () => {
    it("shows green indicator when connected", async () => {
      mockIsLoading = false;
      mockHealthCheckData = { status: "ok" };
      await renderHomeComponent();

      const indicator = document.querySelector(".bg-green-500");
      expect(indicator).toBeInTheDocument();
    });

    it("shows red indicator when disconnected", async () => {
      mockIsLoading = false;
      mockHealthCheckData = null;
      await renderHomeComponent();

      const indicator = document.querySelector(".bg-red-500");
      expect(indicator).toBeInTheDocument();
    });
  });
});
