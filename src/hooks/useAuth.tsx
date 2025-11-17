import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getAuthData } from "../authkit/serverFunctions";
import type { AuthUser } from "../authkit/serverFunctions";

export interface AuthData {
	user: AuthUser | null;
	signInUrl: string;
	widgetToken: string | null;
}

/**
 * Hook to access cached authentication data.
 * This uses React Query to cache auth state client-side, preventing
 * server calls on every navigation.
 *
 * The cache is:
 * - Populated on initial app load via __root.tsx beforeLoad
 * - Invalidated on login/logout
 * - Refetched only when stale (5 minutes) or manually invalidated
 */
export function useAuth(): {
	user: AuthUser | null;
	signInUrl: string;
	widgetToken: string | null;
	isLoading: boolean;
} {
	const { data: authData = { user: null, signInUrl: "#", widgetToken: null }, isLoading } = useQuery<AuthData>({
		queryKey: ["auth"],
		queryFn: () => getAuthData({}),
		staleTime: 5 * 60 * 1000, // 5 minutes - data stays fresh
		gcTime: 10 * 60 * 1000, // 10 minutes - keep in cache
		refetchOnMount: false, // Don't refetch if data exists
		refetchOnWindowFocus: false, // Don't refetch on window focus
	});

	return {
		user: authData.user,
		signInUrl: authData.signInUrl,
		widgetToken: authData.widgetToken,
		isLoading,
	};
}

/**
 * Hook to invalidate and refetch auth data.
 * Use this after login, logout, or when you need to refresh auth state.
 */
export function useInvalidateAuth() {
	const queryClient = useQueryClient();

	return () => {
		queryClient.invalidateQueries({ queryKey: ["auth"] });
	};
}

