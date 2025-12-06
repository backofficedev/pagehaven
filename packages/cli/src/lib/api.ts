import { type AppRouterClient, createNodeClient } from "@pagehaven/client/node";
import { getConfig, getToken } from "./config";

export type { AppRouterClient } from "@pagehaven/client/node";

/**
 * Get the default API client using config from ~/.pagehaven/config.json
 */
export function getApiClient(): AppRouterClient {
  const config = getConfig();
  const token = getToken();
  return createNodeClient({
    baseUrl: config.apiUrl,
    token,
  });
}

/**
 * Create an API client with custom URL and token
 */
export function createApiClient(
  apiUrl: string,
  token?: string
): AppRouterClient {
  return createNodeClient({
    baseUrl: apiUrl,
    token,
  });
}

// Legacy export for backward compatibility during migration
export const api = {
  get sites() {
    return getApiClient().site;
  },
  get deployments() {
    return getApiClient().deployment;
  },
  get upload() {
    return getApiClient().upload;
  },
};
