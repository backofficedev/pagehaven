import { createFileRoute } from "@tanstack/react-router";
import { useAuth } from "@workos-inc/authkit-react";
import { UsersManagement, WorkOsWidgets } from "@workos-inc/widgets";

export const Route = createFileRoute(
	"/_authenticated/tenants/$tenantId/members",
)({
	component: TenantMembers,
});

function TenantMembers() {
	const { getAccessToken } = useAuth();
	const { isAdmin } = Route.useRouteContext();

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
					You need admin permissions to manage members of this tenant.
				</p>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="bg-white rounded-lg shadow px-6 py-5">
				<h2 className="text-lg font-medium text-gray-900">Tenant Members</h2>
				<p className="mt-1 text-sm text-gray-500">
					Manage who has access to this tenant and their roles using the WorkOS
					member management widget below.
				</p>
			</div>

			{/* WorkOS UsersManagement Widget */}
			<div className="bg-white rounded-lg shadow p-6">
				<WorkOsWidgets>
					<UsersManagement authToken={getAccessToken} />
				</WorkOsWidgets>
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
						<h3 className="text-sm font-medium text-blue-800">
							About Member Roles
						</h3>
						<div className="mt-2 text-sm text-blue-700">
							<ul className="list-disc list-inside space-y-1">
								<li>
									<strong>Admin:</strong> Full access to tenant settings,
									content, domains, and members
								</li>
								<li>
									<strong>Viewer:</strong> Read-only access to tenant
									information and deployed sites
								</li>
							</ul>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
