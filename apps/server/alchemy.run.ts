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

const PORT = 3000;
const app = await alchemy("server");

// Global env
const STAGE = alchemy.env.STAGE || "";
const SERVER_DOMAIN = alchemy.env.SERVER_DOMAIN || "";
const CORS_ORIGIN = addProtocolFromStage(STAGE, alchemy.env.WEB_DOMAIN || ""); // web URL
const STATIC_DOMAIN = alchemy.env.STATIC_DOMAIN || ""; // static domain
const BETTER_AUTH_URL = addProtocolFromStage(STAGE, SERVER_DOMAIN); // server URL

// Local env
const BETTER_AUTH_SECRET = alchemy.secret.env.BETTER_AUTH_SECRET || "";
const GITHUB_CLIENT_ID = alchemy.env.GITHUB_CLIENT_ID || "";
const GITHUB_CLIENT_SECRET = alchemy.secret.env.GITHUB_CLIENT_SECRET || "";

const domains = STAGE !== "dev" ? [SERVER_DOMAIN] : undefined;
const envBindings = {
  CORS_ORIGIN,
  STATIC_DOMAIN,
  BETTER_AUTH_URL,
  BETTER_AUTH_SECRET,
  GITHUB_CLIENT_ID,
  GITHUB_CLIENT_SECRET,
} as const;

console.log(`Domains -> ${domains}`);
for (const [key, value] of Object.entries(envBindings)) {
  console.log(`${key} -> ${value}`);
}

const { db, storage, cache } = await createSharedResources();
const bindings = { DB: db, STORAGE: storage, CACHE: cache, ...envBindings };
export const serverWorker = await createWorker<typeof bindings>(
  "server",
  PORT,
  {
    domains,
    bindings,
  }
);

console.log(`Server Worker -> ${serverWorker.url}`);

await app.finalize();
