import * as Dialog from "@radix-ui/react-dialog";
import { UserProfile, WorkOsWidgets } from "@workos-inc/widgets";
import { useState, useEffect, useRef } from "react";
import { getAccessToken } from "../authkit/serverFunctions";

interface UserProfileModalProps {
	isOpen: boolean;
	onClose: () => void;
}

export function UserProfileModal({ isOpen, onClose }: UserProfileModalProps) {
	const [accessToken, setAccessToken] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const observerRef = useRef<MutationObserver | null>(null);

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

	// Monitor for WorkOS widget modals and adjust their z-index
	useEffect(() => {
		if (!isOpen) {
			if (observerRef.current) {
				observerRef.current.disconnect();
				observerRef.current = null;
			}
			return;
		}

		// Function to fix z-index of WorkOS modals
		const fixWorkOSModalZIndex = () => {
			// Find all Radix dialog overlays that are NOT our UserProfileModal
			const radixOverlays = document.querySelectorAll<HTMLElement>(
				'[data-radix-dialog-overlay]:not(.user-profile-modal-overlay)'
			);
			const radixContents = document.querySelectorAll<HTMLElement>(
				'[data-radix-dialog-content]:not(.user-profile-modal-content)'
			);

			// Also find any fixed positioned elements that might be modals
			// (WorkOS might use different modal structure)
			const allFixedElements = Array.from(document.querySelectorAll<HTMLElement>('*')).filter(
				(el) => {
					const style = window.getComputedStyle(el);
					return (
						style.position === 'fixed' &&
						!el.classList.contains('user-profile-modal-overlay') &&
						!el.classList.contains('user-profile-modal-content') &&
						el !== document.body &&
						!el.closest('.user-profile-modal-content')
					);
				}
			);

			// Fix Radix dialog overlays and contents
			radixOverlays.forEach((overlay) => {
				overlay.style.zIndex = '200';
			});

			radixContents.forEach((content) => {
				content.style.zIndex = '210';
			});

			// For other fixed positioned elements, check if they look like modals
			// (WorkOS widgets might use different modal structures)
			allFixedElements.forEach((el) => {
				const rect = el.getBoundingClientRect();
				// If it covers a significant portion of the screen, it might be a modal
				if (rect.width > 200 && rect.height > 200) {
					const currentZ = parseInt(window.getComputedStyle(el).zIndex) || 0;
					if (currentZ < 200) {
						el.style.zIndex = '200';
					}
				}
			});
		};

		// Set up MutationObserver to watch for new dialogs
		observerRef.current = new MutationObserver(() => {
			fixWorkOSModalZIndex();
		});

		// Observe the document body for changes
		observerRef.current.observe(document.body, {
			childList: true,
			subtree: true,
			attributes: true,
			attributeFilter: ['data-state', 'class'],
		});

		// Initial fix
		fixWorkOSModalZIndex();

		// Also check periodically as a fallback
		const interval = setInterval(fixWorkOSModalZIndex, 100);

		return () => {
			if (observerRef.current) {
				observerRef.current.disconnect();
				observerRef.current = null;
			}
			clearInterval(interval);
		};
	}, [isOpen]);

	return (
		<Dialog.Root open={isOpen} onOpenChange={onClose}>
			<Dialog.Portal>
				<Dialog.Overlay className="user-profile-modal-overlay bg-black/50 data-[state=open]:animate-overlayShow fixed inset-0 z-[100]" />
				<Dialog.Content
					className="user-profile-modal-content data-[state=open]:animate-contentShow fixed top-[50%] left-[50%] max-h-[85vh] w-[90vw] max-w-[600px] translate-x-[-50%] translate-y-[-50%] rounded-lg bg-white p-6 shadow-lg focus:outline-none z-[110] overflow-y-auto"
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
						<div className="workos-widgets-wrapper">
							<WorkOsWidgets>
								<UserProfile authToken={() => Promise.resolve(accessToken)} />
							</WorkOsWidgets>
						</div>
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
