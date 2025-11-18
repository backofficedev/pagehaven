import { createRouter } from '@tanstack/react-router';
import { ConvexQueryClient } from '@convex-dev/react-query';
import { QueryClient } from '@tanstack/react-query';
import { setupRouterSsrQueryIntegration } from '@tanstack/react-router-ssr-query';
import { ConvexProviderWithAuth, ConvexReactClient } from 'convex/react';
import { AuthKitProvider, useAccessToken, useAuth } from '@workos/authkit-tanstack-react-start/client';
import { useCallback, useMemo, useEffect, useState } from 'react';
import type React from 'react';
import { routeTree } from './routeTree.gen';

export function getRouter() {
  const CONVEX_URL = (import.meta as any).env.VITE_CONVEX_URL!;
  if (!CONVEX_URL) {
    throw new Error('missing VITE_CONVEX_URL env var');
  }
  const convex = new ConvexReactClient(CONVEX_URL);
  const convexQueryClient = new ConvexQueryClient(convex);

  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        queryKeyHashFn: convexQueryClient.hashFn(),
        queryFn: convexQueryClient.queryFn(),
        gcTime: 5000,
      },
    },
  });
  convexQueryClient.connect(queryClient);

  const router = createRouter({
    routeTree,
    defaultPreload: 'intent',
    scrollRestoration: true,
    defaultPreloadStaleTime: 0, // Let React Query handle all caching
    defaultErrorComponent: (err) => <p>{err.error.stack}</p>,
    defaultNotFoundComponent: () => <p>not found</p>,
    context: { queryClient, convexClient: convex, convexQueryClient },
    Wrap: ({ children }) => (
      <ProvidersWrapper convexClient={convex}>{children}</ProvidersWrapper>
    ),
  });
  setupRouterSsrQueryIntegration({ router, queryClient });

  return router;
}

function ProvidersWrapper({
  convexClient,
  children,
}: {
  convexClient: ConvexReactClient;
  children: React.ReactNode;
}) {
  // Delay AuthKitProvider render to ensure RouterProvider is available
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    // Render without AuthKitProvider initially to avoid useRouter warning
    return <ConvexProviderWithAuth client={convexClient} useAuth={() => ({ isLoading: true, isAuthenticated: false, fetchAccessToken: async () => null })}>{children}</ConvexProviderWithAuth>;
  }

  return (
    <AuthKitProvider>
      <ConvexAuthWrapper client={convexClient}>{children}</ConvexAuthWrapper>
    </AuthKitProvider>
  );
}

function ConvexAuthWrapper({
  client,
  children,
}: {
  client: ConvexReactClient;
  children: React.ReactNode;
}) {
  const auth = useAuthFromWorkOS();
  return <ConvexProviderWithAuth client={client} useAuth={() => auth}>{children}</ConvexProviderWithAuth>;
}

function useAuthFromWorkOS() {
  const { loading, user } = useAuth();
  const { accessToken, getAccessToken } = useAccessToken();

  const fetchAccessToken = useCallback(
    async ({ forceRefreshToken }: { forceRefreshToken: boolean }) => {
      if (!accessToken || forceRefreshToken) {
        return (await getAccessToken()) ?? null;
      }

      return accessToken;
    },
    [accessToken, getAccessToken],
  );

  return useMemo(
    () => ({
      isLoading: loading,
      isAuthenticated: !!user,
      fetchAccessToken,
    }),
    [loading, user, fetchAccessToken],
  );
}
