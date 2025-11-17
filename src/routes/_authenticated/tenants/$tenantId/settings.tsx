import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { updateTenantFn } from "../../../../lib/tenant-functions";

export const Route = createFileRoute(
	"/_authenticated/tenants/$tenantId/settings",
)({
	component: TenantSettings,
});

function TenantSettings() {
	const { tenant, isAdmin } = Route.useRouteContext();
	const [name, setName] = useState(tenant.name);
	const [authMode, setAuthMode] = useState<"public" | "workos">(
		tenant.authMode,
	);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [saveMessage, setSaveMessage] = useState<{
		type: "success" | "error";
		text: string;
	} | null>(null);

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
					You need admin permissions to modify tenant settings.
				</p>
			</div>
		);
	}

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setSaveMessage(null);
		setIsSubmitting(true);

		try {
			await updateTenantFn({
				data: {
					tenantId: tenant.id,
					name,
					authMode,
				},
			});

			setSaveMessage({ type: "success", text: "Settings saved successfully!" });

			// Reload the page after a short delay to show updated data
			setTimeout(() => {
				window.location.reload();
			}, 1500);
		} catch (err) {
			setSaveMessage({
				type: "error",
				text: err instanceof Error ? err.message : "Failed to save settings",
			});
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<div className="space-y-6">
			{/* General Settings */}
			<form onSubmit={handleSubmit} className="bg-white rounded-lg shadow">
				<div className="px-6 py-5 border-b border-gray-200">
					<h3 className="text-lg font-medium text-gray-900">
						General Settings
					</h3>
					<p className="mt-1 text-sm text-gray-500">
						Update your site's basic information
					</p>
				</div>

				<div className="px-6 py-5 space-y-6">
					{/* Site Name */}
					<div>
						<label
							htmlFor="tenant-name"
							className="block text-sm font-medium text-gray-700 mb-1"
						>
							Site Name
						</label>
						<input
							id="tenant-name"
							type="text"
							value={name}
							onChange={(e) => setName(e.target.value)}
							required
							className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
						/>
					</div>

					{/* Slug (Read-only) */}
					<div>
						<label
							htmlFor="tenant-slug"
							className="block text-sm font-medium text-gray-700 mb-1"
						>
							Subdomain Slug
						</label>
						<div className="flex items-center">
							<input
								id="tenant-slug"
								type="text"
								value={tenant.slug}
								disabled
								className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md bg-gray-50 text-gray-500"
							/>
							<span className="px-3 py-2 bg-gray-100 border border-l-0 border-gray-300 rounded-r-md text-sm text-gray-600">
								.myapp.com
							</span>
						</div>
						<p className="text-xs text-gray-500 mt-1">
							Slug cannot be changed after creation
						</p>
					</div>

					{/* Auth Mode */}
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-2">
							Authentication Mode
						</label>
						<div className="space-y-3">
							<label className="flex items-start gap-3 cursor-pointer">
								<input
									type="radio"
									name="authMode"
									value="public"
									checked={authMode === "public"}
									onChange={() => setAuthMode("public")}
									className="mt-1"
								/>
								<div>
									<div className="text-sm font-medium text-gray-900">
										Public
									</div>
									<div className="text-xs text-gray-500">
										Anyone can view your static site without authentication
									</div>
								</div>
							</label>
							<label className="flex items-start gap-3 cursor-pointer">
								<input
									type="radio"
									name="authMode"
									value="workos"
									checked={authMode === "workos"}
									onChange={() => setAuthMode("workos")}
									className="mt-1"
								/>
								<div>
									<div className="text-sm font-medium text-gray-900">
										WorkOS (Private)
									</div>
									<div className="text-xs text-gray-500">
										Require WorkOS authentication to view the site (SSO
										supported)
									</div>
								</div>
							</label>
						</div>
					</div>

					{/* Success/Error Message */}
					{saveMessage && (
						<div
							className={`p-3 rounded-md text-sm ${
								saveMessage.type === "success"
									? "bg-green-50 border border-green-200 text-green-700"
									: "bg-red-50 border border-red-200 text-red-700"
							}`}
						>
							{saveMessage.text}
						</div>
					)}
				</div>

				<div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end">
					<button
						type="submit"
						disabled={isSubmitting}
						className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
					>
						{isSubmitting ? "Saving..." : "Save Changes"}
					</button>
				</div>
			</form>

			{/* Site Information */}
			<div className="bg-white rounded-lg shadow">
				<div className="px-6 py-5 border-b border-gray-200">
					<h3 className="text-lg font-medium text-gray-900">
						Site Information
					</h3>
				</div>
				<div className="px-6 py-5 space-y-4">
					<div className="grid grid-cols-2 gap-4">
						<div>
							<p className="text-sm font-medium text-gray-500">Site ID</p>
							<p className="mt-1 text-sm font-mono text-gray-900">
								{tenant.id}
							</p>
						</div>
						<div>
							<p className="text-sm font-medium text-gray-500">
								WorkOS Organization ID
							</p>
							<p className="mt-1 text-sm font-mono text-gray-900">
								{tenant.workosOrgId}
							</p>
						</div>
						<div>
							<p className="text-sm font-medium text-gray-500">
								R2 Storage Path
							</p>
							<p className="mt-1 text-sm font-mono text-gray-900">
								{tenant.r2Prefix}
							</p>
						</div>
						<div>
							<p className="text-sm font-medium text-gray-500">
								Current Version
							</p>
							<p className="mt-1 text-sm font-mono text-gray-900">
								{tenant.version}
							</p>
						</div>
						<div>
							<p className="text-sm font-medium text-gray-500">Created</p>
							<p className="mt-1 text-sm text-gray-900">
								{new Date(tenant.createdAt).toLocaleDateString()}
							</p>
						</div>
						<div>
							<p className="text-sm font-medium text-gray-500">Last Updated</p>
							<p className="mt-1 text-sm text-gray-900">
								{new Date(tenant.updatedAt).toLocaleDateString()}
							</p>
						</div>
					</div>
				</div>
			</div>

			{/* Danger Zone */}
			<div className="bg-white rounded-lg shadow border-2 border-red-200">
				<div className="px-6 py-5 border-b border-red-200 bg-red-50">
					<h3 className="text-lg font-medium text-red-900">Danger Zone</h3>
				</div>
				<div className="px-6 py-5">
					<div className="flex items-start justify-between">
						<div>
							<h4 className="text-sm font-medium text-gray-900">
								Delete this tenant
							</h4>
							<p className="text-sm text-gray-500 mt-1">
								Once deleted, it cannot be recovered. All content and
								configurations will be permanently removed.
							</p>
						</div>
						<button
							type="button"
							className="px-4 py-2 text-sm font-medium text-red-700 bg-red-50 border border-red-300 rounded-md hover:bg-red-100"
							disabled
						>
							Delete Tenant
						</button>
					</div>
					<p className="text-xs text-gray-500 mt-3">
						Tenant deletion will be enabled in a future update
					</p>
				</div>
			</div>
		</div>
	);
}
