import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/tenants/$tenantId/")({
	loader: async ({ params }) => {
		const { getTenantDomains } = await import("../../../../db/queries");
		const domains = await getTenantDomains(params.tenantId);
		return { domains };
	},
	component: TenantOverview,
});

function TenantOverview() {
	const { tenant, isAdmin } = Route.useRouteContext();
	const { domains } = Route.useLoaderData();

	return (
		<div className="space-y-6">
			{/* Quick Stats */}
			<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
				<div className="bg-white rounded-lg shadow p-6">
					<div className="flex items-center">
						<div className="flex-shrink-0 bg-blue-100 rounded-md p-3">
							<svg
								className="h-6 w-6 text-blue-600"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
							>
								<title>Version</title>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
								/>
							</svg>
						</div>
						<div className="ml-4">
							<p className="text-sm font-medium text-gray-500">
								Current Version
							</p>
							<p className="text-2xl font-semibold text-gray-900">
								{tenant.version}
							</p>
						</div>
					</div>
				</div>

				<div className="bg-white rounded-lg shadow p-6">
					<div className="flex items-center">
						<div className="flex-shrink-0 bg-green-100 rounded-md p-3">
							<svg
								className="h-6 w-6 text-green-600"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
							>
								<title>Domains</title>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"
								/>
							</svg>
						</div>
						<div className="ml-4">
							<p className="text-sm font-medium text-gray-500">
								Active Domains
							</p>
							<p className="text-2xl font-semibold text-gray-900">
								{domains.length}
							</p>
						</div>
					</div>
				</div>

				<div className="bg-white rounded-lg shadow p-6">
					<div className="flex items-center">
						<div className="flex-shrink-0 bg-purple-100 rounded-md p-3">
							<svg
								className="h-6 w-6 text-purple-600"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
							>
								<title>Storage</title>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"
								/>
							</svg>
						</div>
						<div className="ml-4">
							<p className="text-sm font-medium text-gray-500">
								R2 Storage Path
							</p>
							<p className="text-sm font-mono text-gray-900 truncate max-w-[150px]">
								{tenant.r2Prefix}
							</p>
						</div>
					</div>
				</div>
			</div>

			{/* Deployment Status */}
			<div className="bg-white rounded-lg shadow">
				<div className="px-6 py-5 border-b border-gray-200">
					<h3 className="text-lg font-medium text-gray-900">
						Deployment Status
					</h3>
				</div>
				<div className="px-6 py-5">
					<div className="flex items-center justify-between">
						<div>
							<p className="text-sm text-gray-500">Latest Deployment</p>
							<p className="text-lg font-medium text-gray-900 mt-1">
								No deployments yet
							</p>
						</div>
						{isAdmin && (
							<button
								type="button"
								className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md"
								disabled
							>
								Deploy Content
							</button>
						)}
					</div>
					<p className="text-sm text-gray-500 mt-4">
						Content management features coming in Phase 5
					</p>
				</div>
			</div>

			{/* Primary Domain */}
			<div className="bg-white rounded-lg shadow">
				<div className="px-6 py-5 border-b border-gray-200">
					<h3 className="text-lg font-medium text-gray-900">Primary Domain</h3>
				</div>
				<div className="px-6 py-5">
					<div className="flex items-center justify-between">
						<div>
							<p className="text-lg font-medium text-gray-900">
								{tenant.slug}.myapp.com
							</p>
							<p className="text-sm text-gray-500 mt-1">
								Your default subdomain
							</p>
						</div>
						<a
							href={`https://${tenant.slug}.myapp.com`}
							target="_blank"
							rel="noopener noreferrer"
							className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
						>
							<svg
								className="mr-2 h-4 w-4"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
							>
								<title>Visit Site</title>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
								/>
							</svg>
							Visit Site
						</a>
					</div>

					{domains.length > 1 && (
						<div className="mt-4 pt-4 border-t border-gray-200">
							<p className="text-sm text-gray-700">
								{domains.length - 1} custom domain
								{domains.length - 1 === 1 ? "" : "s"} configured
							</p>
						</div>
					)}
				</div>
			</div>

			{/* Recent Activity */}
			<div className="bg-white rounded-lg shadow">
				<div className="px-6 py-5 border-b border-gray-200">
					<h3 className="text-lg font-medium text-gray-900">Recent Activity</h3>
				</div>
				<div className="px-6 py-5">
					<p className="text-sm text-gray-500">
						No recent activity. Deploy content and manage domains to see updates
						here.
					</p>
				</div>
			</div>
		</div>
	);
}
