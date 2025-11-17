import { createFileRoute } from "@tanstack/react-router";
import { getConfig } from "../../../authkit/ssr/config";
import type { AuthkitSession } from "../../../authkit/ssr/interfaces";
import { saveSession } from "../../../authkit/ssr/session";
import { getWorkOS } from "../../../authkit/ssr/workos";

export const Route = createFileRoute("/api/auth/callback")({
	server: {
		handlers: {
			GET: async ({ request }) => {
				const url = new URL(request.url);
				const code = url.searchParams.get("code");
				const state = url.searchParams.get("state");

				if (!code) {
					return new Response("Missing authorization code", { status: 400 });
				}

				try {
					const workos = getWorkOS();
					const clientId = getConfig<string>("clientId");

					if (!clientId) {
						throw new Error("WORKOS_CLIENT_ID is required");
					}

					// Exchange the authorization code for user information
					const { user, accessToken, refreshToken } =
						await workos.userManagement.authenticateWithCode({
							code,
							clientId,
						});

					// Create and save the session
					const session: AuthkitSession = {
						accessToken,
						refreshToken,
						user,
					};

					await saveSession(session);

					// Parse the state to get the return path
					let returnPathname = "/";
					if (state) {
						try {
							const decodedState = JSON.parse(
								Buffer.from(state, "base64").toString("utf-8"),
							);
							returnPathname = decodedState.returnPathname || "/";
						} catch (error) {
							console.error("Failed to parse state:", error);
						}
					}

					// Redirect to the return path
					// Note: After redirect, __root.tsx beforeLoad will run and fetch fresh auth data
					// The cache will be automatically updated with the new session
					return new Response(null, {
						status: 302,
						headers: {
							Location: returnPathname,
						},
					});
				} catch (error) {
					console.error("Authentication error:", error);
					return new Response("Authentication failed", { status: 500 });
				}
			},
		},
	},
});
