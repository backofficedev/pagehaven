import { z } from "zod";
import { protectedProcedure } from "../index";
import { getDeploymentWithPermission } from "../lib/check-site-permission";
import {
  deleteFiles,
  getContentType,
  getDeploymentFileKey,
  listFiles,
  uploadFile,
} from "../lib/storage";

export const uploadRouter = {
  // Upload a single file to a deployment
  // Note: For large files, consider using presigned URLs instead
  uploadFile: protectedProcedure
    .input(
      z.object({
        deploymentId: z.string(),
        filePath: z.string().min(1),
        content: z.string(), // Base64 encoded content
        contentType: z.string().optional(),
      })
    )
    .handler(async ({ input, context }) => {
      const userId = context.session.user.id;
      const { deployment: dep } = await getDeploymentWithPermission(
        input.deploymentId,
        userId,
        "editor"
      );

      if (dep.status !== "pending" && dep.status !== "processing") {
        throw new Error("Cannot upload to a finalized deployment");
      }

      // Decode base64 content
      const binaryString = atob(input.content);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.codePointAt(i) ?? 0;
      }

      const key = getDeploymentFileKey(
        dep.siteId,
        input.deploymentId,
        input.filePath
      );

      const contentType = input.contentType ?? getContentType(input.filePath);

      const uploaded = await uploadFile(key, bytes.buffer, contentType);

      return {
        key: uploaded.key,
        size: uploaded.size,
        contentType: uploaded.contentType,
      };
    }),

  // Upload multiple files at once (batch upload)
  uploadFiles: protectedProcedure
    .input(
      z.object({
        deploymentId: z.string(),
        files: z.array(
          z.object({
            filePath: z.string().min(1),
            content: z.string(), // Base64 encoded
            contentType: z.string().optional(),
          })
        ),
      })
    )
    .handler(async ({ input, context }) => {
      const userId = context.session.user.id;
      const { deployment: dep } = await getDeploymentWithPermission(
        input.deploymentId,
        userId,
        "editor"
      );

      if (dep.status !== "pending" && dep.status !== "processing") {
        throw new Error("Cannot upload to a finalized deployment");
      }

      const uploaded: Array<{ filePath: string; key: string; size: number }> =
        [];

      for (const file of input.files) {
        // Decode base64 content
        const binaryString = atob(file.content);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.codePointAt(i) ?? 0;
        }

        const key = getDeploymentFileKey(
          dep.siteId,
          input.deploymentId,
          file.filePath
        );

        const contentType = file.contentType ?? getContentType(file.filePath);

        const uploadedFile = await uploadFile(key, bytes.buffer, contentType);
        uploaded.push({
          filePath: file.filePath,
          key: uploadedFile.key,
          size: uploadedFile.size,
        });
      }

      return { uploaded, count: uploaded.length };
    }),

  // List files in a deployment
  listDeploymentFiles: protectedProcedure
    .input(z.object({ deploymentId: z.string() }))
    .handler(async ({ input, context }) => {
      const userId = context.session.user.id;
      const { deployment: dep } = await getDeploymentWithPermission(
        input.deploymentId,
        userId,
        "viewer"
      );

      const prefix = `sites/${dep.siteId}/deployments/${input.deploymentId}/`;
      const files = await listFiles(prefix);

      // Strip the prefix from keys to get relative paths
      return files.map((f) => ({
        path: f.key.replace(prefix, ""),
        size: f.size,
        lastModified: f.lastModified,
      }));
    }),

  // Delete all files for a deployment (cleanup)
  deleteDeploymentFiles: protectedProcedure
    .input(z.object({ deploymentId: z.string() }))
    .handler(async ({ input, context }) => {
      const userId = context.session.user.id;
      const { deployment: dep } = await getDeploymentWithPermission(
        input.deploymentId,
        userId,
        "admin",
        "Permission denied - admin required"
      );

      const prefix = `sites/${dep.siteId}/deployments/${input.deploymentId}/`;
      const files = await listFiles(prefix);

      if (files.length > 0) {
        await deleteFiles(files.map((f) => f.key));
      }

      return { deleted: files.length };
    }),
};
