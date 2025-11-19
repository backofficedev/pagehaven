import { Link, useParams } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { UserButton } from "./UserButton";
import { Id } from "../../convex/_generated/dataModel";

interface SiteNavBarProps {
    siteId?: Id<"sites">;
    showDashboard?: boolean;
    showSharing?: boolean;
}

export function SiteNavBar({ siteId, showDashboard = false, showSharing = false }: SiteNavBarProps) {
    const params = useParams({ strict: false });
    const paramSiteId = (params as any).siteId;
    const actualSiteId = siteId || (paramSiteId as Id<"sites"> | undefined);

    // Get current user
    const user = useQuery(api.users.getUserProfile);

    // Check if user is admin (only if we have a siteId and user)
    const isAdmin = useQuery(
        api.sites.checkUserIsAdmin,
        actualSiteId && user?._id ? { siteId: actualSiteId, userId: user._id } : "skip"
    );

    return (
        <header className="bg-white shadow-sm border-b">
            <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <Link to="/" className="text-2xl font-bold text-indigo-600">
                        PageHaven
                    </Link>
                    <Link
                        to="/sites"
                        className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-indigo-600 hover:bg-gray-50 rounded-md transition-colors"
                    >
                        My Sites
                    </Link>
                </div>
                <div className="flex items-center gap-3">
                    {showDashboard && isAdmin && actualSiteId && (
                        <Link
                            to={`/sites/${actualSiteId}`}
                            className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 transition-colors"
                        >
                            Dashboard
                        </Link>
                    )}
                    {showSharing && isAdmin && actualSiteId && (
                        <Link
                            to={`/sites/${actualSiteId}#members`}
                            className="px-4 py-2 bg-gray-600 text-white text-sm font-medium rounded-md hover:bg-gray-700 transition-colors"
                        >
                            Sharing
                        </Link>
                    )}
                    <UserButton />
                </div>
            </div>
        </header>
    );
}

