import * as Avatar from "@radix-ui/react-avatar";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { useState } from "react";
import type { AuthUser } from "../authkit/serverFunctions";
import { UserProfileModal } from "./UserProfileModal";

interface UserButtonProps {
	user: AuthUser;
	signInUrl: string;
}

export function UserButton({ user, signInUrl }: UserButtonProps) {
	const [showProfileModal, setShowProfileModal] = useState(false);

	// If no user, show sign in button
	if (!user) {
		return (
			<a
				href={signInUrl}
				className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
			>
				Sign In
			</a>
		);
	}

	// Get user initials for avatar fallback
	const getInitials = (name: string | null, email: string) => {
		if (name) {
			return name
				.split(" ")
				.map((n) => n[0])
				.join("")
				.toUpperCase()
				.slice(0, 2);
		}
		return email[0].toUpperCase();
	};

	const initials = getInitials(user.name, user.email);

	return (
		<>
			<DropdownMenu.Root>
				<DropdownMenu.Trigger asChild>
					<button
						type="button"
						className="flex items-center gap-2 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
						aria-label="User menu"
					>
						<Avatar.Root className="inline-flex h-9 w-9 select-none items-center justify-center overflow-hidden rounded-full bg-blue-600 align-middle">
							<Avatar.Fallback className="text-sm font-medium text-white leading-none flex items-center justify-center w-full h-full">
								{initials}
							</Avatar.Fallback>
						</Avatar.Root>
					</button>
				</DropdownMenu.Trigger>

				<DropdownMenu.Portal>
					<DropdownMenu.Content
						className="min-w-[220px] bg-white rounded-md p-1 shadow-lg border border-gray-200 will-change-[opacity,transform] data-[side=top]:animate-slideDownAndFade data-[side=right]:animate-slideLeftAndFade data-[side=bottom]:animate-slideUpAndFade data-[side=left]:animate-slideRightAndFade z-50"
						sideOffset={5}
						align="end"
					>
						{/* User info header */}
						<div className="px-3 py-2 border-b border-gray-100">
							<div className="text-sm font-medium text-gray-900">
								{user.name || "User"}
							</div>
							<div className="text-xs text-gray-500">{user.email}</div>
						</div>

						{/* Manage Profile */}
						<DropdownMenu.Item
							className="group text-sm leading-none text-gray-700 rounded-sm flex items-center h-9 px-3 relative select-none outline-none cursor-pointer hover:bg-blue-50 hover:text-blue-900 data-[disabled]:text-gray-400 data-[disabled]:pointer-events-none"
							onSelect={() => setShowProfileModal(true)}
						>
							Manage Profile
						</DropdownMenu.Item>

						<DropdownMenu.Separator className="h-[1px] bg-gray-100 my-1" />

						{/* Sign Out */}
						<DropdownMenu.Item
							className="group text-sm leading-none text-red-600 rounded-sm flex items-center h-9 px-3 relative select-none outline-none cursor-pointer hover:bg-red-50 data-[disabled]:text-gray-400 data-[disabled]:pointer-events-none"
							asChild
						>
							<a href="/logout">Sign Out</a>
						</DropdownMenu.Item>
					</DropdownMenu.Content>
				</DropdownMenu.Portal>
			</DropdownMenu.Root>

			{/* User Profile Modal */}
			<UserProfileModal
				isOpen={showProfileModal}
				onClose={() => setShowProfileModal(false)}
			/>
		</>
	);
}
