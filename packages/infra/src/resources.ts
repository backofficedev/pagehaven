import fs from "node:fs";
import path from "node:path";
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
    name: `${stage}-database`,
    migrationsDir: MIGRATIONS_DIR,
    adopt: true,
  });

  const storage = await R2Bucket("storage", {
    name: `${stage}-storage`,
    adopt: true,
  });

  const cache = await KVNamespace("cache", {
    title: `${stage}-cache`,
    adopt: true,
  });

  return { db, storage, cache };
}

export async function createApp(name: string) {
  return await alchemy(name, {
    stateStore: process.env.CI
      ? undefined
      : (scope) => new CloudflareStateStore(scope),
  });
}

export async function createWorker<const B extends Bindings>(
  id: string,
  port: number,
  options: Required<Pick<WorkerProps<B>, "entrypoint" | "bindings">> &
    Pick<WorkerProps<B>, "domains">
) {
  return await Worker(id, {
    compatibility: "node",
    entrypoint: options.entrypoint,
    domains: options.domains,
    bindings: options.bindings,
    placement: {
      mode: "smart",
    },
    dev: {
      port,
    },
  });
}
