import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { CreateTenantModal } from "./CreateTenantModal";

/**
 * TenantSwitcher - Simple dropdown to switch between tenants and create new ones
 * Note: Not using WorkOS OrganizationSwitcher widget due to server-side auth incompatibility
 */
export function TenantSwitcher() {
	const [showCreateModal, setShowCreateModal] = useState(false);

	return (
		<>
			<DropdownMenu.Root>
				<DropdownMenu.Trigger asChild>
					<button
						type="button"
						className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
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
							<title>Tenants</title>
							<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
							<polyline points="9 22 9 12 15 12 15 22" />
						</svg>
						Tenants
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
							<title>Expand</title>
							<path d="M6 9l6 6 6-6" />
						</svg>
					</button>
				</DropdownMenu.Trigger>

				<DropdownMenu.Portal>
					<DropdownMenu.Content
						className="min-w-[220px] bg-white rounded-md p-1 shadow-lg border border-gray-200 z-50"
						sideOffset={5}
						align="end"
					>
						<DropdownMenu.Item
							className="text-sm leading-none text-gray-700 rounded-sm flex items-center h-9 px-3 relative select-none outline-none cursor-pointer hover:bg-blue-50 hover:text-blue-900"
							asChild
						>
							<Link to="/tenants">
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
									className="mr-2"
								>
									<title>View All</title>
									<rect x="3" y="3" width="7" height="7" />
									<rect x="14" y="3" width="7" height="7" />
									<rect x="14" y="14" width="7" height="7" />
									<rect x="3" y="14" width="7" height="7" />
								</svg>
								View All Tenants
							</Link>
						</DropdownMenu.Item>

						<DropdownMenu.Separator className="h-[1px] bg-gray-100 my-1" />

						<DropdownMenu.Item
							className="text-sm leading-none text-blue-600 rounded-sm flex items-center h-9 px-3 relative select-none outline-none cursor-pointer hover:bg-blue-50"
							onSelect={() => setShowCreateModal(true)}
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
								className="mr-2"
							>
								<title>Create Tenant</title>
								<circle cx="12" cy="12" r="10" />
								<path d="M12 8v8M8 12h8" />
							</svg>
							Create New Tenant
						</DropdownMenu.Item>
					</DropdownMenu.Content>
				</DropdownMenu.Portal>
			</DropdownMenu.Root>

			<CreateTenantModal
				isOpen={showCreateModal}
				onClose={() => setShowCreateModal(false)}
			/>
		</>
	);
}
