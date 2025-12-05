import { env } from "cloudflare:workers";
import { db } from "@pagehaven/db";
import { site, siteAccess } from "@pagehaven/db/schema/site";
import { eq } from "drizzle-orm";
import type { Context } from "hono";
import { getCookie } from "hono/cookie";
import {
  checkAccessPermissions,
  getAccessDeniedResponse,
} from "./access-control";
import { CacheKey, CacheTTL, cacheGetOrSet } from "./cache";
import { getContentType, getFile } from "./storage";

type ServeResult =
  | { success: true; body: ReadableStream; contentType: string; status: 200 }
  | { success: false; status: 404 | 403 | 401; message: string };

type SiteResolution = {
  site: typeof site.$inferSelect;
  accessType: string | null;
  passwordHash: string | null;
};

function createSiteQuery() {
  return db
    .select({
      site,
      accessType: siteAccess.accessType,
      passwordHash: siteAccess.passwordHash,
    })
    .from(site)
    .leftJoin(siteAccess, eq(site.id, siteAccess.siteId));
}

/**
 * Fetch site data from database
 */
async function fetchSiteFromDb(
  hostname: string
): Promise<SiteResolution | null> {
  const subdomain = hostname.split(".")[0] ?? "";

  // Try subdomain first, then custom domain
  const result =
    (await createSiteQuery().where(eq(site.subdomain, subdomain)).get()) ??
    (await createSiteQuery().where(eq(site.customDomain, hostname)).get());

  return result ?? null;
}

/**
 * Resolve a site from subdomain or custom domain (with caching)
 */
export async function resolveSite(
  hostname: string
): Promise<SiteResolution | null> {
  // Extract subdomain for cache key
  const subdomain = hostname.split(".")[0] ?? "";
  const staticDomain = (env as { STATIC_DOMAIN?: string }).STATIC_DOMAIN || "";
  const isCustomDomain =
    hostname.includes(".") && !hostname.endsWith(`.${staticDomain}`);

  // Use appropriate cache key based on lookup type
  const cacheKey = isCustomDomain
    ? CacheKey.siteByDomain(hostname)
    : CacheKey.siteBySubdomain(subdomain);

  return await cacheGetOrSet<SiteResolution>(cacheKey, CacheTTL.SITE, () =>
    fetchSiteFromDb(hostname)
  );
}

/**
 * Serve a static file from a site's active deployment
 */
export async function serveStaticFile(
  siteId: string,
  deploymentId: string,
  path: string
): Promise<ServeResult> {
  // Normalize path
  let filePath = path.startsWith("/") ? path.slice(1) : path;

  // Default to index.html for root or directory paths
  if (!filePath || filePath.endsWith("/")) {
    filePath = `${filePath}index.html`;
  }

  const key = `sites/${siteId}/deployments/${deploymentId}/${filePath}`;
  const file = await getFile(key);

  if (!file) {
    // Try with .html extension for clean URLs
    const htmlKey = `sites/${siteId}/deployments/${deploymentId}/${filePath}.html`;
    const htmlFile = await getFile(htmlKey);

    if (htmlFile) {
      return {
        success: true,
        body: htmlFile.body,
        contentType: "text/html",
        status: 200,
      };
    }

    // Try index.html in the directory
    const indexKey = `sites/${siteId}/deployments/${deploymentId}/${filePath}/index.html`;
    const indexFile = await getFile(indexKey);

    if (indexFile) {
      return {
        success: true,
        body: indexFile.body,
        contentType: "text/html",
        status: 200,
      };
    }

    return {
      success: false,
      status: 404,
      message: "File not found",
    };
  }

  const contentType = file.metadata.contentType ?? getContentType(filePath);

  return {
    success: true,
    body: file.body,
    contentType,
    status: 200,
  };
}

export async function serveFileWithFallback(
  siteId: string,
  deploymentId: string,
  path: string
): Promise<Response> {
  const result = await serveStaticFile(siteId, deploymentId, path);

  if (result.success) {
    return new Response(result.body, {
      status: 200,
      headers: {
        "Content-Type": result.contentType,
        "Cache-Control": "public, max-age=3600",
        "X-Content-Type-Options": "nosniff",
      },
    });
  }

  // Try custom 404 page
  const custom404 = await serveStaticFile(siteId, deploymentId, "404.html");
  if (custom404.success) {
    return new Response(custom404.body, {
      status: 404,
      headers: {
        "Content-Type": custom404.contentType,
        "Cache-Control": "public, max-age=0",
      },
    });
  }

  return new Response(JSON.stringify({ error: result.message }), {
    status: result.status,
    headers: { "Content-Type": "application/json" },
  });
}

/**
 * Create a Hono handler for serving static sites
 */
export function createStaticSiteHandler() {
  return async (c: Context): Promise<Response> => {
    const hostname = c.req.header("host") ?? "";
    const path = c.req.path;

    const siteData = await resolveSite(hostname);

    if (!siteData?.site) {
      return c.json({ error: "Site not found" }, 404);
    }

    const { site: resolvedSite, accessType, passwordHash } = siteData;

    if (!resolvedSite.activeDeploymentId) {
      return c.json({ error: "No deployment available" }, 404);
    }

    // Get password cookie for this site
    const passwordCookie = getCookie(c, `site_password_${resolvedSite.id}`);

    // User session not available in API handler context - auth is handled by static worker
    const userId: string | undefined = undefined;
    const userEmail: string | undefined = undefined;

    const accessCheck = await checkAccessPermissions({
      siteId: resolvedSite.id,
      accessType,
      passwordHash,
      passwordCookie,
      userId,
      userEmail,
    });

    if (!accessCheck.allowed) {
      const { status, error } = getAccessDeniedResponse(accessCheck.reason);
      return c.json({ error, reason: accessCheck.reason }, status);
    }

    return serveFileWithFallback(
      resolvedSite.id,
      resolvedSite.activeDeploymentId,
      path
    );
  };
}
