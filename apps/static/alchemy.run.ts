import path from "node:path";
import { loadEnvIfNotCI } from "@pagehaven/config/env";
import { getInfraName } from "@pagehaven/infra/constants";
import {
  buildUrl,
  getDomainEnvVar,
  getSecretEnvVar,
  isDevelopmentEnvironment,
} from "@pagehaven/infra/helpers";
import {
  createApp,
  createSharedResources,
  createWorker,
  createZone,
} from "@pagehaven/infra/resources";

loadEnvIfNotCI({ envDir: path.join(import.meta.dirname, "../../") });
loadEnvIfNotCI({ envDir: import.meta.dirname });

const PORT = 3002;
const app = await createApp(getInfraName().STATIC_APP_NAME);
const stage = app.stage;

// Global env
const WEB_DOMAIN = getDomainEnvVar(stage, "WEB_DOMAIN");
const STATIC_DOMAIN = getDomainEnvVar(stage, "STATIC_DOMAIN");
const WEB_URL = buildUrl(stage, WEB_DOMAIN);
const CORS_ORIGIN = buildUrl(stage, STATIC_DOMAIN);
const BETTER_AUTH_URL = buildUrl(stage, STATIC_DOMAIN);

// Local env
const BETTER_AUTH_SECRET = getSecretEnvVar("BETTER_AUTH_SECRET");

const envBindings = {
  WEB_URL,
  CORS_ORIGIN,
  BETTER_AUTH_URL,
  BETTER_AUTH_SECRET,
} as const;
const domains = isDevelopmentEnvironment(stage) ? undefined : [STATIC_DOMAIN];
const zone = await createZone(STATIC_DOMAIN);
const routes = isDevelopmentEnvironment(stage)
  ? undefined
  : [{ pattern: `*.{${STATIC_DOMAIN}/*}`, zoneId: zone.id }];

console.log(`Domains -> ${domains}`);
console.log(`Routes -> ${routes}`);
for (const [key, value] of Object.entries(envBindings)) {
  console.log(`${key} -> ${value}`);
}

const { db, storage, cache } = await createSharedResources(stage);
const bindings = { DB: db, STORAGE: storage, CACHE: cache, ...envBindings };
export const staticWorker = await createWorker<typeof bindings>({
  port: PORT,
  entrypoint: path.join(import.meta.dirname, "src/index.ts"),
  domains,
  routes,
  bindings,
});

console.log(`${app.appName} -> ${staticWorker.url}`);

await app.finalize();
