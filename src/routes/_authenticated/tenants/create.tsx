import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { createTenantFn } from "../../../lib/tenant-functions";

export const Route = createFileRoute("/_authenticated/tenants/create")({
	component: CreateTenantPage,
});

function CreateTenantPage() {
	const navigate = useNavigate();
	const [name, setName] = useState("");
	const [slug, setSlug] = useState("");
	const [authMode, setAuthMode] = useState<"public" | "workos">("public");
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);

	// Auto-generate slug from name
	const handleNameChange = (newName: string) => {
		setName(newName);
		// Generate slug: lowercase, replace spaces with hyphens, remove special chars
		const generatedSlug = newName
			.toLowerCase()
			.replace(/\s+/g, "-")
			.replace(/[^a-z0-9-]/g, "");
		setSlug(generatedSlug);
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError(null);
		setIsSubmitting(true);

		try {
			const result = await createTenantFn({
				data: { name, slug, authMode },
			});

			// Navigate to the new tenant
			navigate({
				to: "/tenants/$tenantId",
				params: { tenantId: result.tenant.id },
			});
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to create tenant");
			setIsSubmitting(false);
		}
	};

	return (
		<div className="max-w-2xl mx-auto px-4 py-8">
			<div className="mb-6">
				<button
					type="button"
					onClick={() => navigate({ to: "/tenants" })}
					className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1"
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="16"
						height="16"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						strokeWidth="2"
						strokeLinecap="round"
						strokeLinejoin="round"
					>
						<title>Back</title>
						<path d="M19 12H5M12 19l-7-7 7-7" />
					</svg>
					Back to Tenants
				</button>
			</div>

			<div className="bg-white shadow rounded-lg p-6">
				<h1 className="text-2xl font-bold text-gray-900 mb-6">
					Create New Tenant
				</h1>

				<form onSubmit={handleSubmit} className="space-y-6">
					{/* Name */}
					<div>
						<label
							htmlFor="name"
							className="block text-sm font-medium text-gray-700 mb-1"
						>
							Tenant Name
						</label>
						<input
							type="text"
							id="name"
							value={name}
							onChange={(e) => handleNameChange(e.target.value)}
							required
							className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
							placeholder="My Organization"
						/>
					</div>

					{/* Slug */}
					<div>
						<label
							htmlFor="slug"
							className="block text-sm font-medium text-gray-700 mb-1"
						>
							URL Slug
						</label>
						<input
							type="text"
							id="slug"
							value={slug}
							onChange={(e) => setSlug(e.target.value)}
							required
							pattern="[a-z0-9-]+"
							className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
							placeholder="my-organization"
						/>
						<p className="mt-1 text-xs text-gray-500">
							Lowercase letters, numbers, and hyphens only
						</p>
					</div>

					{/* Auth Mode */}
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-2">
							Authentication Mode
						</label>
						<div className="space-y-2">
							<label className="flex items-start gap-3 p-3 border border-gray-300 rounded-md cursor-pointer hover:bg-gray-50">
								<input
									type="radio"
									name="authMode"
									value="public"
									checked={authMode === "public"}
									onChange={() => setAuthMode("public")}
									className="mt-1"
								/>
								<div>
									<div className="font-medium text-gray-900">Public</div>
									<div className="text-sm text-gray-600">
										Anyone can access content without authentication
									</div>
								</div>
							</label>
							<label className="flex items-start gap-3 p-3 border border-gray-300 rounded-md cursor-pointer hover:bg-gray-50">
								<input
									type="radio"
									name="authMode"
									value="workos"
									checked={authMode === "workos"}
									onChange={() => setAuthMode("workos")}
									className="mt-1"
								/>
								<div>
									<div className="font-medium text-gray-900">
										WorkOS (SSO/SAML)
									</div>
									<div className="text-sm text-gray-600">
										Require authentication via WorkOS
									</div>
								</div>
							</label>
						</div>
					</div>

					{/* Error */}
					{error && (
						<div className="p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-600">
							{error}
						</div>
					)}

					{/* Submit */}
					<div className="flex justify-end gap-3">
						<button
							type="button"
							onClick={() => navigate({ to: "/tenants" })}
							className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
						>
							Cancel
						</button>
						<button
							type="submit"
							disabled={isSubmitting}
							className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
						>
							{isSubmitting ? "Creating..." : "Create Tenant"}
						</button>
					</div>
				</form>
			</div>
		</div>
	);
}
