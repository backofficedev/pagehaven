import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { getTenantFn } from "../../../lib/tenant-functions";

export const Route = createFileRoute("/_authenticated/tenants/$tenantId")({
	loader: async ({ params, context }) => {
		const { userIsAdminOfTenant } = await import("../../../db/queries");

		const tenant = await getTenantFn({
			data: { tenantId: params.tenantId },
		});
		const isAdmin = await userIsAdminOfTenant(context.user.id, params.tenantId);

		return { tenant, isAdmin };
	},
	component: TenantLayout,
});

function TenantLayout() {
	const { tenant, isAdmin } = Route.useLoaderData();
	const { tenantId } = Route.useParams();

	const navigation = [
		{
			name: "Overview",
			href: `/tenants/${tenantId}`,
			icon: (
				<path
					strokeLinecap="round"
					strokeLinejoin="round"
					strokeWidth={2}
					d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
				/>
			),
		},
		{
			name: "Members",
			href: `/tenants/${tenantId}/members`,
			icon: (
				<path
					strokeLinecap="round"
					strokeLinejoin="round"
					strokeWidth={2}
					d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
				/>
			),
			adminOnly: true,
		},
		{
			name: "Domains",
			href: `/tenants/${tenantId}/domains`,
			icon: (
				<path
					strokeLinecap="round"
					strokeLinejoin="round"
					strokeWidth={2}
					d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"
				/>
			),
			adminOnly: true,
		},
		{
			name: "Settings",
			href: `/tenants/${tenantId}/settings`,
			icon: (
				<path
					strokeLinecap="round"
					strokeLinejoin="round"
					strokeWidth={2}
					d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z"
				/>
			),
			adminOnly: true,
		},
	];

	// Filter navigation based on user role
	const visibleNavigation = navigation.filter(
		(item) => !item.adminOnly || isAdmin,
	);

	return (
		<div className="min-h-screen bg-gray-50">
			{/* Header */}
			<div className="bg-white shadow">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
					<div className="flex items-center justify-between">
						<div>
							<h1 className="text-2xl font-bold text-gray-900">
								{tenant.name}
							</h1>
							<p className="text-sm text-gray-500 mt-1">
								{tenant.slug}.myapp.com
							</p>
						</div>
						<div className="flex items-center gap-2">
							<span
								className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
									tenant.authMode === "public"
										? "bg-green-100 text-green-800"
										: "bg-blue-100 text-blue-800"
								}`}
							>
								{tenant.authMode === "public" ? "Public" : "Private"}
							</span>
							{isAdmin && (
								<span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
									Admin
								</span>
							)}
						</div>
					</div>
				</div>
			</div>

			{/* Navigation Tabs */}
			<div className="bg-white border-b border-gray-200">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<nav className="flex -mb-px space-x-8" aria-label="Tabs">
						{visibleNavigation.map((item) => (
							<Link
								key={item.name}
								to={item.href}
								activeProps={{
									className:
										"border-blue-500 text-blue-600 group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm",
								}}
								inactiveProps={{
									className:
										"border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm",
								}}
							>
								<svg
									className="-ml-0.5 mr-2 h-5 w-5"
									xmlns="http://www.w3.org/2000/svg"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
									aria-hidden="true"
								>
									<title>{item.name}</title>
									{item.icon}
								</svg>
								<span>{item.name}</span>
							</Link>
						))}
					</nav>
				</div>
			</div>

			{/* Main Content */}
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
				<Outlet />
			</div>
		</div>
	);
}
