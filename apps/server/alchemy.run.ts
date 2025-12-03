import path from "node:path";
import alchemy from "alchemy";
import { D1Database, R2Bucket, Worker } from "alchemy/cloudflare";
import { config } from "dotenv";

config({ path: path.join(import.meta.dirname, "../../.env") });
config({ path: path.join(import.meta.dirname, ".env") });

const app = await alchemy("server");
const PORT = 3000;

export const db = await D1Database("database", {
  migrationsDir: path.join(
    import.meta.dirname,
    "../../packages/db/src/migrations"
  ),
});

export const storage = await R2Bucket("storage", {
  name: "pagehaven-storage",
});

export const server = await Worker("server", {
  entrypoint: path.join(import.meta.dirname, "src/index.ts"),
  compatibility: "node",
  bindings: {
    DB: db,
    STORAGE: storage,
    CORS_ORIGIN: alchemy.env.CORS_ORIGIN || "",
    BETTER_AUTH_SECRET: alchemy.secret(alchemy.env.BETTER_AUTH_SECRET),
    BETTER_AUTH_URL: alchemy.env.BETTER_AUTH_URL || "",
  },
  dev: {
    port: PORT,
  },
});

console.log(`Server -> ${server.url}`);

await app.finalize();
