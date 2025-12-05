import { db } from "@pagehaven/db";
import { site, siteAccess, siteMember } from "@pagehaven/db/schema/site";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { protectedProcedure } from "../index";
import { invalidateSiteCache } from "../lib/cache";
import { requireSitePermission } from "../lib/check-site-permission";
import { hasPermission } from "../lib/permissions";

function generateId(): string {
  return crypto.randomUUID();
}

// Validate subdomain format
const subdomainSchema = z
  .string()
  .min(3)
  .max(63)
  .regex(
    /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/,
    "Subdomain must be lowercase alphanumeric with optional hyphens, cannot start or end with hyphen"
  );

export const siteRouter = {
  // List all sites the user has access to
  list: protectedProcedure.handler(async ({ context }) => {
    const userId = context.session.user.id;

    const memberships = await db
      .select({
        site,
        role: siteMember.role,
      })
      .from(siteMember)
      .innerJoin(site, eq(siteMember.siteId, site.id))
      .where(eq(siteMember.userId, userId));

    return memberships.map((m) => ({
      ...m.site,
      role: m.role,
    }));
  }),

  // Get a single site by ID (with permission check)
  get: protectedProcedure
    .input(z.object({ siteId: z.string() }))
    .handler(async ({ input, context }) => {
      const userId = context.session.user.id;

      const membership = await db
        .select({
          site,
          role: siteMember.role,
        })
        .from(siteMember)
        .innerJoin(site, eq(siteMember.siteId, site.id))
        .where(
          and(
            eq(siteMember.siteId, input.siteId),
            eq(siteMember.userId, userId)
          )
        )
        .get();

      if (!membership) {
        throw new Error("Site not found or access denied");
      }

      return {
        ...membership.site,
        role: membership.role,
      };
    }),

  // Create a new site
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(100),
        subdomain: subdomainSchema,
        description: z.string().max(500).optional(),
      })
    )
    .handler(async ({ input, context }) => {
      const userId = context.session.user.id;
      const siteId = generateId();
      const accessId = generateId();
      const memberId = generateId();

      // Check subdomain availability
      const existing = await db
        .select({ id: site.id })
        .from(site)
        .where(eq(site.subdomain, input.subdomain))
        .get();

      if (existing) {
        throw new Error("Subdomain is already taken");
      }

      // Create site, access config, and owner membership in transaction
      await db.batch([
        db.insert(site).values({
          id: siteId,
          name: input.name,
          subdomain: input.subdomain,
          description: input.description,
          createdBy: userId,
        }),
        db.insert(siteAccess).values({
          id: accessId,
          siteId,
          accessType: "public",
        }),
        db.insert(siteMember).values({
          id: memberId,
          siteId,
          userId,
          role: "owner",
        }),
      ]);

      return { id: siteId, subdomain: input.subdomain };
    }),

  // Update site details (requires admin+)
  update: protectedProcedure
    .input(
      z.object({
        siteId: z.string(),
        name: z.string().min(1).max(100).optional(),
        description: z.string().max(500).optional(),
        customDomain: z.string().max(253).nullable().optional(),
      })
    )
    .handler(async ({ input, context }) => {
      const userId = context.session.user.id;

      // Check permission (admin+ can update site)
      await requireSitePermission(input.siteId, userId, "admin");

      const updates: Partial<typeof site.$inferInsert> = {};
      if (input.name !== undefined) {
        updates.name = input.name;
      }
      if (input.description !== undefined) {
        updates.description = input.description;
      }
      if (input.customDomain !== undefined) {
        updates.customDomain = input.customDomain;
      }

      if (Object.keys(updates).length === 0) {
        throw new Error("No updates provided");
      }

      // Get current site data for cache invalidation
      const currentSite = await db
        .select({ subdomain: site.subdomain, customDomain: site.customDomain })
        .from(site)
        .where(eq(site.id, input.siteId))
        .get();

      await db.update(site).set(updates).where(eq(site.id, input.siteId));

      // Invalidate cache
      if (currentSite) {
        await invalidateSiteCache(
          input.siteId,
          currentSite.subdomain,
          currentSite.customDomain
        );
        // Also invalidate new custom domain if changed
        if (
          input.customDomain &&
          input.customDomain !== currentSite.customDomain
        ) {
          await invalidateSiteCache(
            input.siteId,
            undefined,
            input.customDomain
          );
        }
      }

      return { success: true };
    }),

  // Delete a site (requires owner)
  delete: protectedProcedure
    .input(z.object({ siteId: z.string() }))
    .handler(async ({ input, context }) => {
      const userId = context.session.user.id;

      // Check permission (owner only can delete site)
      await requireSitePermission(
        input.siteId,
        userId,
        "owner",
        "Only owners can delete sites"
      );

      // Get site data for cache invalidation before deleting
      const siteData = await db
        .select({ subdomain: site.subdomain, customDomain: site.customDomain })
        .from(site)
        .where(eq(site.id, input.siteId))
        .get();

      // Cascade delete handles members, access, invites, deployments
      await db.delete(site).where(eq(site.id, input.siteId));

      // Invalidate cache
      if (siteData) {
        await invalidateSiteCache(
          input.siteId,
          siteData.subdomain,
          siteData.customDomain
        );
      }

      return { success: true };
    }),

  // Check subdomain availability
  checkSubdomain: protectedProcedure
    .input(z.object({ subdomain: subdomainSchema }))
    .handler(async ({ input }) => {
      const existing = await db
        .select({ id: site.id })
        .from(site)
        .where(eq(site.subdomain, input.subdomain))
        .get();

      return { available: !existing };
    }),

  // Add a member to a site (requires admin+)
  addMember: protectedProcedure
    .input(
      z.object({
        siteId: z.string(),
        userId: z.string(),
        role: z.enum(["owner", "admin", "editor", "viewer"]),
      })
    )
    .handler(async ({ input, context }) => {
      const currentUserId = context.session.user.id;

      // Check permission (admin+ can add members)
      const currentRole = await requireSitePermission(
        input.siteId,
        currentUserId,
        "admin"
      );

      // Cannot add someone with higher role than yourself
      if (!hasPermission(currentRole, input.role)) {
        throw new Error("Cannot assign a role higher than your own");
      }

      // Check if already a member
      const existing = await db
        .select({ id: siteMember.id })
        .from(siteMember)
        .where(
          and(
            eq(siteMember.siteId, input.siteId),
            eq(siteMember.userId, input.userId)
          )
        )
        .get();

      if (existing) {
        throw new Error("User is already a member");
      }

      await db.insert(siteMember).values({
        id: generateId(),
        siteId: input.siteId,
        userId: input.userId,
        role: input.role,
        invitedBy: currentUserId,
      });

      return { success: true };
    }),

  // Remove a member from a site
  removeMember: protectedProcedure
    .input(
      z.object({
        siteId: z.string(),
        userId: z.string(),
      })
    )
    .handler(async ({ input, context }) => {
      const currentUserId = context.session.user.id;

      // Check permission
      const [currentMembership, targetMembership] = await Promise.all([
        db
          .select({ role: siteMember.role })
          .from(siteMember)
          .where(
            and(
              eq(siteMember.siteId, input.siteId),
              eq(siteMember.userId, currentUserId)
            )
          )
          .get(),
        db
          .select({ role: siteMember.role })
          .from(siteMember)
          .where(
            and(
              eq(siteMember.siteId, input.siteId),
              eq(siteMember.userId, input.userId)
            )
          )
          .get(),
      ]);

      if (
        !(currentMembership && hasPermission(currentMembership.role, "admin"))
      ) {
        throw new Error("Permission denied");
      }

      if (!targetMembership) {
        throw new Error("User is not a member");
      }

      // Cannot remove someone with equal or higher role (unless removing self)
      if (
        input.userId !== currentUserId &&
        !hasPermission(currentMembership.role, targetMembership.role)
      ) {
        throw new Error("Cannot remove a member with equal or higher role");
      }

      // Prevent removing the last owner
      if (targetMembership.role === "owner") {
        const ownerCount = await db
          .select({ id: siteMember.id })
          .from(siteMember)
          .where(
            and(
              eq(siteMember.siteId, input.siteId),
              eq(siteMember.role, "owner")
            )
          );

        if (ownerCount.length <= 1) {
          throw new Error("Cannot remove the last owner");
        }
      }

      await db
        .delete(siteMember)
        .where(
          and(
            eq(siteMember.siteId, input.siteId),
            eq(siteMember.userId, input.userId)
          )
        );

      return { success: true };
    }),

  // List members of a site
  listMembers: protectedProcedure
    .input(z.object({ siteId: z.string() }))
    .handler(async ({ input, context }) => {
      const userId = context.session.user.id;

      // Check if user has access to this site (viewer+ can list members)
      await requireSitePermission(
        input.siteId,
        userId,
        "viewer",
        "Access denied"
      );

      const members = await db
        .select()
        .from(siteMember)
        .where(eq(siteMember.siteId, input.siteId));

      return members;
    }),
};
