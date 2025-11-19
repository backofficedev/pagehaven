import { useMutation } from "convex/react";
import { Link } from "@tanstack/react-router";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { toast } from "sonner";
import { useState } from "react";
import { SiteUpload } from "./SiteUpload";

interface Site {
    _id: Id<"sites">;
    name: string;
    slug: string;
    isUploaded: boolean;
    lastUpdated: number;
    screenshotUrl: string | null;
}

interface SiteCardProps {
    site: Site;
}

export function SiteCard({ site }: SiteCardProps) {
    const deleteSite = useMutation(api.sites.deleteSite);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [showUpload, setShowUpload] = useState(false);

    const handleDelete = async () => {
        try {
            await deleteSite({ siteId: site._id });
            toast.success("Site deleted successfully");
            setShowDeleteConfirm(false);
        } catch (error) {
            toast.error("Failed to delete site");
        }
    };

    const formatDate = (timestamp: number) => {
        return new Date(timestamp).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    return (
        <div className={`bg-white rounded-lg shadow-md overflow-hidden transition-all hover:shadow-lg ${!site.isUploaded ? 'opacity-60' : ''
            }`}>
            <div className="aspect-video bg-gray-100 flex items-center justify-center">
                {site.screenshotUrl ? (
                    <img
                        src={site.screenshotUrl}
                        alt={`${site.name} screenshot`}
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <div className="text-gray-400 text-4xl">📄</div>
                )}
            </div>

            <div className="p-4">
                <div className="flex justify-between items-start mb-2">
                    <Link
                        to="/sites/$siteId"
                        params={{ siteId: site._id }}
                        preload="intent"
                        className="font-semibold text-gray-900 truncate hover:text-indigo-600"
                    >
                        {site.name}
                    </Link>
                    <button
                        onClick={() => setShowDeleteConfirm(true)}
                        className="text-gray-400 hover:text-red-500 transition-colors ml-2"
                    >
                        🗑️
                    </button>
                </div>

                <p className="text-sm text-gray-600 mb-2">/{site.slug}</p>

                <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                    <span>
                        {site.isUploaded ? 'Updated' : 'Created'} {formatDate(site.lastUpdated)}
                    </span>
                    {!site.isUploaded && (
                        <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full">
                            Not uploaded
                        </span>
                    )}
                </div>

                {!site.isUploaded && (
                    <button
                        onClick={() => setShowUpload(!showUpload)}
                        className="w-full px-3 py-2 bg-indigo-600 text-white text-sm rounded-md hover:bg-indigo-700 transition-colors"
                    >
                        {showUpload ? "Cancel Upload" : "Upload Files"}
                    </button>
                )}

                {site.isUploaded && (
                    <Link
                        to="/view/$slug"
                        params={{ slug: site.slug }}
                        preload="intent"
                        className="w-full inline-block text-center px-3 py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 transition-colors"
                    >
                        View Site
                    </Link>
                )}
            </div>

            {showUpload && !site.isUploaded && (
                <SiteUpload
                    siteId={site._id}
                    onUploadComplete={() => setShowUpload(false)}
                />
            )}

            {showDeleteConfirm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-sm mx-4">
                        <h3 className="text-lg font-semibold mb-2">Delete Site</h3>
                        <p className="text-gray-600 mb-4">
                            Are you sure you want to delete "{site.name}"? This action cannot be undone.
                        </p>
                        <div className="flex space-x-3">
                            <button
                                onClick={() => setShowDeleteConfirm(false)}
                                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDelete}
                                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
