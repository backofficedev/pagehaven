import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { useEffect, useRef } from "react";
import { api } from "../../../../convex/_generated/api";
import { SiteNavBar } from "../../../components/SiteNavBar";
import { getConvexHttpUrl } from "../../../lib/utils";

export const Route = createFileRoute("/view/$slug/$")({
    component: SiteViewerPage,
});

function SiteViewerPage() {
    const params = Route.useParams();
    const { slug } = params;
    const filePath = (params as any)._splat;
    const navigate = useNavigate();
    const iframeRef = useRef<HTMLIFrameElement>(null);

    // Get the file path from the URL (everything after /view/:slug/)
    const actualFilePath = filePath || "";

    // Get site info to check access and get siteId
    const site = useQuery(
        api.sites.getSiteBySlug,
        slug ? { slug } : "skip"
    );

    // Construct the iframe src URL
    // Use the file path as part of the key to ensure iframe updates when path changes
    const iframeSrc = slug
        ? getConvexHttpUrl(`${slug}/${actualFilePath}`)
        : "";

    // Listen for navigation messages from the iframe
    useEffect(() => {
        const handleMessage = (event: MessageEvent) => {
            // Verify message is from our iframe (check origin if needed)
            if (event.data && event.data.type === 'pagehaven-navigation') {
                const newPath = event.data.path || '';

                // Only update if the path is different from current
                const currentPath = actualFilePath;
                if (newPath !== currentPath && slug) {
                    const newUrl = newPath ? `/view/${slug}/${newPath}` : `/view/${slug}`;
                    navigate({ to: newUrl, replace: true });
                }
            }
        };

        window.addEventListener('message', handleMessage);

        return () => {
            window.removeEventListener('message', handleMessage);
        };
    }, [slug, navigate, actualFilePath]);

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
                    key={`${slug}-${actualFilePath}`}
                    ref={iframeRef}
                    src={iframeSrc}
                    className="w-full h-full border-0"
                    title={`${site.slug} - ${actualFilePath || 'index'}`}
                    sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-modals"
                />
            </div>
        </div>
    );
}
