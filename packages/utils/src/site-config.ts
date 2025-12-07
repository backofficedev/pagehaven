import { z } from "zod";

/**
 * Access types for site visibility
 * - public: Anyone can view the site
 * - password: Requires a password to view
 * - private: Only invited users can view
 * - owner_only: Only the site owner can view
 */
export const accessTypes = [
  "public",
  "password",
  "private",
  "owner_only",
] as const;
export type AccessType = (typeof accessTypes)[number];

/**
 * Schema for site configuration that can be included in a site upload.
 * This allows preconfiguring site settings via a pagehaven.json or pagehaven.yaml file.
 */
export const siteConfigSchema = z.object({
  /** Schema version for future compatibility */
  version: z.literal(1).default(1),

  /** Site display name */
  name: z.string().min(1).max(100).optional(),

  /** Site description */
  description: z.string().max(500).optional(),

  /** Access control settings */
  access: z
    .object({
      /** Access type for the site */
      type: z.enum(accessTypes).default("public"),

      /** Password for password-protected sites (will be hashed on upload) */
      password: z.string().min(8).optional(),

      /** Email addresses to invite for private sites */
      invites: z.array(z.string().email()).optional(),
    })
    .optional(),

  /** Custom domain configuration */
  domain: z
    .object({
      /** Custom domain (e.g., "example.com") */
      custom: z.string().max(253).optional(),
    })
    .optional(),

  /** Build configuration for static site generators */
  build: z
    .object({
      /** Directory containing the built files (relative to config file) */
      outputDir: z.string().default("dist"),

      /** Files/directories to ignore during upload */
      ignore: z
        .array(z.string())
        .default(["node_modules", ".git", ".DS_Store", "Thumbs.db", "*.log"]),
    })
    .optional(),

  /** Redirect rules */
  redirects: z
    .array(
      z.object({
        /** Source path (supports wildcards) */
        from: z.string(),
        /** Destination path or URL */
        to: z.string(),
        /** HTTP status code (301 for permanent, 302 for temporary) */
        status: z.number().int().min(300).max(399).default(301),
      })
    )
    .optional(),

  /** Custom headers */
  headers: z
    .array(
      z.object({
        /** Path pattern to match */
        path: z.string(),
        /** Headers to add */
        headers: z.record(z.string(), z.string()),
      })
    )
    .optional(),
});

/** Type for the site configuration */
export type SiteConfig = z.infer<typeof siteConfigSchema>;

/** Type for the input (before defaults are applied) */
export type SiteConfigInput = z.input<typeof siteConfigSchema>;

/** Result type for safe parsing */
export type SiteConfigParseResult =
  | { success: true; data: SiteConfig }
  | { success: false; error: z.ZodError };

/**
 * Config file names that are recognized (in order of priority)
 */
export const CONFIG_FILE_NAMES = [
  "pagehaven.json",
  "pagehaven.yaml",
  "pagehaven.yml",
  ".pagehaven.json",
  ".pagehaven.yaml",
  ".pagehaven.yml",
] as const;

/**
 * Validates and parses a site configuration object
 */
export function parseSiteConfig(config: unknown): SiteConfig {
  return siteConfigSchema.parse(config);
}

/**
 * Safely validates a site configuration, returning errors if invalid
 */
export function safeParseSiteConfig(
  config: unknown
): { success: true; data: SiteConfig } | { success: false; error: z.ZodError } {
  return siteConfigSchema.safeParse(config);
}

/**
 * Generates a JSON Schema for the site configuration
 * This can be used for IDE autocompletion and validation
 */
export function generateJsonSchema(): object {
  return {
    $schema: "http://json-schema.org/draft-07/schema#",
    title: "Pagehaven Site Configuration",
    description: "Configuration file for Pagehaven static site hosting",
    type: "object",
    properties: {
      version: {
        type: "integer",
        const: 1,
        description: "Schema version for future compatibility",
      },
      name: {
        type: "string",
        minLength: 1,
        maxLength: 100,
        description: "Site display name",
      },
      description: {
        type: "string",
        maxLength: 500,
        description: "Site description",
      },
      access: {
        type: "object",
        description: "Access control settings",
        properties: {
          type: {
            type: "string",
            enum: accessTypes,
            default: "public",
            description: "Access type for the site",
          },
          password: {
            type: "string",
            minLength: 8,
            description: "Password for password-protected sites",
          },
          invites: {
            type: "array",
            items: { type: "string", format: "email" },
            description: "Email addresses to invite for private sites",
          },
        },
      },
      domain: {
        type: "object",
        description: "Custom domain configuration",
        properties: {
          custom: {
            type: "string",
            maxLength: 253,
            description: "Custom domain (e.g., 'example.com')",
          },
        },
      },
      build: {
        type: "object",
        description: "Build configuration for static site generators",
        properties: {
          outputDir: {
            type: "string",
            default: "dist",
            description: "Directory containing the built files",
          },
          ignore: {
            type: "array",
            items: { type: "string" },
            default: [
              "node_modules",
              ".git",
              ".DS_Store",
              "Thumbs.db",
              "*.log",
            ],
            description: "Files/directories to ignore during upload",
          },
        },
      },
      redirects: {
        type: "array",
        description: "Redirect rules",
        items: {
          type: "object",
          required: ["from", "to"],
          properties: {
            from: {
              type: "string",
              description: "Source path (supports wildcards)",
            },
            to: { type: "string", description: "Destination path or URL" },
            status: {
              type: "integer",
              minimum: 300,
              maximum: 399,
              default: 301,
              description: "HTTP status code",
            },
          },
        },
      },
      headers: {
        type: "array",
        description: "Custom headers",
        items: {
          type: "object",
          required: ["path", "headers"],
          properties: {
            path: { type: "string", description: "Path pattern to match" },
            headers: {
              type: "object",
              additionalProperties: { type: "string" },
              description: "Headers to add",
            },
          },
        },
      },
    },
  };
}
