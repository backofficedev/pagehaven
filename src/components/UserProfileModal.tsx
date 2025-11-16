import * as Dialog from "@radix-ui/react-dialog";
import { useAuth } from "@workos-inc/authkit-react";
import { UserProfile, WorkOsWidgets } from "@workos-inc/widgets";
import { useEffect, useState } from "react";

interface UserProfileModalProps {
	isOpen: boolean;
	onClose: () => void;
}

export function UserProfileModal({ isOpen, onClose }: UserProfileModalProps) {
	const { getAccessToken } = useAuth();
	const [accessToken, setAccessToken] = useState<string | null>(null);

	useEffect(() => {
		// Only try to get access token on the client side
		if (typeof window !== "undefined" && isOpen) {
			try {
				const token = getAccessToken();
				if (token) {
					setAccessToken(token);
				}
			} catch (error) {
				console.error("Failed to get access token:", error);
			}
		}
	}, [isOpen, getAccessToken]);

	return (
		<Dialog.Root open={isOpen} onOpenChange={onClose}>
			<Dialog.Portal>
				<Dialog.Overlay className="bg-black/50 data-[state=open]:animate-overlayShow fixed inset-0 z-40" />
				<Dialog.Content className="data-[state=open]:animate-contentShow fixed top-[50%] left-[50%] max-h-[85vh] w-[90vw] max-w-[600px] translate-x-[-50%] translate-y-[-50%] rounded-lg bg-white p-6 shadow-lg focus:outline-none z-50 overflow-y-auto">
					<Dialog.Title className="text-xl font-semibold text-gray-900 mb-4">
						Profile Settings
					</Dialog.Title>

					{accessToken ? (
						<WorkOsWidgets>
							<UserProfile authToken={accessToken} />
						</WorkOsWidgets>
					) : (
						<div className="flex items-center justify-center py-8">
							<p className="text-gray-500">Loading profile...</p>
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
