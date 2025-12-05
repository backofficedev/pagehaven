import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { RenderOptions } from "@testing-library/react";
import { render } from "@testing-library/react";
import type { ReactElement, ReactNode } from "react";
import { ThemeProvider } from "@/components/theme-provider";

/**
 * Creates a fresh QueryClient for each test to avoid shared state
 */
function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });
}

type AllProvidersProps = {
  children: ReactNode;
  queryClient?: QueryClient;
};

/**
 * Wrapper component that provides all necessary context providers for testing
 */
function AllProviders({ children, queryClient }: Readonly<AllProvidersProps>) {
  const client = queryClient ?? createTestQueryClient();

  return (
    <QueryClientProvider client={client}>
      <ThemeProvider
        attribute="class"
        defaultTheme="dark"
        disableTransitionOnChange
        storageKey="test-theme"
      >
        {children}
      </ThemeProvider>
    </QueryClientProvider>
  );
}

type CustomRenderOptions = Omit<RenderOptions, "wrapper"> & {
  queryClient?: QueryClient;
};

/**
 * Custom render function that wraps components with all necessary providers.
 * Use this instead of @testing-library/react's render for component tests.
 */
function customRender(ui: ReactElement, options?: CustomRenderOptions) {
  const { queryClient, ...renderOptions } = options ?? {};

  return render(ui, {
    wrapper: ({ children }) => (
      <AllProviders queryClient={queryClient}>{children}</AllProviders>
    ),
    ...renderOptions,
  });
}

// biome-ignore lint/performance/noBarrelFile: Test utilities need to re-export testing-library
export * from "@testing-library/react";
export { customRender as render, createTestQueryClient };
