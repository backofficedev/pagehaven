import { db } from "@pagehaven/db";
import {
  deployment,
  type SiteRole,
  siteMember,
} from "@pagehaven/db/schema/site";
import { and, eq } from "drizzle-orm";
import { hasPermission } from "./permissions";

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
