import { db } from "@pagehaven/db";
import { domainVerification } from "@pagehaven/db/schema/analytics";
import { type SiteRole, site, siteMember } from "@pagehaven/db/schema/site";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { protectedProcedure } from "../index";

const roleHierarchy: Record<SiteRole, number> = {
  owner: 4,
  admin: 3,
  editor: 2,
  viewer: 1,
};

function hasPermission(userRole: SiteRole, requiredRole: SiteRole): boolean {
  return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
}

function generateId(): string {
  return crypto.randomUUID();
}

function generateVerificationToken(): string {
  return `pagehaven-verify-${crypto.randomUUID()}`;
}

export const domainRouter = {
  // Add a custom domain to verify
  add: protectedProcedure
    .input(
      z.object({
        siteId: z.string(),
        domain: z
          .string()
          .regex(
            /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/i
          ),
      })
    )
    .handler(async ({ input, context }) => {
      const userId = context.session.user.id;

      // Check permission (admin+)
      const membership = await db
        .select({ role: siteMember.role })
        .from(siteMember)
        .where(
          and(
            eq(siteMember.siteId, input.siteId),
            eq(siteMember.userId, userId)
          )
        )
        .get();

      if (
        !(membership && hasPermission(membership.role as SiteRole, "admin"))
      ) {
        throw new Error("Permission denied");
      }

      // Check if domain is already in use
      const existing = await db
        .select({ id: domainVerification.id })
        .from(domainVerification)
        .where(eq(domainVerification.domain, input.domain.toLowerCase()))
        .get();

      if (existing) {
        throw new Error("Domain is already registered");
      }

      const token = generateVerificationToken();
      const id = generateId();

      await db.insert(domainVerification).values({
        id,
        siteId: input.siteId,
        domain: input.domain.toLowerCase(),
        verificationToken: token,
        status: "pending",
      });

      return {
        id,
        domain: input.domain.toLowerCase(),
        verificationToken: token,
        instructions: {
          type: "TXT",
          name: `_pagehaven.${input.domain}`,
          value: token,
        },
      };
    }),

  // Check verification status
  verify: protectedProcedure
    .input(z.object({ domainId: z.string() }))
    .handler(async ({ input, context }) => {
      const userId = context.session.user.id;

      const domainRecord = await db
        .select()
        .from(domainVerification)
        .where(eq(domainVerification.id, input.domainId))
        .get();

      if (!domainRecord) {
        throw new Error("Domain not found");
      }

      // Check permission
      const membership = await db
        .select({ role: siteMember.role })
        .from(siteMember)
        .where(
          and(
            eq(siteMember.siteId, domainRecord.siteId),
            eq(siteMember.userId, userId)
          )
        )
        .get();

      if (
        !(membership && hasPermission(membership.role as SiteRole, "admin"))
      ) {
        throw new Error("Permission denied");
      }

      // In production, this would do actual DNS lookup
      // For now, we'll simulate verification
      const isVerified = await checkDnsRecord(
        domainRecord.domain,
        domainRecord.verificationToken
      );

      const now = new Date();

      if (isVerified) {
        // Update domain status and site's custom domain
        await db
          .update(domainVerification)
          .set({
            status: "verified",
            verifiedAt: now,
            lastCheckedAt: now,
          })
          .where(eq(domainVerification.id, input.domainId));

        await db
          .update(site)
          .set({ customDomain: domainRecord.domain })
          .where(eq(site.id, domainRecord.siteId));

        return { verified: true, domain: domainRecord.domain };
      }

      await db
        .update(domainVerification)
        .set({ lastCheckedAt: now })
        .where(eq(domainVerification.id, input.domainId));

      return { verified: false, domain: domainRecord.domain };
    }),

  // List domains for a site
  list: protectedProcedure
    .input(z.object({ siteId: z.string() }))
    .handler(async ({ input, context }) => {
      const userId = context.session.user.id;

      // Check membership
      const membership = await db
        .select({ role: siteMember.role })
        .from(siteMember)
        .where(
          and(
            eq(siteMember.siteId, input.siteId),
            eq(siteMember.userId, userId)
          )
        )
        .get();

      if (!membership) {
        throw new Error("Access denied");
      }

      const domains = await db
        .select()
        .from(domainVerification)
        .where(eq(domainVerification.siteId, input.siteId));

      return domains;
    }),

  // Remove a domain
  remove: protectedProcedure
    .input(z.object({ domainId: z.string() }))
    .handler(async ({ input, context }) => {
      const userId = context.session.user.id;

      const domainRecord = await db
        .select({
          siteId: domainVerification.siteId,
          domain: domainVerification.domain,
        })
        .from(domainVerification)
        .where(eq(domainVerification.id, input.domainId))
        .get();

      if (!domainRecord) {
        throw new Error("Domain not found");
      }

      // Check permission
      const membership = await db
        .select({ role: siteMember.role })
        .from(siteMember)
        .where(
          and(
            eq(siteMember.siteId, domainRecord.siteId),
            eq(siteMember.userId, userId)
          )
        )
        .get();

      if (
        !(membership && hasPermission(membership.role as SiteRole, "admin"))
      ) {
        throw new Error("Permission denied");
      }

      // Clear custom domain from site if it matches
      await db
        .update(site)
        .set({ customDomain: null })
        .where(
          and(
            eq(site.id, domainRecord.siteId),
            eq(site.customDomain, domainRecord.domain)
          )
        );

      await db
        .delete(domainVerification)
        .where(eq(domainVerification.id, input.domainId));

      return { success: true };
    }),
};

// Placeholder for DNS verification - in production would use DNS lookup
function checkDnsRecord(_domain: string, _expectedToken: string): boolean {
  // In production, this would:
  // 1. Query DNS for TXT record at _pagehaven.{domain}
  // 2. Check if the record contains the expected token
  // For now, return false (manual verification required)
  return false;
}
