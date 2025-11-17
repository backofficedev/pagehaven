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
 * Ensures the user has at least one organization.
 * If none exist, creates a default "{User's Name}'s Sites" organization + local tenant.
 * This is idempotent and safe to call multiple times.
 */
async function ensureUserHasDefaultOrganization(authResult: {
	user: { id: string; email: string; firstName: string | null; lastName: string | null };
	accessToken: string;
}): Promise<void> {
	const { workos } = await import("./ssr/workos");

	// Check if user has any organizations
	const memberships = await workos.userManagement.listOrganizationMemberships({
		userId: authResult.user.id,
	});

	if (memberships.data.length > 0) {
		return; // User already has orgs, nothing to do
	}

	// Determine organization name: "{FirstName}'s Sites" or "{Email}'s Sites"
	const displayName = authResult.user.firstName || authResult.user.email.split("@")[0];
	const organizationName = `${displayName}'s Sites`;

	// Create default organization
	const organization = await workos.organizations.createOrganization({
		name: organizationName,
		domainData: [],
	});

	// Add user as admin
	await workos.userManagement.createOrganizationMembership({
		userId: authResult.user.id,
		organizationId: organization.id,
		roleSlug: "admin",
	});

	// Create local tenant record
	const { createTenant, upsertUserByWorkOsId, addTenantMembership, addTenantDomain } = await import("../db/queries");

	const dbUser = await upsertUserByWorkOsId({
		workosUserId: authResult.user.id,
		email: authResult.user.email,
		name: `${authResult.user.firstName ?? ""} ${authResult.user.lastName ?? ""}`.trim() || null,
	});

	const tenantId = `tnt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
	const slug = `${dbUser.id}-default`;

	await createTenant({
		id: tenantId,
		slug,
		name: organizationName,
		authMode: "workos",
		workosOrgId: organization.id,
	});

	// Add default domain
	await addTenantDomain(tenantId, `${slug}.myapp.com`);

	// Add user as admin member
	await addTenantMembership({
		tenantId,
		userId: dbUser.id,
		role: "admin",
	});

	// Refresh session with org context
	const { getConfig } = await import("./ssr/config");
	const { getSessionFromCookie, saveSession } = await import("./ssr/session");

	const session = await getSessionFromCookie();
	if (session) {
		const clientId = getConfig<string>("clientId");
		if (!clientId) {
			throw new Error("WORKOS_CLIENT_ID is required");
		}

		const { accessToken, refreshToken, user } =
			await workos.userManagement.authenticateWithRefreshToken({
				clientId,
				refreshToken: session.refreshToken,
				organizationId: organization.id,
			});

		await saveSession({
			accessToken,
			refreshToken,
			user,
			impersonator: session.impersonator,
		});
	}
}

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

		// Ensure user has at least one organization before returning token
		await ensureUserHasDefaultOrganization(authResult);

		// Return the access token for use with WorkOS widgets
		// The OrganizationSwitcher widget accepts the access token directly
		return { widgetToken: authResult.accessToken };
	},
);

/**
 * Optimized: Gets all auth-related data in a single call.
 * This eliminates redundant withAuth() calls and database queries.
 * Returns user, widgetToken, and signInUrl all at once.
 */
export const getAuthData = createServerFn({ method: "GET" }).handler(
	async () => {
		// Generate sign-in URL in parallel (doesn't need auth)
		const signInUrlPromise = getAuthorizationUrl({
			screenHint: "sign-in",
			forceAccountSelection: true,
		});

		// Authenticate once
		const authResult = await withAuth();

		// If no auth, return early with sign-in URL
		if (!authResult) {
			const signInUrl = await signInUrlPromise;
			return {
				user: null,
				signInUrl,
				widgetToken: null,
			};
		}

		// Get or create the user in our database
		const dbUser = await upsertUserByWorkOsId({
			workosUserId: authResult.user.id,
			email: authResult.user.email,
			name:
				`${authResult.user.firstName ?? ""} ${authResult.user.lastName ?? ""}`.trim() ||
				null,
		});

		const user = {
			id: dbUser.id,
			workosUserId: dbUser.workosUserId,
			email: dbUser.email,
			name: dbUser.name,
			createdAt: dbUser.createdAt,
			workosUser: authResult.user,
		};

		// Ensure user has at least one organization and get widget token
		// This runs in parallel with getting the sign-in URL
		const widgetTokenPromise = ensureUserHasDefaultOrganization(authResult).then(
			() => authResult.accessToken,
		);

		// Wait for both to complete
		const [signInUrl, widgetToken] = await Promise.all([
			signInUrlPromise,
			widgetTokenPromise,
		]);

		return {
			user,
			signInUrl,
			widgetToken,
		};
	},
);

