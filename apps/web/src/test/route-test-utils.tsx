/**
 * Shared test utilities for route testing
 */
import { render } from "@testing-library/react";
import type React from "react";
import { describe, expect, it } from "vitest";

type RouteWithComponent = {
  component?: React.ComponentType;
};

/**
 * Creates a describe block that tests standard route exports
 * @param importModule - Function that imports the route module
 */
export function describeRouteExports(
  // biome-ignore lint/suspicious/noExplicitAny: TanStack Router Route types are complex and vary by route configuration
  importModule: () => Promise<{ Route: any }>
) {
  describe("Route export", () => {
    it("exports Route", async () => {
      const module = await importModule();
      expect(module.Route).toBeDefined();
    });

    it("has component defined", async () => {
      const module = await importModule();
      const route = module.Route as unknown as RouteWithComponent;
      expect(route.component).toBeDefined();
    });
  });
}

/**
 * Creates a render function for a route module.
 * Use this to reduce boilerplate in route tests.
 * @param importPath - Function that imports the route module
 */
export function createRouteRenderer(
  // biome-ignore lint/suspicious/noExplicitAny: TanStack Router Route types are complex
  importModule: () => Promise<{ Route: any }>
) {
  return async function renderRoutePage() {
    const module = await importModule();
    const route = module.Route as unknown as { component: React.ComponentType };
    const PageComponent = route.component;
    return render(<PageComponent />);
  };
}
