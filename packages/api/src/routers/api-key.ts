import { db } from "@pagehaven/db";
import { apiKey } from "@pagehaven/db/schema/api-key";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { protectedProcedure } from "../index";
import { generateApiKey, getKeyPrefix, hashApiKey } from "../lib/api-key-auth";
import { calculateExpiresAt, expiresInDaysSchema } from "../lib/expiration";

function generateId(): string {
  return crypto.randomUUID();
}

/**
 * Verifies that an API key belongs to the specified user.
 * Throws an error if the key is not found or doesn't belong to the user.
 */
async function verifyKeyOwnership(
  keyId: string,
  userId: string
): Promise<void> {
  const existing = await db
    .select({ id: apiKey.id })
    .from(apiKey)
    .where(and(eq(apiKey.id, keyId), eq(apiKey.userId, userId)))
    .get();

  if (!existing) {
    throw new Error("API key not found");
  }
}

// Available scopes for API keys
export const apiKeyScopes = ["*", "deploy", "read", "write"] as const;
export type ApiKeyScope = (typeof apiKeyScopes)[number];

export const apiKeyRouter = {
  // List all API keys for the current user
  list: protectedProcedure.handler(async ({ context }) => {
    const userId = context.session.user.id;

    const keys = await db
      .select({
        id: apiKey.id,
        name: apiKey.name,
        keyPrefix: apiKey.keyPrefix,
        scopes: apiKey.scopes,
        lastUsedAt: apiKey.lastUsedAt,
        expiresAt: apiKey.expiresAt,
        createdAt: apiKey.createdAt,
      })
      .from(apiKey)
      .where(eq(apiKey.userId, userId));

    return keys.map((k) => ({
      ...k,
      scopes: k.scopes.split(","),
    }));
  }),

  // Create a new API key
  // Returns the raw key ONCE - it cannot be retrieved again
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(100),
        scopes: z.array(z.enum(apiKeyScopes)).default(["*"]),
        expiresInDays: expiresInDaysSchema,
      })
    )
    .handler(async ({ input, context }) => {
      const userId = context.session.user.id;

      const rawKey = generateApiKey();
      const keyHash = await hashApiKey(rawKey);
      const keyPrefix = getKeyPrefix(rawKey);

      const expiresAt = calculateExpiresAt(input.expiresInDays);

      const id = generateId();

      await db.insert(apiKey).values({
        id,
        userId,
        name: input.name,
        keyHash,
        keyPrefix,
        scopes: input.scopes.join(","),
        expiresAt,
      });

      // Return the raw key - this is the only time it's available
      return {
        id,
        name: input.name,
        key: rawKey,
        keyPrefix,
        scopes: input.scopes,
        expiresAt,
      };
    }),

  // Revoke (delete) an API key
  revoke: protectedProcedure
    .input(z.object({ keyId: z.string() }))
    .handler(async ({ input, context }) => {
      const userId = context.session.user.id;
      await verifyKeyOwnership(input.keyId, userId);
      await db.delete(apiKey).where(eq(apiKey.id, input.keyId));
      return { success: true };
    }),

  // Update an API key's name or scopes
  update: protectedProcedure
    .input(
      z.object({
        keyId: z.string(),
        name: z.string().min(1).max(100).optional(),
        scopes: z.array(z.enum(apiKeyScopes)).optional(),
      })
    )
    .handler(async ({ input, context }) => {
      const userId = context.session.user.id;
      await verifyKeyOwnership(input.keyId, userId);

      const updates: Partial<typeof apiKey.$inferInsert> = {};
      if (input.name !== undefined) {
        updates.name = input.name;
      }
      if (input.scopes !== undefined) {
        updates.scopes = input.scopes.join(",");
      }

      if (Object.keys(updates).length === 0) {
        throw new Error("No updates provided");
      }

      await db.update(apiKey).set(updates).where(eq(apiKey.id, input.keyId));

      return { success: true };
    }),
};
