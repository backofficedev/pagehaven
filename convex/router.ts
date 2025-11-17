import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { api } from "./_generated/api";

const http = httpRouter();

// Serve static sites
http.route({
  path: "/{slug}",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    const url = new URL(request.url);
    const slug = url.pathname.slice(1); // Remove leading slash
    
    // Get the site by slug
    const site = await ctx.runQuery(api.sites.getSiteBySlug, { slug });
    
    if (!site || !site.siteFilesId) {
      return new Response("Site not found", { status: 404 });
    }

    // Get the ZIP file from storage
    const zipBlob = await ctx.storage.get(site.siteFilesId);
    if (!zipBlob) {
      return new Response("Site files not found", { status: 404 });
    }

    // For now, return a simple message indicating the site exists
    // In a full implementation, you'd extract the ZIP and serve the appropriate file
    return new Response(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${site.name}</title>
          <style>
            body { 
              font-family: system-ui, -apple-system, sans-serif; 
              max-width: 800px; 
              margin: 2rem auto; 
              padding: 2rem;
              line-height: 1.6;
            }
            .container { 
              text-align: center; 
              background: #f8f9fa; 
              padding: 3rem; 
              border-radius: 8px; 
              border: 1px solid #e9ecef;
            }
            .title { 
              color: #495057; 
              margin-bottom: 1rem; 
            }
            .message { 
              color: #6c757d; 
              margin-bottom: 2rem;
            }
            .note {
              background: #fff3cd;
              border: 1px solid #ffeaa7;
              color: #856404;
              padding: 1rem;
              border-radius: 4px;
              margin-top: 2rem;
              text-align: left;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h1 class="title">🎉 Site "${site.name}" Found!</h1>
            <p class="message">Your site files have been uploaded successfully.</p>
            <div class="note">
              <strong>Note:</strong> This is a placeholder page. In a full implementation, 
              the system would extract your ZIP file and serve the actual HTML content. 
              The ZIP file contains your static site files and is stored securely.
            </div>
          </div>
        </body>
      </html>
    `, {
      headers: {
        "Content-Type": "text/html",
      },
    });
  }),
});

export default http;
