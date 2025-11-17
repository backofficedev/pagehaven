import { createServerFn } from "@tanstack/react-start";
import { getAuth } from "../authkit/serverFunctions";

/**
 * Generate a unique ID for tenants
 */
function generateTenantId(): string {
	return `t_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Create a new tenant and corresponding WorkOS organization
 */
export const createTenantFn = createServerFn({ method: "POST" }).handler(
	async (ctx) => {
		// Import server-only modules inside the handler to prevent client bundling
		const { workos } = await import("../authkit/ssr/workos");
		const {
			createTenant,
			getTenantBySlug,
			addTenantDomain,
			addTenantMembership,
		} = await import("../db/queries");

		const { user } = await getAuth();
		if (!user) {
			throw new Error("Unauthorized");
		}

		const body = await ctx.request.json();
		const { name, slug, authMode } = body as {
			name: string;
			slug: string;
			authMode: "public" | "workos";
		};

		// Validate slug format (lowercase, alphanumeric, hyphens only)
		if (!/^[a-z0-9-]+$/.test(slug)) {
			throw new Error(
				"Slug must contain only lowercase letters, numbers, and hyphens",
			);
		}

		// Check if slug is already taken
		const existingTenant = await getTenantBySlug(slug);
		if (existingTenant) {
			throw new Error("Slug is already taken");
		}

		// Create WorkOS organization
		const organization = await workos.organizations.createOrganization({
			name,
			domainData: [], // We'll manage domains separately in our system
		});

		// Create tenant in database
		const tenantId = generateTenantId();
		const r2Prefix = `tenants/${tenantId}/`;

		const tenant = await createTenant({
			id: tenantId,
			slug,
			name,
			r2Prefix,
			authMode,
			workosOrgId: organization.id,
			version: 1,
		});

		// Add default domain (slug.myapp.com)
		await addTenantDomain(tenantId, `${slug}.myapp.com`);

		// Add creator as admin member
		await addTenantMembership({
			tenantId,
			userId: user.id,
			role: "admin",
			status: "active",
		});

		return { tenant, organization };
	},
);

/**
 * Get all tenants the current user has access to
 */
export const getUserTenantsFn = createServerFn({ method: "GET" }).handler(
	async () => {
		const { getTenantMemberships } = await import("../db/queries");

		const { user } = await getAuth();
		if (!user) {
			throw new Error("Unauthorized");
		}

		const tenants = await getTenantMemberships(user.id);
		return tenants;
	},
);

/**
 * Get a specific tenant by ID (with authorization check)
 */
export const getTenantFn = createServerFn({ method: "GET" }).handler(
	async (ctx) => {
		const { getTenant, getTenantMemberships } = await import("../db/queries");

		const { user } = await getAuth();
		if (!user) {
			throw new Error("Unauthorized");
		}

		const url = new URL(ctx.request.url);
		const tenantId = url.searchParams.get("tenantId");

		if (!tenantId) {
			throw new Error("Tenant ID is required");
		}

		const tenant = await getTenant(tenantId);
		if (!tenant) {
			throw new Error("Tenant not found");
		}

		// Check if user has access to this tenant
		const memberships = await getTenantMemberships(user.id);
		const hasAccess = memberships.some((m) => m.id === tenantId);

		if (!hasAccess) {
			throw new Error("Forbidden: You do not have access to this tenant");
		}

		return tenant;
	},
);

/**
 * Update tenant settings (admin only)
 */
export const updateTenantFn = createServerFn({ method: "POST" }).handler(
	async (ctx) => {
		const { workos } = await import("../authkit/ssr/workos");
		const { getTenant, updateTenant, userIsAdminOfTenant } =
			await import("../db/queries");

		const { user } = await getAuth();
		if (!user) {
			throw new Error("Unauthorized");
		}

		const body = await ctx.request.json();
		const { tenantId, name, authMode } = body as {
			tenantId: string;
			name?: string;
			authMode?: "public" | "workos";
		};

		// Check if user is admin of this tenant
		const isAdmin = await userIsAdminOfTenant(user.id, tenantId);
		if (!isAdmin) {
			throw new Error("Forbidden: Admin access required");
		}

		// Update tenant in database
		const updates: {
			name?: string;
			authMode?: "public" | "workos";
			updatedAt: string;
		} = {
			updatedAt: new Date().toISOString(),
		};

		if (name) updates.name = name;
		if (authMode) updates.authMode = authMode;

		const tenant = await updateTenant(tenantId, updates);

		// Also update WorkOS organization name if changed
		if (name && tenant?.workosOrgId) {
			await workos.organizations.updateOrganization({
				organization: tenant.workosOrgId,
				name,
			});
		}

		return tenant;
	},
);

/**
 * Get WorkOS organization for a tenant (for widget integration)
 */
export const getTenantWorkOsOrgFn = createServerFn({ method: "GET" }).handler(
	async (ctx) => {
		const { workos } = await import("../authkit/ssr/workos");
		const { getTenant, userIsAdminOfTenant } = await import("../db/queries");

		const { user } = await getAuth();
		if (!user) {
			throw new Error("Unauthorized");
		}

		const url = new URL(ctx.request.url);
		const tenantId = url.searchParams.get("tenantId");

		if (!tenantId) {
			throw new Error("Tenant ID is required");
		}

		const tenant = await getTenant(tenantId);
		if (!tenant?.workosOrgId) {
			throw new Error("WorkOS organization not found for this tenant");
		}

		// Verify user has access
		const isAdmin = await userIsAdminOfTenant(user.id, tenantId);
		if (!isAdmin) {
			throw new Error("Forbidden: Admin access required");
		}

		// Get WorkOS organization details
		const organization =
			await workos.organizations.getOrganization(tenant.workosOrgId);

		return organization;
	},
);
