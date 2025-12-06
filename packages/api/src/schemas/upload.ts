import { z } from "zod";

/**
 * Common schema for deployment ID input
 */
export const deploymentIdSchema = z.object({
  deploymentId: z.string(),
});

/**
 * Schema for a single file in an upload batch
 */
export const uploadFileItemSchema = z.object({
  filePath: z.string().min(1),
  content: z.string(), // Base64 encoded
  contentType: z.string().optional(),
});

/**
 * Schema for uploading a single file
 */
export const uploadFileSchema = z.object({
  deploymentId: z.string(),
  filePath: z.string().min(1),
  content: z.string(), // Base64 encoded content
  contentType: z.string().optional(),
});

/**
 * Schema for batch file upload
 */
export const uploadFilesSchema = z.object({
  deploymentId: z.string(),
  files: z.array(uploadFileItemSchema),
});

/**
 * Schema for updating a site
 */
export const updateSiteSchema = z.object({
  siteId: z.string(),
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  customDomain: z.string().max(253).nullable().optional(),
});
