import { createFileRoute, redirect } from "@tanstack/react-router";
import { signOut } from "../authkit/serverFunctions";

export const Route = createFileRoute("/logout")({
	beforeLoad: async ({ context }) => {
		// Invalidate auth cache - this ensures fresh data is fetched after logout
		context.queryClient.setQueryData(["auth"], {
			user: null,
			signInUrl: "#",
			widgetToken: null,
		});
		context.queryClient.invalidateQueries({ queryKey: ["auth"] });

		// Clear all browser storage aggressively to force account selection on next login
		if (typeof window !== "undefined") {
			// Clear all localStorage
			localStorage.clear();

			// Clear all sessionStorage
			sessionStorage.clear();

			// Clear all cookies (including WorkOS AuthKit cookies)
			const cookies = document.cookie.split(";");
			for (const cookie of cookies) {
				const eqPos = cookie.indexOf("=");
				const name = eqPos > -1 ? cookie.slice(0, eqPos).trim() : cookie.trim();
				// Delete cookie for all possible paths and domains
				// biome-ignore lint/suspicious/noDocumentCookie: Required for logout flow to clear all cookies
				document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
				// biome-ignore lint/suspicious/noDocumentCookie: Required for logout flow to clear all cookies
				document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=${window.location.hostname}`;
				// biome-ignore lint/suspicious/noDocumentCookie: Required for logout flow to clear all cookies
				document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=.${window.location.hostname}`;
			}
		}

		const logoutUrl = await signOut();
		throw redirect({ to: logoutUrl as "/" });
	},
});
