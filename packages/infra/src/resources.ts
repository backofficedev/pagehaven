import path from "node:path";
import { findWorkspaceRoot } from "@pagehaven/config/path";
import alchemy from "alchemy";
import {
  type Bindings,
  D1Database,
  KVNamespace,
  R2Bucket,
  Worker,
  type WorkerProps,
  Zone,
} from "alchemy/cloudflare";
import { CloudflareStateStore } from "alchemy/state";
import { getInfraName } from "./constants";

const WORKSPACE_ROOT = findWorkspaceRoot(import.meta.dirname);
const MIGRATIONS_DIR = path.join(WORKSPACE_ROOT, "packages/db/src/migrations");

/**
 * Creates shared Cloudflare resources (D1, R2, KV) with adopt: true.
 * The adopt: true flag ensures existing resources are reused rather than recreated.
 * Call this within your alchemy app context.
 */
export async function createSharedResources(stage: string) {
  const infraName = getInfraName();
  const db = await D1Database("database", {
    name: `${infraName.SHARED_RESOURCE_PREFIX}-${stage}-database`,
    migrationsDir: MIGRATIONS_DIR,
    adopt: true,
  });

  const storage = await R2Bucket("storage", {
    name: `${infraName.SHARED_RESOURCE_PREFIX}-${stage}-storage`,
    adopt: true,
  });

  const cache = await KVNamespace("cache", {
    title: `${infraName.SHARED_RESOURCE_PREFIX}-${stage}-cache`,
    adopt: true,
  });

  return { db, storage, cache };
}

function useCloudflareStateStore() {
  // Use Cloudflare State Store in CI or production for local destroy
  return process.env.CI || process.env.STAGE === "prod";
}

export async function createApp(appName: string) {
  return await alchemy(appName, {
    stateStore: useCloudflareStateStore()
      ? (scope) =>
          new CloudflareStateStore(scope, {
            scriptName: `${getInfraName().SHARED_RESOURCE_PREFIX}-alchemy-state-service`,
          })
      : undefined,
  });
}

export async function createZone(zoneName: string) {
  return await Zone(zoneName, {
    name: zoneName,
  });
}

type CreateWorkerOptions<B extends Bindings> = {
  port: number;
} & Required<Pick<WorkerProps<B>, "entrypoint" | "bindings">> &
  Pick<WorkerProps<B>, "domains" | "routes">;

export async function createWorker<const B extends Bindings>(
  options: CreateWorkerOptions<B>
) {
  return await Worker(getInfraName().RESOURCE_NAME, {
    compatibility: "node",
    entrypoint: options.entrypoint,
    domains: options.domains,
    routes: options.routes,
    bindings: options.bindings,
    placement: {
      mode: "smart",
    },
    dev: {
      port: options.port,
    },
  });
}
