import path from "node:path";
import alchemy from "alchemy";
import { D1Database, KVNamespace, R2Bucket, Worker } from "alchemy/cloudflare";
import { config } from "dotenv";

config({ path: path.join(import.meta.dirname, "../../.env") });
config({ path: path.join(import.meta.dirname, ".env") });

const app = await alchemy("static");
const PORT = 3002;

// Reference the same resources as the server worker
// These are created by the server's alchemy.run.ts
const db = await D1Database("database", {
  migrationsDir: path.join(
    import.meta.dirname,
    "../../packages/db/src/migrations"
  ),
});

const storage = await R2Bucket("storage", {
  name: "pagehaven-storage",
});

const cache = await KVNamespace("cache", {
  title: "pagehaven-cache",
});

export const staticWorker = await Worker("static", {
  entrypoint: path.join(import.meta.dirname, "src/index.ts"),
  compatibility: "node",
  bindings: {
    DB: db,
    STORAGE: storage,
    CACHE: cache,
    WEB_URL: alchemy.env.WEB_URL || "",
    CORS_ORIGIN: alchemy.env.CORS_ORIGIN || "",
    BETTER_AUTH_SECRET: alchemy.secret(alchemy.env.BETTER_AUTH_SECRET),
    BETTER_AUTH_URL: alchemy.env.BETTER_AUTH_URL || "",
  },
  dev: {
    port: PORT,
  },
});

console.log(`Static Worker -> ${staticWorker.url}`);

await app.finalize();
