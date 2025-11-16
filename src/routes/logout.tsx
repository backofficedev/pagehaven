import { createFileRoute, redirect } from "@tanstack/react-router";
import { signOut } from "../authkit/serverFunctions";

export const Route = createFileRoute("/logout")({
	beforeLoad: async () => {
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
				document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
				document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=${window.location.hostname}`;
				document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=.${window.location.hostname}`;
			}
		}

		const logoutUrl = await signOut();
		throw redirect({ to: logoutUrl as "/" });
	},
});
