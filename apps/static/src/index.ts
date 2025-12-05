import { env } from "cloudflare:workers";
import {
  checkAccessPermissions,
  getGateRedirectUrl,
} from "@pagehaven/api/lib/access-control";
import { serveFileWithFallback } from "@pagehaven/api/lib/serve-static";
import { auth } from "@pagehaven/auth";
import { db } from "@pagehaven/db";
import { site, siteAccess } from "@pagehaven/db/schema/site";
import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { getCookie, setCookie } from "hono/cookie";
import { logger } from "hono/logger";

const app = new Hono();

app.use(logger());

// ============ Types ============

type SiteResolution = {
  site: typeof site.$inferSelect;
  accessType: string | null;
  passwordHash: string | null;
};

// ============ Site Resolution ============

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

// ============ Main Handler ============

app.all("/*", async (c) => {
  const hostname = c.req.header("host") ?? "";
  const path = c.req.path;
  const originalUrl = c.req.url;

  // Resolve site from hostname
  const siteData = await fetchSiteFromDb(hostname);

  if (!siteData?.site) {
    return c.json({ error: "Site not found" }, 404);
  }

  const { site: resolvedSite, accessType, passwordHash } = siteData;

  if (!resolvedSite.activeDeploymentId) {
    return c.json({ error: "No deployment available" }, 404);
  }

  // Check for password token in query params (from gate redirect)
  const url = new URL(c.req.url);
  const passwordToken = url.searchParams.get("__pagehaven_token");

  // If token is provided and valid, set cookie and redirect to clean URL
  if (passwordToken && passwordHash && passwordToken === passwordHash) {
    setCookie(c, `site_password_${resolvedSite.id}`, passwordToken, {
      path: "/",
      maxAge: 30 * 24 * 60 * 60, // 30 days
      sameSite: "Lax",
    });
    // Remove the token from URL and redirect
    url.searchParams.delete("__pagehaven_token");
    return c.redirect(url.toString(), 302);
  }

  // Get password cookie for this site
  const passwordCookie = getCookie(c, `site_password_${resolvedSite.id}`);

  // Get user session from Better-Auth
  let userId: string | undefined;
  let userEmail: string | undefined;

  try {
    const session = await auth.api.getSession({
      headers: c.req.raw.headers,
    });
    if (session?.user) {
      userId = session.user.id;
      userEmail = session.user.email;
    }
  } catch {
    // Session extraction failed - user is not authenticated
  }

  // Check access permissions
  const accessCheck = await checkAccessPermissions({
    siteId: resolvedSite.id,
    accessType,
    passwordHash,
    passwordCookie,
    userId,
    userEmail,
  });

  if (!accessCheck.allowed) {
    // Redirect to appropriate gate page
    const webUrl = env.WEB_URL || "http://localhost:3001";
    const redirectUrl = getGateRedirectUrl(
      accessCheck.reason,
      resolvedSite.id,
      originalUrl,
      webUrl
    );
    return c.redirect(redirectUrl, 302);
  }

  // Serve the static file
  return serveFileWithFallback(
    resolvedSite.id,
    resolvedSite.activeDeploymentId,
    path
  );
});

export default app;
