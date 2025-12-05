/**
 * Shared UI component mocks for tests
 * Import these mock factories and use them with vi.mock
 */
import type { ComponentType, ReactNode } from "react";
import { vi } from "vitest";

/**
 * Creates a TanStack Router mock with configurable useParams.
 * The mockUseParams function is wrapped so it's called fresh each time.
 */
export function createRouterMock(mockUseParams: () => unknown) {
  return {
    createFileRoute: (_path: string) => (options: unknown) => {
      const opts = options as { component: ComponentType };
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
      children: ReactNode;
      to: string;
      params?: Record<string, string>;
    }) => <a href={to}>{children}</a>,
    redirect: vi.fn(),
  };
}

/**
 * Creates a TanStack Query mock with configurable useQuery and useMutation
 */
export function createQueryMock(
  mockUseQuery: () => unknown,
  mockUseMutation: () => { shouldSucceed?: boolean }
) {
  return {
    useQuery: () => mockUseQuery(),
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
  };
}

/**
 * Creates a base orpc mock with site.get query
 */
export function createOrpcMock(additionalMocks?: Record<string, unknown>) {
  const { site: additionalSite, ...otherMocks } = additionalMocks ?? {};
  return {
    orpc: {
      site: {
        get: {
          queryOptions: () => ({
            queryKey: ["site"],
            queryFn: () => Promise.resolve(null),
          }),
        },
        ...(additionalSite as Record<string, unknown>),
      },
      ...otherMocks,
    },
    queryClient: {
      invalidateQueries: vi.fn(),
    },
  };
}

/**
 * Creates a sonner toast mock
 */
export function createToastMock(
  mockToastSuccess: (msg: string) => void,
  mockToastError: (msg: string) => void
) {
  return {
    toast: {
      success: (msg: string) => mockToastSuccess(msg),
      error: (msg: string) => mockToastError(msg),
    },
  };
}

/**
 * Auth client mock for tests
 */
export const authClientMock = {
  authClient: {
    getSession: vi.fn(() =>
      Promise.resolve({ data: { user: { name: "Test" } } })
    ),
  },
};

/**
 * Creates an auth client mock with a custom getSession function
 */
export function createAuthClientMock(mockGetSession: () => unknown) {
  return {
    authClient: {
      getSession: () => mockGetSession(),
    },
  };
}

/**
 * Config mock for tests
 */
export const configMock = {
  config: { staticDomain: "pagehaven.io" },
  getSiteDisplayDomain: (subdomain: string) => `${subdomain}.pagehaven.io`,
};

/**
 * Simple Link mock for TanStack Router (no params)
 */
export const simpleLinkMock = {
  Link: ({ children, to }: { children: ReactNode; to: string }) => (
    <a href={to}>{children}</a>
  ),
};

/**
 * Simple toast mock with vi.fn() for success/error
 */
export const simpleToastMock = {
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
};

/**
 * Router mock with useNavigate for TanStack Router
 */
export const useNavigateMock = {
  useNavigate: vi.fn(() => vi.fn()),
};

/**
 * Creates a complete TanStack Router mock with Link and useNavigate.
 * Use for components that need both Link and navigation.
 */
export function createFullRouterMock() {
  return {
    Link: ({ children, to, ...props }: { children: ReactNode; to: string }) => (
      <a href={to} {...props}>
        {children}
      </a>
    ),
    useNavigate: vi.fn(() => vi.fn()),
    useRouter: vi.fn(() => ({
      navigate: vi.fn(),
    })),
  };
}

/**
 * Creates a component router mock for components that use Link and useNavigate
 * Used by header.test.tsx and user-menu.test.tsx
 */
export function createComponentRouterMock() {
  return {
    Link: ({ children, to, ...props }: { children: ReactNode; to: string }) => (
      <a href={to} {...props}>
        {children}
      </a>
    ),
    useNavigate: vi.fn(() => vi.fn()),
    useRouter: vi.fn(() => ({
      navigate: vi.fn(),
    })),
  };
}

type MockComponentProps = {
  children?: ReactNode;
  className?: string;
};

/**
 * Button mock factory for vi.mock
 */
export const buttonMock = {
  Button: ({
    children,
    className,
    onClick,
    disabled,
    variant,
    type,
  }: MockComponentProps & {
    onClick?: () => void;
    disabled?: boolean;
    variant?: string;
    type?: string;
  }) => (
    <button
      className={className}
      data-variant={variant}
      disabled={disabled}
      onClick={onClick}
      type={(type as "button" | "submit" | "reset") ?? "button"}
    >
      {children}
    </button>
  ),
};

