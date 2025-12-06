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
 * Creates a base orpc mock with site.get and site.list queries
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
        list: {
          queryOptions: () => ({
            queryKey: ["sites"],
            queryFn: () => Promise.resolve([]),
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
 * Full TanStack Router mock with Link, useNavigate, and useRouter
 * Use this for components that need navigation functionality
 */
export const tanstackRouterMock = {
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

/**
 * Auth client mock with useSession for components
 */
export const authClientWithSessionMock = {
  authClient: {
    useSession: vi.fn(() => ({
      data: null,
      isPending: false,
    })),
    signOut: vi.fn(),
  },
};

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
 * Creates a simple useQuery mock for TanStack Query
 */
export function createSimpleQueryMock(mockUseQuery: () => unknown) {
  return {
    useQuery: () => mockUseQuery(),
  };
}

/**
 * Creates standard mock functions for route tests
 * Returns mockUseQuery and mockUseParams for use with createSimpleQueryMock and createRouterMock
 */
export function createRouteMockFns() {
  return {
    mockUseQuery: vi.fn(),
    mockUseParams: vi.fn(),
  };
}

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
 * Test fixture for a public site
 */
export const publicSiteFixture = {
  id: "site-1",
  name: "Public Site",
  subdomain: "public",
  role: "owner",
  activeDeploymentId: null,
  accessType: "public",
};
