/**
 * Application configuration derived from environment variables
 */
export const config = {
  /** Server URL for API calls */
  serverUrl: import.meta.env.VITE_SERVER_URL || "",
  /** Domain for static sites */
  staticDomain: import.meta.env.VITE_STATIC_DOMAIN || "",
} as const;

/**
 * Get the full URL for a site's subdomain
 */
export function getSiteUrl(subdomain: string): string {
  const domain = config.staticDomain;
  const protocol = domain.includes("localhost") ? "http" : "https";
  return `${protocol}://${subdomain}.${domain}`;
}

/**
 * Get the display domain for a site (e.g., "mysite.pagehaven.io")
 */
export function getSiteDisplayDomain(subdomain: string): string {
  return `${subdomain}.${config.staticDomain}`;
}
