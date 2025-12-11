import path from "node:path";
import { buildUrl, getDomainByEnvironment } from "@pagehaven/infra/helpers";
import {
  createSharedResources,
  createWorker,
} from "@pagehaven/infra/resources";
import alchemy from "alchemy";
import { config } from "dotenv";

config({ path: path.join(import.meta.dirname, "../../.env") });
config({ path: path.join(import.meta.dirname, ".env") });

const PORT = 3002;
const app = await alchemy("static");

// Global env
const STAGE = alchemy.env.STAGE || "";
const WEB_DOMAIN = getDomainByEnvironment(STAGE, alchemy.env.WEB_DOMAIN || "");
const WEB_URL = buildUrl(STAGE, WEB_DOMAIN);
const STATIC_DOMAIN = getDomainByEnvironment(
  STAGE,
  alchemy.env.STATIC_DOMAIN || ""
);
const CORS_ORIGIN = buildUrl(STAGE, STATIC_DOMAIN);
const BETTER_AUTH_URL = buildUrl(STAGE, STATIC_DOMAIN);

// Local env
const BETTER_AUTH_SECRET = alchemy.secret.env.BETTER_AUTH_SECRET || "";

const domains =
  STAGE !== "dev" ? [STATIC_DOMAIN, `*.${STATIC_DOMAIN}`] : undefined;
const envBindings = {
  WEB_URL,
  CORS_ORIGIN,
  BETTER_AUTH_URL,
  BETTER_AUTH_SECRET,
} as const;

console.log(`Domains -> ${domains}`);
for (const [key, value] of Object.entries(envBindings)) {
  console.log(`${key} -> ${value}`);
}

const { db, storage, cache } = await createSharedResources();
const bindings = { DB: db, STORAGE: storage, CACHE: cache, ...envBindings };
export const staticWorker = await createWorker<typeof bindings>(
  "static",
  PORT,
  {
    domains,
    bindings,
  }
);

console.log(`Static Worker -> ${staticWorker.url}`);

await app.finalize();
