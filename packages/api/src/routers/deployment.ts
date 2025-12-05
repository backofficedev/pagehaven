import { db } from "@pagehaven/db";
import { deployment, site } from "@pagehaven/db/schema/site";
import { desc, eq } from "drizzle-orm";
import { z } from "zod";
import { protectedProcedure } from "../index";
import {
  getDeploymentFromContext,
  requireSitePermissionFromContext,
} from "../lib/check-site-permission";

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
      // Check access (viewer+ can list deployments)
      await requireSitePermissionFromContext(
        context,
        input.siteId,
        "viewer",
        "Access denied"
      );

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
      const { deployment: dep } = await getDeploymentFromContext(
        context,
        input.deploymentId,
        "viewer"
      );
      return dep;
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
      // Check permission (editor+ can create deployments)
      await requireSitePermissionFromContext(context, input.siteId, "editor");

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
        deployedBy: context.session.user.id,
      });

      return { id: deploymentId, storagePath };
    }),

  // Mark deployment as processing (after files uploaded)
  markProcessing: protectedProcedure
    .input(z.object({ deploymentId: z.string() }))
    .handler(async ({ input, context }) => {
      const { deployment: dep } = await getDeploymentFromContext(
        context,
        input.deploymentId,
        "editor"
      );

      if (dep.status !== "pending") {
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
      const { deployment: dep } = await getDeploymentFromContext(
        context,
        input.deploymentId,
        "editor"
      );

      if (dep.status !== "processing") {
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
          .where(eq(site.id, dep.siteId)),
      ]);

      return { success: true };
    }),

  // Mark deployment as failed
  markFailed: protectedProcedure
    .input(z.object({ deploymentId: z.string() }))
    .handler(async ({ input, context }) => {
      await getDeploymentFromContext(context, input.deploymentId, "editor");

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
      const { deployment: dep } = await getDeploymentFromContext(
        context,
        input.deploymentId,
        "admin",
        "Permission denied - admin required for rollback"
      );

      if (dep.status !== "live") {
        throw new Error("Can only rollback to a live deployment");
      }

      // Update site's active deployment
      await db
        .update(site)
        .set({ activeDeploymentId: input.deploymentId })
        .where(eq(site.id, dep.siteId));

      return { success: true };
    }),
};
