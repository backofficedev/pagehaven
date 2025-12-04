import path from "node:path";
import { createSharedResources } from "@pagehaven/infra/resources";
import alchemy from "alchemy";
import { Worker } from "alchemy/cloudflare";
import { config } from "dotenv";

config({ path: path.join(import.meta.dirname, "../../.env") });
config({ path: path.join(import.meta.dirname, ".env") });

const app = await alchemy("server");
const PORT = 3000;

const { db, storage, cache } = await createSharedResources();

export const server = await Worker("server", {
  entrypoint: path.join(import.meta.dirname, "src/index.ts"),
  compatibility: "node",
  bindings: {
    DB: db,
    STORAGE: storage,
    CACHE: cache,
    CORS_ORIGIN: alchemy.env.CORS_ORIGIN || "",
    BETTER_AUTH_SECRET: alchemy.secret(alchemy.env.BETTER_AUTH_SECRET),
    BETTER_AUTH_URL: alchemy.env.BETTER_AUTH_URL || "",
    STATIC_DOMAIN: alchemy.env.STATIC_DOMAIN || "",
  },
  dev: {
    port: PORT,
  },
});

console.log(`Server -> ${server.url}`);

await app.finalize();
