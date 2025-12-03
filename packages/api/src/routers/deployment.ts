import { db } from "@pagehaven/db";
import {
  deployment,
  type SiteRole,
  site,
  siteMember,
} from "@pagehaven/db/schema/site";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { protectedProcedure } from "../index";
import { hasPermission } from "../lib/permissions";

function generateId(): string {
  return crypto.randomUUID();
}

export const deploymentRouter = {
  // List deployments for a site
  list: protectedProcedure
    .input(
      z.object({
        siteId: z.string(),
        limit: z.number().min(1).max(100).default(20),
        offset: z.number().min(0).default(0),
      })
    )
    .handler(async ({ input, context }) => {
      const userId = context.session.user.id;

      // Check access
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

      const deployments = await db
        .select()
        .from(deployment)
        .where(eq(deployment.siteId, input.siteId))
        .orderBy(desc(deployment.createdAt))
        .limit(input.limit)
        .offset(input.offset);

      return deployments;
    }),

  // Get a single deployment
  get: protectedProcedure
    .input(z.object({ deploymentId: z.string() }))
    .handler(async ({ input, context }) => {
      const userId = context.session.user.id;

      const result = await db
        .select({
          deployment,
          role: siteMember.role,
        })
        .from(deployment)
        .innerJoin(siteMember, eq(deployment.siteId, siteMember.siteId))
        .where(
          and(
            eq(deployment.id, input.deploymentId),
            eq(siteMember.userId, userId)
          )
        )
        .get();

      if (!result) {
        throw new Error("Deployment not found or access denied");
      }

      return result.deployment;
    }),

  // Create a new deployment (requires editor+)
  // Note: This creates the deployment record. File upload is handled separately.
  create: protectedProcedure
    .input(
      z.object({
        siteId: z.string(),
        commitHash: z.string().max(40).optional(),
        commitMessage: z.string().max(500).optional(),
      })
    )
    .handler(async ({ input, context }) => {
      const userId = context.session.user.id;

      // Check permission
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
        !(membership && hasPermission(membership.role as SiteRole, "editor"))
      ) {
        throw new Error("Permission denied");
      }

      const deploymentId = generateId();
      // Storage path follows pattern: sites/{siteId}/deployments/{deploymentId}/
      const storagePath = `sites/${input.siteId}/deployments/${deploymentId}/`;

      await db.insert(deployment).values({
        id: deploymentId,
        siteId: input.siteId,
        storagePath,
        status: "pending",
        commitHash: input.commitHash,
        commitMessage: input.commitMessage,
        deployedBy: userId,
      });

      return { id: deploymentId, storagePath };
    }),

  // Mark deployment as processing (after files uploaded)
  markProcessing: protectedProcedure
    .input(z.object({ deploymentId: z.string() }))
    .handler(async ({ input, context }) => {
      const userId = context.session.user.id;

      // Verify ownership and get deployment
      const result = await db
        .select({
          deployment,
          role: siteMember.role,
        })
        .from(deployment)
        .innerJoin(siteMember, eq(deployment.siteId, siteMember.siteId))
        .where(
          and(
            eq(deployment.id, input.deploymentId),
            eq(siteMember.userId, userId)
          )
        )
        .get();

      if (!(result && hasPermission(result.role as SiteRole, "editor"))) {
        throw new Error("Permission denied");
      }

      if (result.deployment.status !== "pending") {
        throw new Error("Deployment is not in pending state");
      }

      await db
        .update(deployment)
        .set({ status: "processing" })
        .where(eq(deployment.id, input.deploymentId));

      return { success: true };
    }),

  // Finalize deployment (mark as live and update site's active deployment)
  finalize: protectedProcedure
    .input(
      z.object({
        deploymentId: z.string(),
        fileCount: z.number().min(0),
        totalSize: z.number().min(0),
      })
    )
    .handler(async ({ input, context }) => {
      const userId = context.session.user.id;

      // Verify ownership and get deployment
      const result = await db
        .select({
          deployment,
          role: siteMember.role,
        })
        .from(deployment)
        .innerJoin(siteMember, eq(deployment.siteId, siteMember.siteId))
        .where(
          and(
            eq(deployment.id, input.deploymentId),
            eq(siteMember.userId, userId)
          )
        )
        .get();

      if (!(result && hasPermission(result.role as SiteRole, "editor"))) {
        throw new Error("Permission denied");
      }

      if (result.deployment.status !== "processing") {
        throw new Error("Deployment is not in processing state");
      }

      // Update deployment and site's active deployment
      await db.batch([
        db
          .update(deployment)
          .set({
            status: "live",
            fileCount: input.fileCount,
            totalSize: input.totalSize,
            finishedAt: new Date(),
          })
          .where(eq(deployment.id, input.deploymentId)),
        db
          .update(site)
          .set({ activeDeploymentId: input.deploymentId })
          .where(eq(site.id, result.deployment.siteId)),
      ]);

      return { success: true };
    }),

  // Mark deployment as failed
  markFailed: protectedProcedure
    .input(z.object({ deploymentId: z.string() }))
    .handler(async ({ input, context }) => {
      const userId = context.session.user.id;

      // Verify ownership
      const result = await db
        .select({
          deployment,
          role: siteMember.role,
        })
        .from(deployment)
        .innerJoin(siteMember, eq(deployment.siteId, siteMember.siteId))
        .where(
          and(
            eq(deployment.id, input.deploymentId),
            eq(siteMember.userId, userId)
          )
        )
        .get();

      if (!(result && hasPermission(result.role as SiteRole, "editor"))) {
        throw new Error("Permission denied");
      }

      await db
        .update(deployment)
        .set({ status: "failed", finishedAt: new Date() })
        .where(eq(deployment.id, input.deploymentId));

      return { success: true };
    }),

  // Rollback to a previous deployment (requires admin+)
  rollback: protectedProcedure
    .input(z.object({ deploymentId: z.string() }))
    .handler(async ({ input, context }) => {
      const userId = context.session.user.id;

      // Verify ownership and get deployment
      const result = await db
        .select({
          deployment,
          role: siteMember.role,
        })
        .from(deployment)
        .innerJoin(siteMember, eq(deployment.siteId, siteMember.siteId))
        .where(
          and(
            eq(deployment.id, input.deploymentId),
            eq(siteMember.userId, userId)
          )
        )
        .get();

      if (!(result && hasPermission(result.role as SiteRole, "admin"))) {
        throw new Error("Permission denied - admin required for rollback");
      }

      if (result.deployment.status !== "live") {
        throw new Error("Can only rollback to a live deployment");
      }

      // Update site's active deployment
      await db
        .update(site)
        .set({ activeDeploymentId: input.deploymentId })
        .where(eq(site.id, result.deployment.siteId));

      return { success: true };
    }),
};
