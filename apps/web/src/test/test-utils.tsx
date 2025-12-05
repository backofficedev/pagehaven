import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { RenderOptions } from "@testing-library/react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactElement, ReactNode } from "react";
import { vi } from "vitest";
import { ThemeProvider } from "@/components/theme-provider";
import { TEST_CREDENTIALS } from "./fixtures";

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

/**
 * Setup userEvent and render a component in one call
 * Returns the user instance for interaction testing
 */
function renderWithUser(ui: ReactElement, options?: CustomRenderOptions) {
  const user = userEvent.setup();
  const renderResult = customRender(ui, options);
  return { user, ...renderResult };
}

/**
 * Setup auth client mock with unauthenticated state
 */
export async function setupAuthClientMock(options?: {
  isPending?: boolean;
  isAuthenticated?: boolean;
}) {
  const { authClient } = await import("@/lib/auth-client");
  vi.mocked(authClient.useSession).mockReturnValue({
    data: options?.isAuthenticated ? { user: { id: "user-1" } } : null,
    isPending: options?.isPending ?? false,
  } as ReturnType<typeof authClient.useSession>);
  return authClient;
}

/**
 * Setup auth client mock for successful auth callback
 */
export async function setupAuthSuccess() {
  const { authClient } = await import("@/lib/auth-client");
  const { toast } = await import("sonner");
  const { useNavigate } = await import("@tanstack/react-router");

  vi.mocked(authClient.useSession).mockReturnValue({
    data: null,
    isPending: false,
  } as ReturnType<typeof authClient.useSession>);

  const mockNavigate = vi.fn();
  vi.mocked(useNavigate).mockReturnValue(mockNavigate);

  return { authClient, toast, mockNavigate };
}

/**
 * Setup auth client mock for error callback
 */
export async function setupAuthError(errorMessage: string) {
  const { authClient } = await import("@/lib/auth-client");
  const { toast } = await import("sonner");

  vi.mocked(authClient.useSession).mockReturnValue({
    data: null,
    isPending: false,
  } as ReturnType<typeof authClient.useSession>);

  return { authClient, toast, errorMessage };
}

/**
 * Fill and submit a sign-in form
 */
export async function fillSignInForm(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText("Email"), TEST_CREDENTIALS.email);
  await user.type(screen.getByLabelText("Password"), TEST_CREDENTIALS.password);
  await user.click(screen.getByRole("button", { name: "Sign In" }));
}

/**
 * Fill and submit a sign-up form
 */
export async function fillSignUpForm(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText("Name"), TEST_CREDENTIALS.name);
  await user.type(screen.getByLabelText("Email"), TEST_CREDENTIALS.email);
  await user.type(screen.getByLabelText("Password"), TEST_CREDENTIALS.password);
  await user.click(screen.getByRole("button", { name: "Sign Up" }));
}

// biome-ignore lint/performance/noBarrelFile: Test utilities need to re-export testing-library
export * from "@testing-library/react";
export { customRender as render, createTestQueryClient, renderWithUser };
