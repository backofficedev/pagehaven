import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { api } from "./_generated/api";
import { getAuthUserId } from "@convex-dev/auth/server";
import JSZip from "jszip";

const http = httpRouter();

// Helper function to get MIME type from file extension
function getMimeType(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  const mimeTypes: Record<string, string> = {
    'html': 'text/html',
    'htm': 'text/html',
    'css': 'text/css',
    'js': 'application/javascript',
    'json': 'application/json',
    'png': 'image/png',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'gif': 'image/gif',
    'svg': 'image/svg+xml',
    'webp': 'image/webp',
    'ico': 'image/x-icon',
    'woff': 'font/woff',
    'woff2': 'font/woff2',
    'ttf': 'font/ttf',
    'eot': 'application/vnd.ms-fontobject',
    'otf': 'font/otf',
    'pdf': 'application/pdf',
    'zip': 'application/zip',
    'txt': 'text/plain',
    'xml': 'application/xml',
    'mp4': 'video/mp4',
    'webm': 'video/webm',
    'mp3': 'audio/mpeg',
    'wav': 'audio/wav',
  };
  return mimeTypes[ext] || 'application/octet-stream';
}

// Helper function to normalize file path
function normalizePath(path: string): string {
  // Remove leading slash and decode URL
  let normalized = decodeURIComponent(path);
  if (normalized.startsWith('/')) {
    normalized = normalized.slice(1);
  }
  // Remove query string and hash
  normalized = normalized.split('?')[0].split('#')[0];
  return normalized;
}

// Helper function to generate nav bar HTML
function generateNavBar(siteId: string, siteSlug: string, userId: string | null, isAdmin: boolean, baseUrl: string, dashboardBaseUrl: string): string {
  // Construct dashboard URL
  // In development, the main app runs on localhost:5173
  // In production, this would need to be configured via environment variable
  // For now, we'll try to detect if we're in development (localhost) or use the dashboard base
  let mainAppUrl = dashboardBaseUrl;
  if (baseUrl.includes('localhost') || baseUrl.includes('127.0.0.1')) {
    // Development - use localhost for the main app
    mainAppUrl = 'http://localhost:5173';
  }
  const dashboardUrl = `${mainAppUrl}/sites/${siteId}`;
  
  // Store mainAppUrl in a way that's accessible in the script
  const navBarHTML = `
    <div id="pagehaven-navbar" style="position: fixed; top: 0; left: 0; right: 0; z-index: 10000; background: white; border-bottom: 1px solid #e5e7eb; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
      <div style="max-width: 1280px; margin: 0 auto; padding: 0.75rem 1.5rem; display: flex; justify-content: space-between; align-items: center;">
        <div style="display: flex; align-items: center; gap: 1rem;">
          <a href="/" style="text-decoration: none; color: #4f46e5; font-weight: 600; font-size: 1.25rem;">PageHaven</a>
        </div>
        <div style="display: flex; align-items: center; gap: 0.75rem;">
          ${userId ? `
            ${isAdmin ? `
              <a href="${dashboardUrl}" target="_blank" style="padding: 0.5rem 1rem; background: #4f46e5; color: white; text-decoration: none; border-radius: 0.375rem; font-size: 0.875rem; font-weight: 500; transition: background 0.2s;" onmouseover="this.style.background='#4338ca'" onmouseout="this.style.background='#4f46e5'">Dashboard</a>
              <button id="pagehaven-share-btn" style="padding: 0.5rem 1rem; background: #6b7280; color: white; border: none; border-radius: 0.375rem; font-size: 0.875rem; font-weight: 500; cursor: pointer; transition: background 0.2s;" onmouseover="this.style.background='#4b5563'" onmouseout="this.style.background='#6b7280'">Sharing</button>
            ` : ''}
            <button id="pagehaven-signout-btn" style="padding: 0.5rem 1rem; background: #dc2626; color: white; border: none; border-radius: 0.375rem; font-size: 0.875rem; font-weight: 500; cursor: pointer; transition: background 0.2s;" onmouseover="this.style.background='#b91c1c'" onmouseout="this.style.background='#dc2626'">Sign Out</button>
          ` : `
            <button id="pagehaven-signin-btn" style="padding: 0.5rem 1rem; background: #4f46e5; color: white; border: none; border-radius: 0.375rem; font-size: 0.875rem; font-weight: 500; cursor: pointer; transition: background 0.2s;" onmouseover="this.style.background='#4338ca'" onmouseout="this.style.background='#4f46e5'">Sign In</button>
          `}
        </div>
      </div>
    </div>
    <div style="height: 60px;"></div>
    <script>
      (function() {
        const navbar = document.getElementById('pagehaven-navbar');
        if (!navbar) return;
        
        // Handle sign out
        const signOutBtn = document.getElementById('pagehaven-signout-btn');
        if (signOutBtn) {
          signOutBtn.addEventListener('click', function() {
            // Redirect to sign out endpoint
            window.location.href = '${baseUrl}/api/auth/signout?redirect=' + encodeURIComponent(window.location.href);
          });
        }
        
        // Handle sign in
        const signInBtn = document.getElementById('pagehaven-signin-btn');
        if (signInBtn) {
          signInBtn.addEventListener('click', function() {
            // Redirect to sign in - use the main app URL
            window.location.href = '${mainAppUrl}?redirect=' + encodeURIComponent(window.location.href);
          });
        }
        
        // Handle sharing (for admins)
        const shareBtn = document.getElementById('pagehaven-share-btn');
        if (shareBtn) {
          shareBtn.addEventListener('click', function() {
            const dashboardUrl = '${dashboardUrl}';
            window.open(dashboardUrl + '#members', '_blank');
          });
        }
      })();
    </script>
  `;
  
  return navBarHTML;
}

