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

const PORT = 3002;
const app = await createApp("static");
const stage = app.stage;

// Global env
const WEB_DOMAIN = getDomainByEnvironment(stage, alchemy.env.WEB_DOMAIN || "");
const STATIC_DOMAIN = getDomainByEnvironment(
  stage,
  alchemy.env.STATIC_DOMAIN || ""
);
const WEB_URL = buildUrl(stage, WEB_DOMAIN);
const CORS_ORIGIN = buildUrl(stage, STATIC_DOMAIN);
const BETTER_AUTH_URL = buildUrl(stage, STATIC_DOMAIN);

// Local env
const BETTER_AUTH_SECRET = alchemy.secret.env.BETTER_AUTH_SECRET || "";

const envBindings = {
  WEB_URL,
  CORS_ORIGIN,
  BETTER_AUTH_URL,
  BETTER_AUTH_SECRET,
} as const;
const domains = isDevelopmentEnvironment(stage) ? undefined : [STATIC_DOMAIN];
const routes = isDevelopmentEnvironment(stage)
  ? undefined
  : [{ pattern: `*.{${STATIC_DOMAIN}/*}` }];

console.log(`Domains -> ${domains}`);
console.log(`Routes -> ${routes}`);
for (const [key, value] of Object.entries(envBindings)) {
  console.log(`${key} -> ${value}`);
}

const { db, storage, cache } = await createSharedResources(stage);
const bindings = { DB: db, STORAGE: storage, CACHE: cache, ...envBindings };
export const staticWorker = await createWorker<typeof bindings>({
  name: "static",
  port: PORT,
  entrypoint: path.join(import.meta.dirname, "src/index.ts"),
  domains,
  routes,
  bindings,
});

console.log(`${app.appName} -> ${staticWorker.url}`);

await app.finalize();
