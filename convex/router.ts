import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { api } from "./_generated/api";
import { getAuthUserId } from "@convex-dev/auth/server";
import JSZip from "jszip";

const http = httpRouter();

// In-memory cache for extracted ZIP files
// Key: siteFilesId, Value: { zip: JSZip, lastUpdated: number }
const zipCache = new Map<string, { zip: JSZip; lastUpdated: number }>();

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

// Helper function to serve site files
async function serveSiteFile(
  ctx: any,
  slug: string,
  filePath: string,
  requestUrl: string,
  request?: Request
): Promise<Response> {
  // Get the site by slug
  const site = await ctx.runQuery(api.sites.getSiteBySlug, { slug });
  
  if (!site || !site.siteFilesId) {
    return new Response("Site not found", { status: 404 });
  }

  // Check if site is public - if so, allow access without authentication
  const authMode = site.authMode || "authenticated";
  let userId: string | null = null;
  
  if (authMode === "public") {
    // Public site - no authentication required
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

    // Try to get ZIP from cache first
    const cacheKey = site.siteFilesId;
    const cached = zipCache.get(cacheKey);
    let zip: JSZip;
    
    // Check if we have a valid cached ZIP
    if (cached && cached.lastUpdated >= (site.lastUpdated || 0)) {
      zip = cached.zip;
    } else {
      // Get the ZIP file from storage
      const zipBlob = await ctx.storage.get(site.siteFilesId);
      if (!zipBlob) {
        return new Response("Site files not found", { status: 404 });
      }

      // Convert blob to array buffer for JSZip
      const arrayBuffer = await zipBlob.arrayBuffer();
      zip = await JSZip.loadAsync(arrayBuffer);
      
      // Cache the ZIP file
      zipCache.set(cacheKey, {
        zip,
        lastUpdated: site.lastUpdated || Date.now(),
      });
      
      // Clean up old cache entries periodically (simple LRU-like behavior)
      if (zipCache.size > 50) {
        // Remove oldest entries (keep most recent 30)
        const entries = Array.from(zipCache.entries());
        entries.sort((a, b) => b[1].lastUpdated - a[1].lastUpdated);
        zipCache.clear();
        entries.slice(0, 30).forEach(([key, value]) => {
          zipCache.set(key, value);
        });
      }
    }

  try {
    
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
      
      // For HTML files, inject a script to intercept link clicks and communicate with parent
      if (mimeType === 'text/html') {
        const navigationScript = `
<script>
(function() {
  function getPathAfterSlug(url) {
    // Extract path after slug from URL like /slug/path/to/file.html
    const pathname = typeof url === 'string' ? url : url.pathname;
    const segments = pathname.split('/').filter(Boolean);
    if (segments.length > 1) {
      return segments.slice(1).join('/');
    }
    return '';
  }
  
  // Prefetch links on hover for faster navigation
  let prefetchTimeout;
  document.addEventListener('mouseover', function(e) {
    const link = e.target.closest('a');
    if (!link) return;
    
    const href = link.getAttribute('href');
    if (!href) return;
    
    // Skip external links, mailto, tel, etc.
    if (href.startsWith('http://') || href.startsWith('https://') || 
        href.startsWith('mailto:') || href.startsWith('tel:') || 
        href.startsWith('javascript:') || href.startsWith('#')) {
      return;
    }
    
    // Prefetch after a short delay (100ms) to avoid prefetching on accidental hovers
    clearTimeout(prefetchTimeout);
    prefetchTimeout = setTimeout(function() {
      try {
        const resolvedUrl = new URL(href, window.location.href);
        // Create a link element to prefetch
        const prefetchLink = document.createElement('link');
        prefetchLink.rel = 'prefetch';
        prefetchLink.href = resolvedUrl.href;
        document.head.appendChild(prefetchLink);
      } catch (e) {
        // Ignore prefetch errors
      }
    }, 100);
  });
  
  document.addEventListener('mouseout', function(e) {
    const link = e.target.closest('a');
    if (link) {
      clearTimeout(prefetchTimeout);
    }
  });
  
  // Intercept all link clicks
  document.addEventListener('click', function(e) {
    const link = e.target.closest('a');
    if (!link) return;
    
    const href = link.getAttribute('href');
    if (!href) return;
    
    // Skip external links, mailto, tel, etc.
    if (href.startsWith('http://') || href.startsWith('https://') || 
        href.startsWith('mailto:') || href.startsWith('tel:') || 
        href.startsWith('javascript:') || href.startsWith('#')) {
      return;
    }
    
    // Prevent default navigation
    e.preventDefault();
    
    // Resolve the href relative to current location
    let resolvedUrl;
    try {
      resolvedUrl = new URL(href, window.location.href);
    } catch (e) {
      // If URL resolution fails, just use the href as-is
      resolvedUrl = new URL(href, window.location.origin);
    }
    
    // Extract the path after the slug
    const pathAfterSlug = getPathAfterSlug(resolvedUrl);
    
    // Send message to parent window BEFORE navigating
    // This allows the parent to update the URL
    if (window.parent && window.parent !== window) {
      window.parent.postMessage({
        type: 'pagehaven-navigation',
        path: pathAfterSlug
      }, '*');
    }
    
    // Navigate within the iframe
    window.location.href = href;
  });
})();
</script>
`;
        // Inject script before closing </body> tag, or at the end if no body tag
        if (text.includes('</body>')) {
          text = text.replace('</body>', navigationScript + '</body>');
        } else if (text.includes('</html>')) {
          text = text.replace('</html>', navigationScript + '</html>');
        } else {
          text = text + navigationScript;
        }
      }
      
      content = new Blob([text], { type: mimeType });
    } else {
      // Binary files (images, fonts, etc.)
      const binary = await file.async('uint8array');
      // Convert to regular Uint8Array to fix type compatibility
      const uint8Array = new Uint8Array(binary);
      content = new Blob([uint8Array], { type: mimeType });
    }
    
    // Set appropriate headers with better caching
    // Static assets can be cached longer, HTML should be shorter
    const isStaticAsset = mimeType.startsWith('image/') || 
                         mimeType.startsWith('font/') || 
                         mimeType === 'text/css' || 
                         mimeType === 'application/javascript';
    const maxAge = isStaticAsset ? 31536000 : 3600; // 1 year for static, 1 hour for HTML
    const cacheControl = `public, max-age=${maxAge}, immutable`;
    
    // Generate ETag for better caching
    const etag = `"${site.siteFilesId}-${requestedPath}-${site.lastUpdated || 0}"`;
    
    const headers = new Headers({
      'Content-Type': mimeType,
      'Cache-Control': cacheControl,
      'ETag': etag,
    });
    
    // Add CORS headers for cross-origin requests
    headers.set('Access-Control-Allow-Origin', '*');
    
    // Check if client has cached version (304 Not Modified)
    if (request) {
      const ifNoneMatch = request.headers.get('if-none-match');
      if (ifNoneMatch === etag) {
        return new Response(null, { status: 304, headers });
      }
    }
    
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
    
    return serveSiteFile(ctx, slug, filePath, request.url, request);
  }),
});

export default http;
