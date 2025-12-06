import { createORPCClient } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import type { AppRouterClient } from "@pagehaven/api/routers/index";

export type { AppRouterClient } from "@pagehaven/api/routers/index";

export type ClientConfig = {
  baseUrl: string;
  getToken?: () => string | undefined;
  credentials?: RequestCredentials;
};

/**
 * Create an oRPC link with the given configuration
 */
export function createLink(config: ClientConfig) {
  return new RPCLink({
    url: `${config.baseUrl}/rpc`,
    fetch(_url, options) {
      const headers = new Headers((options as RequestInit)?.headers);

      const token = config.getToken?.();
      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }

      return fetch(_url, {
        ...options,
        headers,
        credentials: config.credentials,
      });
    },
  });
}

/**
 * Create an oRPC client for the Pagehaven API
 */
export function createClient(config: ClientConfig): AppRouterClient {
  const link = createLink(config);
  return createORPCClient(link);
}
