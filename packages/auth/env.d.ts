import type { serverWorker } from "../../apps/server/alchemy.run";

// This file infers types for the cloudflare:workers environment from your Alchemy Worker.
// @see https://alchemy.run/concepts/bindings/#type-safe-bindings

export type CloudflareEnv = typeof serverWorker.Env;

declare global {
  type Env = CloudflareEnv;
}

declare module "cloudflare:workers" {
  // biome-ignore lint/style/noNamespace: <Cloudflare workers need this>
  namespace Cloudflare {
    // biome-ignore lint/nursery/noShadow: <Cloudflare workers need this>
    export interface Env extends CloudflareEnv {}
  }
}
