import path from "node:path";
import {
  buildUrl,
  getDomainByEnvironment,
  isDevelopmentEnvironment,
} from "@pagehaven/infra/helpers";
import {
  createApp,
  createSharedResources,
  createWorker,
} from "@pagehaven/infra/resources";
import alchemy from "alchemy";
import { config } from "dotenv";

config({ path: path.join(import.meta.dirname, "../../.env") });
config({ path: path.join(import.meta.dirname, ".env") });

const PORT = 3000;
const app = await createApp("server");

// Global env
const stage = app.stage;
const SERVER_DOMAIN = getDomainByEnvironment(
  stage,
  alchemy.env.SERVER_DOMAIN || ""
);
const WEB_DOMAIN = getDomainByEnvironment(stage, alchemy.env.WEB_DOMAIN || "");
const WEB_URL = buildUrl(stage, WEB_DOMAIN);
const CORS_ORIGIN = WEB_URL;
const STATIC_DOMAIN = getDomainByEnvironment(
  stage,
  alchemy.env.STATIC_DOMAIN || ""
);
const SERVER_URL = buildUrl(stage, SERVER_DOMAIN);
const BETTER_AUTH_URL = SERVER_URL;

// Local env
const BETTER_AUTH_SECRET = alchemy.secret.env.BETTER_AUTH_SECRET || "";
const APP_GITHUB_CLIENT_ID = alchemy.env.APP_GITHUB_CLIENT_ID || "";
const APP_GITHUB_CLIENT_SECRET =
  alchemy.secret.env.APP_GITHUB_CLIENT_SECRET || "";

const domains = isDevelopmentEnvironment(stage) ? undefined : [SERVER_DOMAIN];
const envBindings = {
  CORS_ORIGIN,
  STATIC_DOMAIN,
  BETTER_AUTH_URL,
  BETTER_AUTH_SECRET,
  APP_GITHUB_CLIENT_ID,
  APP_GITHUB_CLIENT_SECRET,
} as const;

console.log(`Domains -> ${domains}`);
for (const [key, value] of Object.entries(envBindings)) {
  console.log(`${key} -> ${value}`);
}

const { db, storage, cache } = await createSharedResources(stage);
const bindings = { DB: db, STORAGE: storage, CACHE: cache, ...envBindings };
export const serverWorker = await createWorker<typeof bindings>(
  "server",
  PORT,
  {
    entrypoint: path.join(import.meta.dirname, "src/index.ts"),
    domains,
    bindings,
  }
);

console.log(`Server Worker -> ${serverWorker.url}`);

await app.finalize();
