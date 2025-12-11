import path from "node:path";
import { addProtocolFromStage } from "@pagehaven/infra/helpers";
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
const STATIC_DOMAIN = alchemy.env.STATIC_DOMAIN || "";
const SERVER_DOMAIN = alchemy.env.SERVER_DOMAIN || "";
const WEB_URL = addProtocolFromStage(STAGE, alchemy.env.WEB_DOMAIN || "");
const CORS_ORIGIN = addProtocolFromStage(STAGE, alchemy.env.WEB_DOMAIN || "");
const BETTER_AUTH_URL = addProtocolFromStage(STAGE, SERVER_DOMAIN);

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