/**
 * Card component mocks factory for vi.mock
 */
export const cardMock = {
  Card: ({ children, className }: MockComponentProps) => (
    <div className={className} data-testid="card">
      {children}
    </div>
  ),
  CardContent: ({ children, className }: MockComponentProps) => (
    <div className={className} data-testid="card-content">
      {children}
    </div>
  ),
  CardDescription: ({ children, className }: MockComponentProps) => (
    <p className={className} data-testid="card-description">
      {children}
    </p>
  ),
  CardHeader: ({ children, className }: MockComponentProps) => (
    <div className={className} data-testid="card-header">
      {children}
    </div>
  ),
  CardTitle: ({ children, className }: MockComponentProps) => (
    <h3 className={className} data-testid="card-title">
      {children}
    </h3>
  ),
  CardFooter: ({ children, className }: MockComponentProps) => (
    <div className={className} data-testid="card-footer">
      {children}
    </div>
  ),
};

/**
 * Skeleton mock factory for vi.mock
 */
export const skeletonMock = {
  Skeleton: ({ className }: { className?: string }) => (
    <div className={className} data-testid="skeleton" />
  ),
};

/**
 * Input mock factory for vi.mock
 */
export const inputMock = {
  Input: (props: React.InputHTMLAttributes<HTMLInputElement>) => (
    <input {...props} />
  ),
};

/**
 * Label mock factory for vi.mock
 */
export const labelMock = {
  Label: ({
    children,
    htmlFor,
  }: {
    children?: ReactNode;
    htmlFor?: string;
  }) => <label htmlFor={htmlFor}>{children}</label>,
};

/**
 * Creates a TanStack Router mock for gate pages (login/denied) that use useSearch
 */
export function createGateRouterMock(mockUseSearch: () => unknown) {
  return {
    createFileRoute: (_path: string) => (options: unknown) => {
      const opts = options as { component: ComponentType };
      return {
        ...opts,
        useSearch: mockUseSearch,
      };
    },
    Link: ({
      children,
      to,
      className,
      search,
    }: {
      children: ReactNode;
      to: string;
      className?: string;
      search?: Record<string, string>;
    }) => {
      const searchStr = search ? `?redirect=${search.redirect}` : "";
      return (
        <a className={className} href={`${to}${searchStr}`}>
          {children}
        </a>
      );
    },
  };
}

/**
 * Creates an auth session mock for components that use authClient.useSession
 */
export function createAuthSessionMock(
  mockUseSession: () => { data: unknown; isPending: boolean },
  mockSignOut?: () => void
) {
  return {
    authClient: {
      useSession: mockUseSession,
      signOut: mockSignOut ?? vi.fn(),
    },
  };
}

/**
 * Creates a next-themes mock with configurable useTheme
 */
export function createNextThemesMock(
  themeOverrides?: Partial<{
    theme: string;
    setTheme: () => void;
    themes: string[];
    systemTheme: string;
    resolvedTheme: string;
    forcedTheme: string | undefined;
  }>
) {
  return {
    useTheme: vi.fn(() => ({
      theme: "light",
      setTheme: vi.fn(),
      themes: ["light", "dark", "system"],
      systemTheme: "light",
      resolvedTheme: "light",
      forcedTheme: undefined,
      ...themeOverrides,
    })),
    ThemeProvider: ({ children }: { children: ReactNode }) => <>{children}</>,
  };
}

/**
 * Default next-themes mock for tests
 */
export const nextThemesMock = createNextThemesMock();

/**
 * Creates a mock for auth client with updateUser and changeEmail for profile tests
 */
export function createProfileAuthMock() {
  return {
    authClient: {
      updateUser: vi.fn(),
      changeEmail: vi.fn(),
    },
  };
}

/**
 * Helper to create auth callback mock implementation
 * @param shouldSucceed - Whether the callback should trigger onSuccess or onError
 * @param errorMessage - Error message to use when shouldSucceed is false
 */
export function createAuthCallbackMock(
  shouldSucceed: boolean,
  errorMessage = "Test error"
) {
  return (
    _data: unknown,
    callbacks?: {
      onSuccess?: (data: never) => void;
      onError?: (ctx: { error: { message: string } }) => void;
    }
  ) => {
    if (shouldSucceed) {
      callbacks?.onSuccess?.({} as never);
    } else {
      callbacks?.onError?.({ error: { message: errorMessage } } as never);
    }
    return Promise.resolve();
  };
}
