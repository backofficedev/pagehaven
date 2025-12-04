import type { RenderOptions } from "@testing-library/react";
import { render } from "@testing-library/react";
import type { ReactElement, ReactNode } from "react";

// Wrapper component for providers
function AllProviders({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

// Custom render function that includes providers
function customRender(
  ui: ReactElement,
  options?: Omit<RenderOptions, "wrapper">
) {
  return render(ui, { wrapper: AllProviders, ...options });
}

// biome-ignore lint/performance/noBarrelFile: Test utilities need to re-export testing-library
export * from "@testing-library/react";
export { customRender as render };
