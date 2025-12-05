import { db } from "@pagehaven/db";
import {
  deployment,
  type SiteRole,
  siteMember,
} from "@pagehaven/db/schema/site";
import { and, eq } from "drizzle-orm";
import type { Context } from "../context";
import { hasPermission } from "./permissions";

type AuthenticatedContext = {
  session: NonNullable<Context["session"]>;
};

/**
 * Get user's membership for a site
 * @returns The membership with role, or null if not a member
 */
export async function getMembership(
  siteId: string,
  userId: string
): Promise<{ role: SiteRole } | null> {
  const result = await db
    .select({ role: siteMember.role })
    .from(siteMember)
    .where(and(eq(siteMember.siteId, siteId), eq(siteMember.userId, userId)))
    .get();
  return result ?? null;
}

/**
 * Check if a user is a member of a site
 */
export async function isSiteMember(
  siteId: string,
  userId: string
): Promise<boolean> {
  const membership = await getMembership(siteId, userId);
  return !!membership;
}

type DeploymentWithRole = {
  deployment: typeof deployment.$inferSelect;
  role: SiteRole;
};

/**
 * Get a deployment and verify user has required permission
 * @returns The deployment and user's role
 * @throws Error if deployment not found or permission denied
 */
export async function getDeploymentWithPermission(
  deploymentId: string,
  userId: string,
  requiredRole: SiteRole,
  errorMessage = "Permission denied"
): Promise<DeploymentWithRole> {
  const result = await db
    .select({
      deployment,
      role: siteMember.role,
    })
    .from(deployment)
    .innerJoin(siteMember, eq(deployment.siteId, siteMember.siteId))
    .where(and(eq(deployment.id, deploymentId), eq(siteMember.userId, userId)))
    .get();

  if (!result) {
    throw new Error("Deployment not found or access denied");
  }

  if (!hasPermission(result.role, requiredRole)) {
    throw new Error(errorMessage);
  }

  return result;
}

/**
 * Check if a user has the required permission for a site
 * @returns The user's role if they have permission, null otherwise
 */
export async function checkSitePermission(
  siteId: string,
  userId: string,
  requiredRole: SiteRole
): Promise<SiteRole | null> {
  const membership = await db
    .select({ role: siteMember.role })
    .from(siteMember)
    .where(and(eq(siteMember.siteId, siteId), eq(siteMember.userId, userId)))
    .get();

  if (!membership) {
    return null;
  }

  const userRole = membership.role;
  if (!hasPermission(userRole, requiredRole)) {
    return null;
  }

  return userRole;
}

/**
 * Check if a user has the required permission, throwing an error if not
 */
export async function requireSitePermission(
  siteId: string,
  userId: string,
  requiredRole: SiteRole,
  errorMessage = "Permission denied"
): Promise<SiteRole> {
  const role = await checkSitePermission(siteId, userId, requiredRole);
  if (!role) {
    throw new Error(errorMessage);
  }
  return role;
}

/**
 * Context-aware wrapper for getDeploymentWithPermission
 * Extracts userId from context automatically
 */
export function getDeploymentFromContext(
  context: AuthenticatedContext,
  deploymentId: string,
  requiredRole: SiteRole,
  errorMessage?: string
): Promise<DeploymentWithRole> {
  return getDeploymentWithPermission(
    deploymentId,
    context.session.user.id,
    requiredRole,
    errorMessage
  );
}

/**
 * Context-aware wrapper for requireSitePermission
 * Extracts userId from context automatically
 */
export function requireSitePermissionFromContext(
  context: AuthenticatedContext,
  siteId: string,
  requiredRole: SiteRole,
  errorMessage?: string
): Promise<SiteRole> {
  return requireSitePermission(
    siteId,
    context.session.user.id,
    requiredRole,
    errorMessage
  );
}
