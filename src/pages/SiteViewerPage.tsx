import { useParams } from "react-router-dom";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { SiteNavBar } from "../components/SiteNavBar";
import { getConvexHttpUrl } from "../lib/utils";

export function SiteViewerPage() {
  const { slug, "*": filePath } = useParams<{ slug: string; "*": string }>();
  
  // Get the file path from the URL (everything after /view/:slug/)
  const actualFilePath = filePath || "";
  
  // Get site info to check access and get siteId
  const site = useQuery(
    api.sites.getSiteBySlug,
    slug ? { slug } : "skip"
  );
  
  // Construct the iframe src URL with a query parameter to skip navbar injection
  // Add cache-busting parameter to ensure fresh content
  const iframeSrc = slug 
    ? `${getConvexHttpUrl(`${slug}/${actualFilePath}`)}?noNavbar=1&_t=${Date.now()}`
    : "";

  if (!slug) {
    return (
      <div className="min-h-screen bg-gray-50">
        <SiteNavBar />
        <main className="max-w-7xl mx-auto px-6 py-8">
          <div className="text-center py-12">
            <div className="text-red-600 mb-4">Invalid site URL</div>
          </div>
        </main>
      </div>
    );
  }

  if (site === undefined) {
    return (
      <div className="min-h-screen bg-gray-50">
        <SiteNavBar />
        <main className="max-w-7xl mx-auto px-6 py-8">
          <div className="text-center py-12">
            <div className="animate-pulse">Loading site...</div>
          </div>
        </main>
      </div>
    );
  }

  if (site === null) {
    return (
      <div className="min-h-screen bg-gray-50">
        <SiteNavBar />
        <main className="max-w-7xl mx-auto px-6 py-8">
          <div className="text-center py-12">
            <div className="text-red-600 mb-4">Site not found or access denied</div>
            <a
              href="/sites"
              className="text-indigo-600 hover:text-indigo-700 underline"
            >
              Back to Sites
            </a>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-50 flex flex-col overflow-hidden">
      <SiteNavBar siteId={site._id} showDashboard showSharing />
      <div className="flex-1 overflow-hidden">
        <iframe
          src={iframeSrc}
          className="w-full h-full border-0"
          title={`${site.slug} - ${actualFilePath || 'index'}`}
          sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-modals"
        />
      </div>
    </div>
  );
}

