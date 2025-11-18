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

// Helper function to serve site files
async function serveSiteFile(
  ctx: any,
  slug: string,
  filePath: string
): Promise<Response> {
  // Get the site by slug
  const site = await ctx.runQuery(api.sites.getSiteBySlug, { slug });
  
  if (!site || !site.siteFilesId) {
    return new Response("Site not found", { status: 404 });
  }

  // Check authentication and access
  const userId = await getAuthUserId(ctx);
  
  // Check if user can access the site
  const canAccess = await ctx.runQuery(api.sites.checkSiteAccess, {
    siteId: site._id,
    userId: userId || undefined,
  });

  if (!canAccess) {
    return new Response("Access denied", { status: 403 });
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
      const text = await file.async('string');
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

// Serve static sites - root path (just slug)
http.route({
  path: "/{slug}",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    const url = new URL(request.url);
    const slug = url.pathname.slice(1).split('/')[0]; // Get slug (first path segment)
    const filePath = url.pathname.slice(slug.length + 1); // Get remaining path (empty for root)
    
    return serveSiteFile(ctx, slug, filePath);
  }),
});

// Serve static sites - catch-all for sub-paths
http.route({
  path: "/{slug}/*",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    const url = new URL(request.url);
    const pathSegments = url.pathname.slice(1).split('/');
    const slug = pathSegments[0]; // Get slug (first path segment)
    const filePath = pathSegments.slice(1).join('/'); // Get remaining path
    
    return serveSiteFile(ctx, slug, filePath);
  }),
});

export default http;
