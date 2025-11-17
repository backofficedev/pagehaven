import { ClientOnly } from "./ClientOnly";
import { lazy, Suspense } from "react";

// Lazy load the WorkOS widget to avoid SSR issues
const OrganizationSwitcherLazy = lazy(async () => {
	const widgets = await import("@workos-inc/widgets");

	return {
		default: ({ widgetToken }: { widgetToken: string }) => {
			return (
				<widgets.WorkOsWidgets>
					<widgets.OrganizationSwitcher
						authToken={() => Promise.resolve(widgetToken)}
						switchToOrganization={({ organizationId }: { organizationId: string }) => {
							// TODO: Handle organization switching
							console.log("Switching to organization:", organizationId);
							window.location.reload();
						}}
					>
						<button
							type="button"
							onClick={() => {
								// Redirect to site creation page
								window.location.href = "/tenants/create";
							}}
							className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
						>
							Create New Site
						</button>
					</widgets.OrganizationSwitcher>
				</widgets.WorkOsWidgets>
			);
		},
	};
});

/**
 * TenantSwitcher (SiteSwitcher) - Uses WorkOS OrganizationSwitcher widget
 * Maps PageHaven sites to WorkOS Organizations
 * Note: Must be wrapped in ClientOnly since WorkOS widgets are client-only
 */
export function TenantSwitcher({ widgetToken }: { widgetToken: string }) {
	return (
		<ClientOnly fallback={<div className="h-9 w-32 bg-gray-200 animate-pulse rounded-md" />}>
			<Suspense fallback={<div className="h-9 w-32 bg-gray-200 animate-pulse rounded-md" />}>
				<OrganizationSwitcherLazy widgetToken={widgetToken} />
			</Suspense>
		</ClientOnly>
	);
}
