import path from "node:path";
import { loadEnvIfNotCI } from "@pagehaven/config/env";
import { getInfraName } from "@pagehaven/infra/constants";
import {
  buildUrl,
  getDomainEnvVar,
  getEnvVar,
  getSecretEnvVar,
  isDevelopmentEnvironment,
} from "@pagehaven/infra/helpers";
import {
  createApp,
  createSharedResources,
  createWorker,
} from "@pagehaven/infra/resources";

loadEnvIfNotCI({ envDir: path.join(import.meta.dirname, "../../") });
loadEnvIfNotCI({ envDir: import.meta.dirname });

const PORT = 3000;
const app = await createApp(getInfraName().SERVER_APP_NAME);
const stage = app.stage;

// Global env
const SERVER_DOMAIN = getDomainEnvVar(stage, "SERVER_DOMAIN");
const WEB_DOMAIN = getDomainEnvVar(stage, "WEB_DOMAIN");
const STATIC_DOMAIN = getDomainEnvVar(stage, "STATIC_DOMAIN");
const WEB_URL = buildUrl(stage, WEB_DOMAIN);
const SERVER_URL = buildUrl(stage, SERVER_DOMAIN);
const CORS_ORIGIN = WEB_URL;
const BETTER_AUTH_URL = SERVER_URL;

// Local env
const BETTER_AUTH_SECRET = getSecretEnvVar("BETTER_AUTH_SECRET");
const APP_GITHUB_CLIENT_ID = getEnvVar("APP_GITHUB_CLIENT_ID");
const APP_GITHUB_CLIENT_SECRET = getSecretEnvVar("APP_GITHUB_CLIENT_SECRET");

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
export const serverWorker = await createWorker<typeof bindings>({
  port: PORT,
  entrypoint: path.join(import.meta.dirname, "src/index.ts"),
  domains,
  bindings,
});

console.log(`${app.appName} -> ${serverWorker.url}`);

await app.finalize();
