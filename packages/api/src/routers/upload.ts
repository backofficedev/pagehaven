import { protectedProcedure } from "../index";
import { getDeploymentFromContext } from "../lib/check-site-permission";
import {
  deleteFiles,
  getContentType,
  getDeploymentFileKey,
  listFiles,
  uploadFile,
} from "../lib/storage";
import {
  deploymentIdSchema,
  uploadFileSchema,
  uploadFilesSchema,
} from "../schemas/upload";

/** Decode base64 string to ArrayBuffer */
function decodeBase64(content: string): ArrayBuffer {
  const binaryString = atob(content);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.codePointAt(i) ?? 0;
  }
  return bytes.buffer; // Uint8Array.buffer is already an ArrayBuffer
}

/** Validate deployment is in uploadable state */
function assertUploadableDeployment(status: string): void {
  if (status !== "pending" && status !== "processing") {
    throw new Error("Cannot upload to a finalized deployment");
  }
}

export const uploadRouter = {
  // Upload a single file to a deployment
  // Note: For large files, consider using presigned URLs instead
  uploadFile: protectedProcedure
    .input(uploadFileSchema)
    .handler(async ({ input, context }) => {
      const { deployment: dep } = await getDeploymentFromContext(
        context,
        input.deploymentId,
        "editor"
      );

      assertUploadableDeployment(dep.status);

      const buffer = decodeBase64(input.content);

      const key = getDeploymentFileKey(
        dep.siteId,
        input.deploymentId,
        input.filePath
      );

      const contentType = input.contentType ?? getContentType(input.filePath);

      const uploaded = await uploadFile(key, buffer, contentType);

      return {
        key: uploaded.key,
        size: uploaded.size,
        contentType: uploaded.contentType,
      };
    }),

  // Upload multiple files at once (batch upload)
  uploadFiles: protectedProcedure
    .input(uploadFilesSchema)
    .handler(async ({ input, context }) => {
      const { deployment: dep } = await getDeploymentFromContext(
        context,
        input.deploymentId,
        "editor"
      );

      assertUploadableDeployment(dep.status);

      const uploaded: Array<{ filePath: string; key: string; size: number }> =
        [];

      for (const file of input.files) {
        const buffer = decodeBase64(file.content);

        const key = getDeploymentFileKey(
          dep.siteId,
          input.deploymentId,
          file.filePath
        );

        const contentType = file.contentType ?? getContentType(file.filePath);

        const uploadedFile = await uploadFile(key, buffer, contentType);
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
    .input(deploymentIdSchema)
    .handler(async ({ input, context }) => {
      const { deployment: dep } = await getDeploymentFromContext(
        context,
        input.deploymentId,
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
    .input(deploymentIdSchema)
    .handler(async ({ input, context }) => {
      const { deployment: dep } = await getDeploymentFromContext(
        context,
        input.deploymentId,
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