// Helper function to inject nav bar into HTML
function injectNavBar(html: string, navBar: string): string {
  // Try to inject after <body> tag (at the beginning of body)
  if (html.includes('<body')) {
    // Find the body tag and inject right after it
    const bodyTagMatch = html.match(/<body[^>]*>/i);
    if (bodyTagMatch) {
      const bodyTag = bodyTagMatch[0];
      return html.replace(bodyTag, bodyTag + navBar);
    }
  }
  
  // If no body tag, try to inject before </body> tag
  if (html.includes('</body>')) {
    return html.replace('</body>', navBar + '</body>');
  }
  
  // If no body tag, try to inject before </html>
  if (html.includes('</html>')) {
    return html.replace('</html>', navBar + '</html>');
  }
  
  // If no closing tags, prepend to beginning
  return navBar + html;
}

// Helper function to serve site files
async function serveSiteFile(
  ctx: any,
  slug: string,
  filePath: string,
  requestUrl: string
): Promise<Response> {
  // Get the site by slug
  const site = await ctx.runQuery(api.sites.getSiteBySlug, { slug });
  
  if (!site || !site.siteFilesId) {
    return new Response("Site not found", { status: 404 });
  }

  // Check if site is public - if so, allow access without authentication
  const authMode = site.authMode || "authenticated";
  let userId: string | null = null;
  let isAdmin = false;
  
  if (authMode === "public") {
    // Public site - no authentication required, but check if user is logged in for nav bar
    userId = await getAuthUserId(ctx) || null;
  } else {
    // Authenticated site - check authentication and access
    userId = await getAuthUserId(ctx) || null;
    
    // Check if user can access the site
    const canAccess = await ctx.runQuery(api.sites.checkSiteAccess, {
      siteId: site._id,
      userId: userId || undefined,
    });

    if (!canAccess) {
      return new Response("Access denied. This site requires authentication.", { status: 403 });
    }
  }
  
  // Check if user is admin (for nav bar display)
  if (userId) {
    isAdmin = await ctx.runQuery(api.sites.checkUserIsAdmin, {
      siteId: site._id,
      userId: userId,
    });
  }

    // Get the ZIP file from storage
    const zipBlob = await ctx.storage.get(site.siteFilesId);
    if (!zipBlob) {
      return new Response("Site files not found", { status: 404 });
    }

  try {
    // Convert blob to array buffer for JSZip
    const arrayBuffer = await zipBlob.arrayBuffer();
    const zip = await JSZip.loadAsync(arrayBuffer);
    
    // Normalize the requested file path
    let requestedPath = normalizePath(filePath);
    
    // If no path specified or ends with /, try index.html
    if (!requestedPath || requestedPath === '') {
      requestedPath = 'index.html';
    }
    
    // Try to find the file in the ZIP
    let file = zip.file(requestedPath);
    
    // If not found, try with leading slash
    if (!file) {
      file = zip.file('/' + requestedPath);
    }
    
    // If still not found and it's a directory request, try index.html in that directory
    if (!file) {
      const dirPath = requestedPath.endsWith('/') 
        ? requestedPath + 'index.html'
        : requestedPath + '/index.html';
      file = zip.file(dirPath) || zip.file('/' + dirPath);
    }
    
    // If file not found, return 404
    if (!file) {
      return new Response("File not found", { status: 404 });
    }
    
    // Get file content based on MIME type
    const mimeType = getMimeType(requestedPath);
    let content: Blob;
    
    if (mimeType.startsWith('text/') || mimeType === 'application/javascript' || mimeType === 'application/json') {
      // Text-based files
      let text = await file.async('string');
      
      // Inject nav bar into HTML files
      if (mimeType === 'text/html') {
        // Get the Convex URL from the request URL
        const url = new URL(requestUrl);
        const baseUrl = `${url.protocol}//${url.host}`;
        // Convert .convex.site to .convex.cloud for dashboard links
        const dashboardBaseUrl = baseUrl.replace('.convex.site', '.convex.cloud');
        const navBar = generateNavBar(site._id, slug, userId, isAdmin, baseUrl, dashboardBaseUrl);
        text = injectNavBar(text, navBar);
      }
      
      content = new Blob([text], { type: mimeType });
    } else {
      // Binary files (images, fonts, etc.)
      const binary = await file.async('uint8array');
      // Convert to regular Uint8Array to fix type compatibility
      const uint8Array = new Uint8Array(binary);
      content = new Blob([uint8Array], { type: mimeType });
    }
    
    // Set appropriate headers
    const headers = new Headers({
      'Content-Type': mimeType,
      'Cache-Control': 'public, max-age=3600',
    });
    
    // Add CORS headers for cross-origin requests
    headers.set('Access-Control-Allow-Origin', '*');
    
    return new Response(content, {
      status: 200,
      headers,
    });
  } catch (error) {
    console.error('Error serving site:', error);
    return new Response("Error serving site files", { status: 500 });
  }
}

// Serve static sites - catch-all route for all paths
// This will match any path that doesn't match other routes (like /api/auth/*)
// We need to check if it's a site slug and serve the file, otherwise return 404
http.route({
  pathPrefix: "/",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    const url = new URL(request.url);
    const pathname = url.pathname;
    
    // Skip auth routes and other API routes
    if (pathname.startsWith("/api/")) {
      return new Response("Not found", { status: 404 });
    }
    
    // Parse the path: /slug or /slug/path/to/file
    const pathSegments = pathname.slice(1).split('/').filter(Boolean);
    
    if (pathSegments.length === 0) {
      return new Response("Not found", { status: 404 });
    }
    
    const slug = pathSegments[0];
    const filePath = pathSegments.slice(1).join('/');
    
    return serveSiteFile(ctx, slug, filePath, request.url);
  }),
});

export default http;
