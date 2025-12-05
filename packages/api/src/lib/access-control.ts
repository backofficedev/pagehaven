/**
 * Shared access control utilities for site access verification
 * Used by both the static worker and API handlers
 *
 * This module re-exports pure utility functions from access-utils.ts
 * and adds database-dependent access check functions.
 */

import { db } from "@pagehaven/db";
import { siteInvite, siteMember } from "@pagehaven/db/schema/site";
import { and, eq } from "drizzle-orm";
import {
  type AccessCheckOptions,
  type AccessCheckResult,
  checkPasswordAccess,
} from "./access-utils";

export type { AccessCheckOptions, AccessCheckResult } from "./access-utils";
// Re-export pure utility functions for consumers
// biome-ignore lint/performance/noBarrelFile: Re-exporting pure utility functions for API consumers
export {
  checkPasswordAccess,
  getAccessDeniedResponse,
  getGateRedirectUrl,
  verifyPasswordCookie,
} from "./access-utils";

// ============ Membership Checks ============

/**
 * Check if a user is a member of a site
 */
export async function checkMemberAccess(
  siteId: string,
  userId: string | undefined
): Promise<boolean> {
  if (!userId) {
    return false;
  }
  const membership = await db
    .select({ id: siteMember.id })
    .from(siteMember)
    .where(and(eq(siteMember.siteId, siteId), eq(siteMember.userId, userId)))
    .get();
  return !!membership;
}

/**
 * Check if a user has been invited to a site
 */
export async function checkInviteAccess(
  siteId: string,
  email: string | undefined
): Promise<boolean> {
  if (!email) {
    return false;
  }
  const invite = await db
    .select({ id: siteInvite.id, expiresAt: siteInvite.expiresAt })
    .from(siteInvite)
    .where(and(eq(siteInvite.siteId, siteId), eq(siteInvite.email, email)))
    .get();

  if (!invite) {
    return false;
  }
  if (invite.expiresAt && invite.expiresAt < new Date()) {
    return false;
  }
  return true;
}

// ============ Access Type Handlers ============

/**
 * Check owner-only access (site members only)
 */
export async function checkOwnerOnlyAccess(
  siteId: string,
  userId: string | undefined
): Promise<AccessCheckResult> {
  if (!userId) {
    return { allowed: false, reason: "login_required" };
  }
  const isMember = await checkMemberAccess(siteId, userId);
  return isMember
    ? { allowed: true }
    : { allowed: false, reason: "not_member" };
}

/**
 * Check private access (members or invited users)
 */
export async function checkPrivateAccess(
  siteId: string,
  userId: string | undefined,
  userEmail: string | undefined
): Promise<AccessCheckResult> {
  if (userId) {
    const isMember = await checkMemberAccess(siteId, userId);
    if (isMember) {
      return { allowed: true };
    }
  }
  if (userEmail) {
    const isInvited = await checkInviteAccess(siteId, userEmail);
    if (isInvited) {
      return { allowed: true };
    }
  }
  return { allowed: false, reason: userId ? "not_invited" : "login_required" };
}

// ============ Main Access Check ============

/**
 * Check access permissions based on site access type
 */
export async function checkAccessPermissions(
  opts: AccessCheckOptions
): Promise<AccessCheckResult> {
  const {
    siteId,
    accessType,
    passwordHash,
    passwordCookie,
    userId,
    userEmail,
  } = opts;

  if (!accessType || accessType === "public") {
    return { allowed: true };
  }

  if (accessType === "password") {
    return checkPasswordAccess(passwordCookie, passwordHash);
  }

  if (accessType === "owner_only") {
    return await checkOwnerOnlyAccess(siteId, userId);
  }

  if (accessType === "private") {
    return await checkPrivateAccess(siteId, userId, userEmail);
  }

  return { allowed: true };
}
