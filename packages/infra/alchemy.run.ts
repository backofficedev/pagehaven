import path from "node:path";
import alchemy from "alchemy";
import { D1Database, KVNamespace, R2Bucket } from "alchemy/cloudflare";
import { config } from "dotenv";

config({ path: path.join(import.meta.dirname, "../../.env") });

const app = await alchemy("pagehaven-infra");

export const db = await D1Database("database", {
  name: "pagehaven-database",
  migrationsDir: path.join(import.meta.dirname, "../db/src/migrations"),
  adopt: true,
});

export const storage = await R2Bucket("storage", {
  name: "pagehaven-storage",
  adopt: true,
});

export const cache = await KVNamespace("cache", {
  title: "pagehaven-cache",
  adopt: true,
});

await app.finalize();
