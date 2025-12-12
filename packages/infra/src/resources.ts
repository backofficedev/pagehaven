import fs from "node:fs";
import path from "node:path";
import { REPO_NAME } from "@pagehaven/config/constants";
import alchemy from "alchemy";
import {
  type Bindings,
  D1Database,
  KVNamespace,
  R2Bucket,
  Worker,
  type WorkerProps,
} from "alchemy/cloudflare";
import { CloudflareStateStore } from "alchemy/state";

function findWorkspaceRoot(startDir: string): string {
  let dir = startDir;
  while (dir !== path.dirname(dir)) {
    if (fs.existsSync(path.join(dir, "turbo.json"))) {
      return dir;
    }
    dir = path.dirname(dir);
  }
  throw new Error("Could not find workspace root (turbo.json)");
}

const WORKSPACE_ROOT = findWorkspaceRoot(import.meta.dirname);
const MIGRATIONS_DIR = path.join(WORKSPACE_ROOT, "packages/db/src/migrations");

/**
 * Creates shared Cloudflare resources (D1, R2, KV) with adopt: true.
 * The adopt: true flag ensures existing resources are reused rather than recreated.
 * Call this within your alchemy app context.
 */
export async function createSharedResources(stage: string) {
  const db = await D1Database("database", {
    name: `${REPO_NAME}-${stage}-database`,
    migrationsDir: MIGRATIONS_DIR,
    adopt: true,
  });

  const storage = await R2Bucket("storage", {
    name: `${REPO_NAME}-${stage}-storage`,
    adopt: true,
  });

  const cache = await KVNamespace("cache", {
    title: `${REPO_NAME}-${stage}-cache`,
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
      ? (scope) => new CloudflareStateStore(scope)
      : undefined,
  });
}

type CreateWorkerOptions<B extends Bindings> = {
  name: string;
  port: number;
} & Required<Pick<WorkerProps<B>, "entrypoint" | "bindings">> &
  Pick<WorkerProps<B>, "domains" | "routes">;

export async function createWorker<const B extends Bindings>(
  options: CreateWorkerOptions<B>
) {
  return await Worker(REPO_NAME, {
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
