import { db } from "@pagehaven/db";
import { siteAccess, siteInvite } from "@pagehaven/db/schema/site";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { protectedProcedure, publicProcedure } from "../index";
import { CacheKey, cacheDelete } from "../lib/cache";
import {
  isSiteMember,
  requireSitePermission,
} from "../lib/check-site-permission";
import { hashPassword, verifyPassword } from "../lib/password";

function generateId(): string {
  return crypto.randomUUID();
}

type AccessResult = { allowed: boolean; reason?: string };

async function checkInvite(
  siteId: string,
  email: string
): Promise<AccessResult> {
  const invite = await db
    .select({
      id: siteInvite.id,
      expiresAt: siteInvite.expiresAt,
    })
    .from(siteInvite)
    .where(and(eq(siteInvite.siteId, siteId), eq(siteInvite.email, email)))
    .get();

  if (!invite) {
    return { allowed: false, reason: "not_invited" };
  }
  if (invite.expiresAt && invite.expiresAt < new Date()) {
    return { allowed: false, reason: "invite_expired" };
  }
  return { allowed: true };
}

export const accessRouter = {
  // Get access settings for a site
  get: protectedProcedure
    .input(z.object({ siteId: z.string() }))
    .handler(async ({ input, context }) => {
      const userId = context.session.user.id;

      // Check access (viewer+ can view access settings)
      await requireSitePermission(
        input.siteId,
        userId,
        "viewer",
        "Access denied"
      );

      const access = await db
        .select({
          id: siteAccess.id,
          accessType: siteAccess.accessType,
          hasPassword: siteAccess.passwordHash,
        })
        .from(siteAccess)
        .where(eq(siteAccess.siteId, input.siteId))
        .get();

      if (!access) {
        throw new Error("Access settings not found");
      }

      return {
        id: access.id,
        accessType: access.accessType,
        hasPassword: !!access.hasPassword,
      };
    }),

  // Update access settings (requires admin+)
  update: protectedProcedure
    .input(
      z.object({
        siteId: z.string(),
        accessType: z.enum(["public", "password", "private", "owner_only"]),
        password: z.string().min(4).max(100).optional(),
      })
    )
    .handler(async ({ input, context }) => {
      const userId = context.session.user.id;

      // Check permission (admin+ can update access settings)
      await requireSitePermission(input.siteId, userId, "admin");

      // Validate password requirement
      if (input.accessType === "password" && !input.password) {
        throw new Error("Password is required for password-protected sites");
      }

      const updates: Partial<typeof siteAccess.$inferInsert> = {
        accessType: input.accessType,
      };

      if (input.password) {
        updates.passwordHash = await hashPassword(input.password);
      } else if (input.accessType !== "password") {
        // Clear password if switching away from password protection
        updates.passwordHash = null;
      }

      await db
        .update(siteAccess)
        .set(updates)
        .where(eq(siteAccess.siteId, input.siteId));

      // Invalidate access cache
      await cacheDelete(CacheKey.access(input.siteId));

      return { success: true };
    }),

  // Verify site password (public - for visitors)
  // Returns a token that can be stored in a cookie for future access
  verifyPassword: publicProcedure
    .input(
      z.object({
        siteId: z.string(),
        password: z.string(),
      })
    )
    .handler(async ({ input }) => {
      const access = await db
        .select({ passwordHash: siteAccess.passwordHash })
        .from(siteAccess)
        .where(eq(siteAccess.siteId, input.siteId))
        .get();

      if (!access?.passwordHash) {
        throw new Error("Site is not password protected");
      }

      const valid = await verifyPassword(input.password, access.passwordHash);
      if (!valid) {
        return { valid: false, token: null };
      }
      // Return the hash as a token - the static server will compare this
      return { valid: true, token: access.passwordHash };
    }),

  // List invites for a site
  listInvites: protectedProcedure
    .input(z.object({ siteId: z.string() }))
    .handler(async ({ input, context }) => {
      const userId = context.session.user.id;

      // Check access (admin+ can list invites)
      await requireSitePermission(input.siteId, userId, "admin");

      const invites = await db
        .select()
        .from(siteInvite)
        .where(eq(siteInvite.siteId, input.siteId));

      return invites;
    }),

  // Create an invite for a private site
  createInvite: protectedProcedure
    .input(
      z.object({
        siteId: z.string(),
        email: z.email(),
        expiresInDays: z.number().min(1).max(365).optional(),
      })
    )
    .handler(async ({ input, context }) => {
      const userId = context.session.user.id;

      // Check permission (admin+ can create invites)
      await requireSitePermission(input.siteId, userId, "admin");

      // Check if invite already exists
      const existing = await db
        .select({ id: siteInvite.id })
        .from(siteInvite)
        .where(
          and(
            eq(siteInvite.siteId, input.siteId),
            eq(siteInvite.email, input.email)
          )
        )
        .get();

      if (existing) {
        throw new Error("Invite already exists for this email");
      }

      const inviteId = generateId();
      const expiresAt = input.expiresInDays
        ? new Date(Date.now() + input.expiresInDays * 24 * 60 * 60 * 1000)
        : undefined;

      await db.insert(siteInvite).values({
        id: inviteId,
        siteId: input.siteId,
        email: input.email,
        invitedBy: userId,
        expiresAt,
      });

      return { id: inviteId };
    }),

  // Delete an invite
  deleteInvite: protectedProcedure
    .input(z.object({ inviteId: z.string() }))
    .handler(async ({ input, context }) => {
      const userId = context.session.user.id;

      // Get invite to find siteId
      const invite = await db
        .select({ siteId: siteInvite.siteId })
        .from(siteInvite)
        .where(eq(siteInvite.id, input.inviteId))
        .get();

      if (!invite) {
        throw new Error("Invite not found");
      }

      // Check permission (admin+ can delete invites)
      await requireSitePermission(invite.siteId, userId, "admin");

      await db.delete(siteInvite).where(eq(siteInvite.id, input.inviteId));

      return { success: true };
    }),

  // Check if user/email has access to a private site (public - for site serving)
  checkAccess: publicProcedure
    .input(
      z.object({
        siteId: z.string(),
        email: z.email().optional(),
        userId: z.string().optional(),
      })
    )
    .handler(async ({ input }): Promise<AccessResult> => {
      const access = await db
        .select({ accessType: siteAccess.accessType })
        .from(siteAccess)
        .where(eq(siteAccess.siteId, input.siteId))
        .get();

      if (!access) {
        return { allowed: false, reason: "site_not_found" };
      }

      const accessType = access.accessType;

      if (accessType === "public") {
        return { allowed: true };
      }

      if (accessType === "password") {
        return { allowed: false, reason: "password_required" };
      }

      if (accessType === "owner_only") {
        return input.userId
          ? checkOwnerOnlyAccess(input.siteId, input.userId)
          : { allowed: false, reason: "login_required" };
      }

      if (accessType === "private") {
        return checkPrivateAccess(input.siteId, input.userId, input.email);
      }

      return { allowed: false, reason: "unknown_access_type" };
    }),
};

async function checkOwnerOnlyAccess(
  siteId: string,
  userId: string
): Promise<AccessResult> {
  const memberStatus = await isSiteMember(siteId, userId);
  return memberStatus
    ? { allowed: true }
    : { allowed: false, reason: "not_a_member" };
}

async function checkPrivateAccess(
  siteId: string,
  userId?: string,
  email?: string
): Promise<AccessResult> {
  if (userId) {
    const memberStatus = await isSiteMember(siteId, userId);
    if (memberStatus) {
      return { allowed: true };
    }
  }

  if (email) {
    return checkInvite(siteId, email);
  }

  return { allowed: false, reason: "not_invited" };
}
