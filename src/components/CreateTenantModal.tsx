import * as Dialog from "@radix-ui/react-dialog";
import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { createTenantFn } from "../lib/tenant-functions";

interface CreateTenantModalProps {
	isOpen: boolean;
	onClose: () => void;
}

export function CreateTenantModal({ isOpen, onClose }: CreateTenantModalProps) {
	const navigate = useNavigate();
	const [name, setName] = useState("");
	const [slug, setSlug] = useState("");
	const [authMode, setAuthMode] = useState<"public" | "workos">("public");
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);

	// Auto-generate slug from name
	const handleNameChange = (value: string) => {
		setName(value);
		// Auto-generate slug if it hasn't been manually edited
		const autoSlug = value
			.toLowerCase()
			.replace(/[^a-z0-9\s-]/g, "") // Remove invalid chars
			.replace(/\s+/g, "-") // Replace spaces with hyphens
			.replace(/-+/g, "-") // Replace multiple hyphens with single
			.replace(/^-|-$/g, ""); // Trim hyphens from start/end
		setSlug(autoSlug);
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError(null);
		setIsSubmitting(true);

		try {
			const result = await createTenantFn({ data: { name, slug, authMode } });

			// Close modal and navigate to new tenant
			onClose();
			setName("");
			setSlug("");
			setAuthMode("public");

			// Navigate to the new site's dashboard
			navigate({ to: `/tenants/${result.tenant.id}` });
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to create site");
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<Dialog.Root open={isOpen} onOpenChange={onClose}>
			<Dialog.Portal>
				<Dialog.Overlay className="fixed inset-0 bg-black/50 data-[state=open]:animate-fadeIn z-50" />
				<Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-xl w-full max-w-md p-6 data-[state=open]:animate-fadeIn z-50">
					<Dialog.Title className="text-lg font-semibold text-gray-900 mb-4">
						Create New Site
					</Dialog.Title>
					<Dialog.Description className="text-sm text-gray-600 mb-6">
						Create a new site to host static content. Each site gets its own
						subdomain and can have custom domains.
					</Dialog.Description>

					<form onSubmit={handleSubmit} className="space-y-4">
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
								onChange={(e) => handleNameChange(e.target.value)}
								required
								placeholder="My Awesome Site"
								className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
							/>
						</div>

						{/* Slug */}
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
									value={slug}
									onChange={(e) => setSlug(e.target.value)}
									required
									pattern="[a-z0-9-]+"
									placeholder="my-awesome-site"
									className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500"
								/>
								<span className="px-3 py-2 bg-gray-100 border border-l-0 border-gray-300 rounded-r-md text-sm text-gray-600">
									.myapp.com
								</span>
							</div>
							<p className="text-xs text-gray-500 mt-1">
								Lowercase letters, numbers, and hyphens only
							</p>
						</div>

						{/* Auth Mode */}
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-2">
								Authentication Mode
							</label>
							<div className="space-y-2">
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
											Require WorkOS authentication to view the site
										</div>
									</div>
								</label>
							</div>
						</div>

						{/* Error Message */}
						{error && (
							<div className="p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-700">
								{error}
							</div>
						)}

						{/* Actions */}
						<div className="flex justify-end gap-3 pt-4">
							<Dialog.Close asChild>
								<button
									type="button"
									className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md"
									disabled={isSubmitting}
								>
									Cancel
								</button>
							</Dialog.Close>
							<button
								type="submit"
								disabled={isSubmitting}
								className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
							>
								{isSubmitting ? "Creating..." : "Create Site"}
							</button>
						</div>
					</form>
				</Dialog.Content>
			</Dialog.Portal>
		</Dialog.Root>
	);
}
