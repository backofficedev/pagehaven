import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute(
	"/_authenticated/tenants/$tenantId/domains",
)({
	loader: async ({ params }) => {
		const { getTenantDomains } = await import("../../../../db/queries");
		const domains = await getTenantDomains(params.tenantId);
		return { domains };
	},
	component: TenantDomains,
});

function TenantDomains() {
	const { tenant, isAdmin } = Route.useRouteContext();
	const { domains } = Route.useLoaderData();

	if (!isAdmin) {
		return (
			<div className="bg-white rounded-lg shadow p-12 text-center">
				<svg
					className="mx-auto h-12 w-12 text-gray-400"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
				>
					<title>Access Denied</title>
					<path
						strokeLinecap="round"
						strokeLinejoin="round"
						strokeWidth={2}
						d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
					/>
				</svg>
				<h3 className="mt-4 text-lg font-medium text-gray-900">
					Admin Access Required
				</h3>
				<p className="mt-2 text-sm text-gray-500">
					You need admin permissions to manage domains.
				</p>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="bg-white rounded-lg shadow px-6 py-5">
				<h2 className="text-lg font-medium text-gray-900">Domain Management</h2>
				<p className="mt-1 text-sm text-gray-500">
					Configure custom domains and manage DNS settings for your tenant
				</p>
			</div>

			{/* Domains List */}
			<div className="bg-white rounded-lg shadow">
				<div className="px-6 py-5 border-b border-gray-200">
					<div className="flex items-center justify-between">
						<h3 className="text-lg font-medium text-gray-900">
							Active Domains
						</h3>
						<button
							type="button"
							className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md"
							disabled
						>
							Add Custom Domain
						</button>
					</div>
				</div>
				<div className="divide-y divide-gray-200">
					{domains.map((domain) => (
						<div key={domain.id} className="px-6 py-4">
							<div className="flex items-center justify-between">
								<div>
									<p className="text-sm font-medium text-gray-900">
										{domain.domain}
									</p>
									{domain.domain === `${tenant.slug}.myapp.com` && (
										<p className="text-xs text-gray-500 mt-1">
											Primary subdomain
										</p>
									)}
								</div>
								<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
									Active
								</span>
							</div>
						</div>
					))}
				</div>
			</div>

			{/* Info Panel */}
			<div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
				<div className="flex">
					<div className="flex-shrink-0">
						<svg
							className="h-5 w-5 text-blue-400"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
						>
							<title>Info</title>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
							/>
						</svg>
					</div>
					<div className="ml-3">
						<h3 className="text-sm font-medium text-blue-800">Coming Soon</h3>
						<div className="mt-2 text-sm text-blue-700">
							<p>
								Full domain management features including custom domain
								addition, DNS verification, and SSL certificate management will
								be available in Phase 7.
							</p>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
