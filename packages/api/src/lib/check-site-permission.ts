import { db } from "@pagehaven/db";
import { type SiteRole, siteMember } from "@pagehaven/db/schema/site";
import { and, eq } from "drizzle-orm";
import { hasPermission } from "./permissions";

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
