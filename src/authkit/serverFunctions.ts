import { createServerFn } from "@tanstack/react-start";
import { upsertUserByWorkOsId } from "../db/queries";
import { getAuthorizationUrl, terminateSession, withAuth } from "./ssr/session";

/**
 * Gets the sign-in URL for authentication
 */
export const getSignInUrl = createServerFn({ method: "GET" }).handler(
	async ({ data }: { data?: { returnPathname?: string } }) => {
		return getAuthorizationUrl({
			returnPathname: data?.returnPathname,
			screenHint: "sign-in",
			forceAccountSelection: true,
		});
	},
);

/**
 * Gets the sign-up URL for registration
 */
export const getSignUpUrl = createServerFn({ method: "GET" }).handler(
	async ({ data }: { data?: { returnPathname?: string } }) => {
		return getAuthorizationUrl({
			returnPathname: data?.returnPathname,
			screenHint: "sign-up",
		});
	},
);

/**
 * Signs out the current user
 */
export const signOut = createServerFn({ method: "POST" }).handler(async () => {
	const logoutUrl = await terminateSession();
	return logoutUrl;
});

/**
 * Gets the current authenticated user with their database record
 */
export const getAuth = createServerFn({ method: "GET" }).handler(async () => {
	const authResult = await withAuth();

	if (!authResult) {
		return { user: null };
	}

	// Get or create the user in our database
	const dbUser = await upsertUserByWorkOsId({
		workosUserId: authResult.user.id,
		email: authResult.user.email,
		name:
			`${authResult.user.firstName ?? ""} ${authResult.user.lastName ?? ""}`.trim() ||
			null,
	});

	return {
		user: {
			id: dbUser.id,
			workosUserId: dbUser.workosUserId,
			email: dbUser.email,
			name: dbUser.name,
			createdAt: dbUser.createdAt,
			workosUser: authResult.user,
		},
	};
});

export type AuthUser = Awaited<ReturnType<typeof getAuth>>["user"];

/**
 * Gets the access token for the current session
 */
export const getAccessToken = createServerFn({ method: "GET" }).handler(
	async () => {
		const authResult = await withAuth();

		if (!authResult) {
			return { accessToken: null };
		}

		return {
			accessToken: authResult.accessToken,
		};
	},
);

/**
 * Gets an access token for WorkOS widgets (OrganizationSwitcher, etc.)
 * Note: The OrganizationSwitcher widget can use the access token directly
 */
export const getWidgetToken = createServerFn({ method: "GET" }).handler(
	async () => {
		const authResult = await withAuth();

		if (!authResult) {
			return { widgetToken: null };
		}

		// Return the access token for use with WorkOS widgets
		// The OrganizationSwitcher widget accepts the access token directly
		return { widgetToken: authResult.accessToken };
	},
);

/**
 * Creates a test organization for the current user
 * This is a temporary function to help with testing the organization switcher
 */
export const createTestOrganization = createServerFn({ method: "POST" }).handler(
	async () => {
		const authResult = await withAuth();

		if (!authResult) {
			throw new Error("Unauthorized");
		}

		// Import dependencies
		const { workos } = await import("./ssr/workos");
		const { getConfig } = await import("./ssr/config");
		const { getSessionFromCookie, saveSession } = await import("./ssr/session");

		try {
			// Create a test organization
			const organization = await workos.organizations.createOrganization({
				name: `${authResult.user.firstName || authResult.user.email}'s Organization`,
				domainData: [],
			});

			// Add the user as a member of the organization
			await workos.userManagement.createOrganizationMembership({
				userId: authResult.user.id,
				organizationId: organization.id,
				roleSlug: "admin",
			});

			// Get the current session and refresh it with the organization context
			const session = await getSessionFromCookie();
			if (session) {
				const clientId = getConfig<string>("clientId");

				// Refresh the session with the organization context
				const { accessToken, refreshToken, user } = await workos.userManagement.authenticateWithRefreshToken({
					clientId: clientId!,
					refreshToken: session.refreshToken,
					organizationId: organization.id,
				});

				// Save the updated session
				await saveSession({
					accessToken,
					refreshToken,
					user,
					impersonator: session.impersonator,
				});
			}

			return { organization };
		} catch (error) {
			console.error("Error creating test organization:", error);
			throw error;
		}
	},
);
