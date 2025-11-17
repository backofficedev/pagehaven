import { createFileRoute, Link } from "@tanstack/react-router";
import { getUserTenantsFn } from "../../../lib/tenant-functions";

export const Route = createFileRoute("/_authenticated/tenants/")({
	loader: async () => {
		const tenants = await getUserTenantsFn();
		return { tenants };
	},
	component: TenantsListPage,
});

function TenantsListPage() {
	const { tenants } = Route.useLoaderData();

	return (
		<div className="min-h-screen bg-gray-50 py-8">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				<div className="mb-8">
					<h1 className="text-3xl font-bold text-gray-900">Your Sites</h1>
					<p className="text-gray-600 mt-2">
						Manage your static site hosting
					</p>
				</div>

				{tenants.length === 0 ? (
					<div className="bg-white rounded-lg shadow p-12 text-center">
						<svg
							className="mx-auto h-12 w-12 text-gray-400"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
							aria-hidden="true"
						>
							<title>No Sites</title>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
							/>
						</svg>
						<h3 className="mt-4 text-lg font-medium text-gray-900">
							No sites yet
						</h3>
						<p className="mt-2 text-sm text-gray-500">
							Get started by creating your first site to host static content
						</p>
						<div className="mt-6">
							<p className="text-sm text-gray-600">
								Click the site switcher in the top right and select
								"Create New Site"
							</p>
						</div>
					</div>
				) : (
					<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
						{tenants.map((tenant) => (
							<Link
								key={tenant.id}
								to="/tenants/$tenantId"
								params={{ tenantId: tenant.id }}
								className="block bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-6"
							>
								<div className="flex items-start justify-between">
									<div className="flex-1">
										<h3 className="text-lg font-semibold text-gray-900">
											{tenant.name}
										</h3>
										<p className="text-sm text-gray-500 mt-1">
											{tenant.slug}.myapp.com
										</p>
									</div>
									<span
										className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
											tenant.role === "admin"
												? "bg-blue-100 text-blue-800"
												: "bg-gray-100 text-gray-800"
										}`}
									>
										{tenant.role}
									</span>
								</div>

								<div className="mt-4 flex items-center text-sm text-gray-500">
									<svg
										className="mr-1.5 h-4 w-4 flex-shrink-0"
										fill="none"
										viewBox="0 0 24 24"
										stroke="currentColor"
									>
										<title>Auth Mode</title>
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth={2}
											d={
												tenant.authMode === "public"
													? "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
													: "M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
											}
										/>
									</svg>
									{tenant.authMode === "public" ? "Public" : "Private"}
								</div>

								<div className="mt-2 flex items-center text-sm text-gray-500">
									<svg
										className="mr-1.5 h-4 w-4 flex-shrink-0"
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
									Version {tenant.version}
								</div>
							</Link>
						))}
					</div>
				)}
			</div>
		</div>
	);
}
