import type { SiteRole } from "@pagehaven/db/schema/site";

// Role hierarchy for permission checks
const roleHierarchy: Record<SiteRole, number> = {
  owner: 4,
  admin: 3,
  editor: 2,
  viewer: 1,
};

/**
 * Check if a user's role has sufficient permissions for a required role
 */
export function hasPermission(
  userRole: SiteRole,
  requiredRole: SiteRole
): boolean {
  return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
}
