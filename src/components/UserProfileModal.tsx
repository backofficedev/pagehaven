import * as Dialog from "@radix-ui/react-dialog";
import { UserProfile, WorkOsWidgets } from "@workos-inc/widgets";
import { useState, useEffect } from "react";
import { getAccessToken } from "../authkit/serverFunctions";

interface UserProfileModalProps {
	isOpen: boolean;
	onClose: () => void;
}

export function UserProfileModal({ isOpen, onClose }: UserProfileModalProps) {
	const [accessToken, setAccessToken] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		if (isOpen) {
			setIsLoading(true);
			getAccessToken()
				.then((result) => {
					if (result.accessToken) {
						setAccessToken(result.accessToken);
					}
				})
				.catch((error) => {
					console.error("Failed to get access token:", error);
				})
				.finally(() => {
					setIsLoading(false);
				});
		}
	}, [isOpen]);

	return (
		<Dialog.Root open={isOpen} onOpenChange={onClose}>
			<Dialog.Portal>
				<Dialog.Overlay className="bg-black/50 data-[state=open]:animate-overlayShow fixed inset-0 z-40" />
				<Dialog.Content
					className="data-[state=open]:animate-contentShow fixed top-[50%] left-[50%] max-h-[85vh] w-[90vw] max-w-[600px] translate-x-[-50%] translate-y-[-50%] rounded-lg bg-white p-6 shadow-lg focus:outline-none z-50 overflow-y-auto"
					aria-describedby="profile-description"
				>
					<Dialog.Title className="text-xl font-semibold text-gray-900 mb-4">
						Profile Settings
					</Dialog.Title>
					<Dialog.Description id="profile-description" className="sr-only">
						Manage your profile settings and account information
					</Dialog.Description>

					{isLoading ? (
						<div className="flex items-center justify-center py-8">
							<p className="text-gray-500">Loading profile...</p>
						</div>
					) : accessToken ? (
						<WorkOsWidgets>
							<UserProfile authToken={() => Promise.resolve(accessToken)} />
						</WorkOsWidgets>
					) : (
						<div className="flex items-center justify-center py-8">
							<p className="text-red-500">
								Failed to load profile. Please try again.
							</p>
						</div>
					)}

					<Dialog.Close asChild>
						<button
							type="button"
							className="absolute top-4 right-4 inline-flex h-6 w-6 appearance-none items-center justify-center rounded-full text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
							aria-label="Close"
						>
							✕
						</button>
					</Dialog.Close>
				</Dialog.Content>
			</Dialog.Portal>
		</Dialog.Root>
	);
}
