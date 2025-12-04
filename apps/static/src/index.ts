import { env } from "cloudflare:workers";
import { auth } from "@pagehaven/auth";
import { db } from "@pagehaven/db";
import {
  site,
  siteAccess,
  siteInvite,
  siteMember,
} from "@pagehaven/db/schema/site";
import { getContentType } from "@pagehaven/db/utils/content-type";
import { getFile } from "@pagehaven/db/utils/storage";
import { and, eq } from "drizzle-orm";
import { Hono } from "hono";
import { getCookie } from "hono/cookie";
import { logger } from "hono/logger";

const app = new Hono();

app.use(logger());

// ============ Types ============

type SiteResolution = {
  site: typeof site.$inferSelect;
  accessType: string | null;
  passwordHash: string | null;
};

type AccessCheckResult =
  | { allowed: true }
  | {
      allowed: false;
      reason:
        | "password_required"
        | "login_required"
        | "not_invited"
        | "not_member";
    };

// ============ Site Resolution ============

async function fetchSiteFromDb(
  hostname: string
): Promise<SiteResolution | null> {
  const subdomain = hostname.split(".")[0] ?? "";

  // Try subdomain first
  let result = await db
    .select({
      site,
      accessType: siteAccess.accessType,
      passwordHash: siteAccess.passwordHash,
    })
    .from(site)
    .leftJoin(siteAccess, eq(site.id, siteAccess.siteId))
    .where(eq(site.subdomain, subdomain))
    .get();

  // If not found, try custom domain
  result ??= await db
    .select({
      site,
      accessType: siteAccess.accessType,
      passwordHash: siteAccess.passwordHash,
    })
    .from(site)
    .leftJoin(siteAccess, eq(site.id, siteAccess.siteId))
    .where(eq(site.customDomain, hostname))
    .get();

  return result ?? null;
}

// ============ Access Control ============

function verifyPasswordCookie(
  passwordCookie: string | undefined,
  storedHash: string | null
): boolean {
  if (!(passwordCookie && storedHash)) {
    return false;
  }
  return passwordCookie === storedHash;
}

async function checkMemberAccess(
  siteId: string,
  userId: string | undefined
): Promise<boolean> {
  if (!userId) {
    return false;
  }
  const membership = await db
    .select({ id: siteMember.id })
    .from(siteMember)
    .where(and(eq(siteMember.siteId, siteId), eq(siteMember.userId, userId)))
    .get();
  return !!membership;
}

async function checkInviteAccess(
  siteId: string,
  email: string | undefined
): Promise<boolean> {
  if (!email) {
    return false;
  }
  const invite = await db
    .select({ id: siteInvite.id, expiresAt: siteInvite.expiresAt })
    .from(siteInvite)
    .where(and(eq(siteInvite.siteId, siteId), eq(siteInvite.email, email)))
    .get();

  if (!invite) {
    return false;
  }
  if (invite.expiresAt && invite.expiresAt < new Date()) {
    return false;
  }
  return true;
}

type AccessCheckOptions = {
  siteId: string;
  accessType: string | null;
  passwordHash: string | null;
  passwordCookie: string | undefined;
  userId: string | undefined;
  userEmail: string | undefined;
};

function checkPasswordAccess(
  passwordCookie: string | undefined,
  passwordHash: string | null
): AccessCheckResult {
  const valid = verifyPasswordCookie(passwordCookie, passwordHash);
  return valid
    ? { allowed: true }
    : { allowed: false, reason: "password_required" };
}

async function checkOwnerOnlyAccess(
  siteId: string,
  userId: string | undefined
): Promise<AccessCheckResult> {
  if (!userId) {
    return { allowed: false, reason: "login_required" };
  }
  const isMember = await checkMemberAccess(siteId, userId);
  return isMember
    ? { allowed: true }
    : { allowed: false, reason: "not_member" };
}

async function checkPrivateAccess(
  siteId: string,
  userId: string | undefined,
  userEmail: string | undefined
): Promise<AccessCheckResult> {
  if (userId) {
    const isMember = await checkMemberAccess(siteId, userId);
    if (isMember) {
      return { allowed: true };
    }
  }
  if (userEmail) {
    const isInvited = await checkInviteAccess(siteId, userEmail);
    if (isInvited) {
      return { allowed: true };
    }
  }
  return { allowed: false, reason: userId ? "not_invited" : "login_required" };
}

async function checkAccessPermissions(
  opts: AccessCheckOptions
): Promise<AccessCheckResult> {
  const {
    siteId,
    accessType,
    passwordHash,
    passwordCookie,
    userId,
    userEmail,
  } = opts;

  if (!accessType || accessType === "public") {
    return { allowed: true };
  }

  if (accessType === "password") {
    return checkPasswordAccess(passwordCookie, passwordHash);
  }

  if (accessType === "owner_only") {
    return await checkOwnerOnlyAccess(siteId, userId);
  }

  if (accessType === "private") {
    return await checkPrivateAccess(siteId, userId, userEmail);
  }

  return { allowed: true };
}

// ============ Static File Serving ============

type ServeResult =
  | { success: true; body: ReadableStream; contentType: string; status: 200 }
  | { success: false; status: 404 | 403 | 401; message: string };

async function serveStaticFile(
  siteId: string,
  deploymentId: string,
  path: string
): Promise<ServeResult> {
  let filePath = path.startsWith("/") ? path.slice(1) : path;

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

async function serveFileWithFallback(
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

// ============ Gate Redirects ============

function getGateRedirectUrl(
  reason: string,
  siteId: string,
  originalUrl: string
): string {
  const webUrl = env.WEB_URL || "http://localhost:3001";
  const redirectParam = encodeURIComponent(originalUrl);

  switch (reason) {
    case "password_required":
      return `${webUrl}/gate/password?siteId=${siteId}&redirect=${redirectParam}`;
    case "login_required":
      return `${webUrl}/gate/login?redirect=${redirectParam}`;
    case "not_member":
    case "not_invited":
      return `${webUrl}/gate/denied?reason=${reason}&redirect=${redirectParam}`;
    default:
      return `${webUrl}/gate/denied?reason=unknown`;
  }
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
    const redirectUrl = getGateRedirectUrl(
      accessCheck.reason,
      resolvedSite.id,
      originalUrl
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
