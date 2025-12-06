import { createORPCClient } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import type { AppRouterClient } from "@pagehaven/api/routers/index";

export type { AppRouterClient } from "@pagehaven/api/routers/index";

export type NodeClientConfig = {
  baseUrl: string;
  token?: string;
};

/**
 * Create an oRPC client configured for Node.js environments (CLI, scripts)
 * Uses Bearer token authentication instead of cookies
 */
export function createNodeClient(config: NodeClientConfig): AppRouterClient {
  const link = new RPCLink({
    url: `${config.baseUrl}/rpc`,
    fetch(_url, options) {
      const headers = new Headers((options as RequestInit)?.headers);

      if (config.token) {
        headers.set("Authorization", `Bearer ${config.token}`);
      }

      return fetch(_url, {
        ...options,
        headers,
      });
    },
  });

  return createORPCClient(link);
}
