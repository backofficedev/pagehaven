import path from "node:path";
import { createSharedResources } from "@pagehaven/infra/resources";
import alchemy from "alchemy";
import { Worker } from "alchemy/cloudflare";
import { config } from "dotenv";

config({ path: path.join(import.meta.dirname, "../../.env") });
config({ path: path.join(import.meta.dirname, ".env") });

const app = await alchemy("static");
const PORT = 3002;

const { db, storage, cache } = await createSharedResources();

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
