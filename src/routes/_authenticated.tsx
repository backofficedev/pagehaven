import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated")({
	beforeLoad: async ({ context }) => {
		// Use cached auth data from React Query instead of making server calls
		// This follows best practices: reference client-side state, don't call server on every navigation
		const authData = context.queryClient.getQueryData<{
			user: { id: string } | null;
			signInUrl: string;
			widgetToken: string | null;
		}>(["auth"]);

		// If no cached data, fetch it (only happens on initial load or if cache was cleared)
		if (!authData) {
			const { getAuthData } = await import("../authkit/serverFunctions");
			const fetched = await getAuthData({});
			context.queryClient.setQueryData(["auth"], fetched);
			
			if (!fetched.user) {
				throw redirect({ to: fetched.signInUrl as "/" });
			}
			return { user: fetched.user };
		}

		// Use cached data - no server call!
		if (!authData.user) {
			throw redirect({ to: authData.signInUrl as "/" });
		}

		return { user: authData.user };
	},
	component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
	return <Outlet />;
}
