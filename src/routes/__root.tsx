import { Theme } from "@radix-ui/themes";
import { TanStackDevtools } from "@tanstack/react-devtools";
import {
	createRootRouteWithContext,
	HeadContent,
	Link,
	Outlet,
	Scripts,
} from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";

import { UserButton } from "../components/UserButton";
import { TenantSwitcher } from "../components/TenantSwitcher";
import TanStackQueryDevtools from "../integrations/tanstack-query/devtools";
import WorkOSProvider from "../integrations/workos/provider";

import appCss from "../styles.css?url";
import "@radix-ui/themes/styles.css";
import "@workos-inc/widgets/base.css";

import type { QueryClient } from "@tanstack/react-query";
import { getAuth, getSignInUrl, getWidgetToken } from "../authkit/serverFunctions";

interface MyRouterContext {
	queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
	beforeLoad: async () => {
		try {
			// Run all three calls in parallel for better performance
			const [authResult, signInUrl, widgetTokenResult] = await Promise.all([
				getAuth({}),
				getSignInUrl({}),
				getWidgetToken({}),
			]);
			return {
				user: authResult.user,
				signInUrl,
				widgetToken: widgetTokenResult.widgetToken,
			};
		} catch (error) {
			console.error("Error in beforeLoad:", error);
			// Return default values if there's an error
			return { user: null, signInUrl: "#", widgetToken: null };
		}
	},

	head: () => ({
		meta: [
			{
				charSet: "utf-8",
			},
			{
				name: "viewport",
				content: "width=device-width, initial-scale=1",
			},
			{
				title: "PageHaven",
			},
		],
		links: [
			{
				rel: "stylesheet",
				href: appCss,
			},
		],
	}),

	component: RootComponent,
	shellComponent: RootDocument,
	notFoundComponent: NotFound,
});

function RootComponent() {
	const { user, signInUrl, widgetToken } = Route.useRouteContext();

	return (
		<div className="min-h-screen bg-gray-50">
			<header className="bg-white shadow">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
					<Link to="/">
						<h1 className="text-2xl font-bold text-gray-900">PageHaven</h1>
					</Link>
					<div className="flex items-center gap-4">
						{user && widgetToken && <TenantSwitcher widgetToken={widgetToken} />}
						<UserButton user={user} signInUrl={signInUrl} />
					</div>
				</div>
			</header>
			<main>
				<Outlet />
			</main>
		</div>
	);
}

function RootDocument({ children }: { children: React.ReactNode }) {
	return (
		<html lang="en">
			<head>
				<HeadContent />
			</head>
			<body>
				<WorkOSProvider>
					<Theme>
						{children}
						<TanStackDevtools
							config={{
								position: "bottom-right",
							}}
							plugins={[
								{
									name: "Tanstack Router",
									render: <TanStackRouterDevtoolsPanel />,
								},
								TanStackQueryDevtools,
							]}
						/>
					</Theme>
				</WorkOSProvider>
				<Scripts />
			</body>
		</html>
	);
}

function NotFound() {
	return (
		<div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
			<div className="text-center">
				<h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
				<p className="text-xl text-gray-600 mb-8">Page not found</p>
				<a
					href="/"
					className="px-6 py-3 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
				>
					Go back home
				</a>
			</div>
		</div>
	);
}
