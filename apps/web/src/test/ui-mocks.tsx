/**
 * Shared UI component mocks for tests
 * Import these mock factories and use them with vi.mock
 */
import type { ComponentType, ReactNode } from "react";
import { vi } from "vitest";

/**
 * Creates a TanStack Router mock with configurable useParams
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
        useParams: mockUseParams,
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
