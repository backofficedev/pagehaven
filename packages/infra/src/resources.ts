import path from "node:path";
import { D1Database, KVNamespace, R2Bucket } from "alchemy/cloudflare";

const MIGRATIONS_DIR = path.join(import.meta.dirname, "../db/src/migrations");

/**
 * Creates shared Cloudflare resources (D1, R2, KV) with adopt: true.
 * Call this within your alchemy app context.
 */
export async function createSharedResources() {
  const db = await D1Database("database", {
    name: "pagehaven-database",
    migrationsDir: MIGRATIONS_DIR,
    adopt: true,
  });

  const storage = await R2Bucket("storage", {
    name: "pagehaven-storage",
    adopt: true,
  });

  const cache = await KVNamespace("cache", {
    title: "pagehaven-cache",
    adopt: true,
  });

  return { db, storage, cache };
}
