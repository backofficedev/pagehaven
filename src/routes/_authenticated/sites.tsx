import { Link, createFileRoute } from '@tanstack/react-router';
import { useMutation } from 'convex/react';
import { convexQuery } from '@convex-dev/react-query';
import { useSuspenseQuery } from '@tanstack/react-query';
import { api } from '../../../convex/_generated/api';
import { useState } from 'react';
import { useAuth } from '@workos/authkit-tanstack-react-start/client';

export const Route = createFileRoute('/_authenticated/sites')({
  component: SitesPage,
});

function SitesPage() {
  const {
    data: sites,
  } = useSuspenseQuery(
    convexQuery(api.myFunctions.listSites, {}),
  );
  const createSite = useMutation(api.myFunctions.createSite);
  const deleteSite = useMutation(api.myFunctions.deleteSite);
  const [isCreating, setIsCreating] = useState(false);
  const [slug, setSlug] = useState('');
  const [name, setName] = useState('');

  const handleCreateSite = async () => {
    if (!slug.trim() || !name.trim()) {
      alert('Please enter both slug and name');
      return;
    }
    try {
      await createSite({ slug: slug.trim(), name: name.trim() });
      setSlug('');
      setName('');
      setIsCreating(false);
    } catch (error: any) {
      alert(error.message || 'Failed to create site');
    }
  };

  const handleDeleteSite = async (siteId: string) => {
    if (!confirm('Are you sure you want to delete this site?')) {
      return;
    }
    try {
      await deleteSite({ siteId: siteId as any });
    } catch (error: any) {
      alert(error.message || 'Failed to delete site');
    }
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    return date.toLocaleDateString();
  };

  return (
    <>
      <header className="sticky top-0 z-10 bg-background p-4 border-b-2 border-slate-200 dark:border-slate-800 flex flex-row justify-between items-center">
        <Link to="/" className="text-xl font-bold">
          PageHaven
        </Link>
        <Link to="/" className="text-sm text-slate-600 dark:text-slate-400 hover:text-foreground">
          Home
        </Link>
      </header>
      <main className="p-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">Your Sites</h1>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sites.map((site) => (
              <SiteCard
                key={site._id}
                site={site}
                onDelete={() => handleDeleteSite(site._id)}
                formatDate={formatDate}
              />
            ))}
            {isCreating ? (
              <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-lg p-6 bg-slate-50 dark:bg-slate-900">
                <div className="flex flex-col gap-4">
                  <h3 className="font-semibold">Create New Site</h3>
                  <input
                    type="text"
                    placeholder="Slug (e.g., my-site)"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    className="px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-md bg-background"
                  />
                  <input
                    type="text"
                    placeholder="Name (e.g., My Site)"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-md bg-background"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleCreateSite}
                      className="flex-1 px-4 py-2 bg-foreground text-background rounded-md hover:opacity-90 transition-opacity"
                    >
                      Create
                    </button>
                    <button
                      onClick={() => {
                        setIsCreating(false);
                        setSlug('');
                        setName('');
                      }}
                      className="px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setIsCreating(true)}
                className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-lg p-6 bg-slate-50 dark:bg-slate-900 hover:border-slate-400 dark:hover:border-slate-600 transition-colors flex flex-col items-center justify-center gap-2 min-h-[200px]"
              >
                <div className="text-4xl font-light">+</div>
                <div className="font-semibold">Add Site</div>
              </button>
            )}
          </div>
        </div>
      </main>
    </>
  );
}

function SiteCard({
  site,
  onDelete,
  formatDate,
}: {
  site: {
    _id: string;
    _creationTime: number;
    slug: string;
    name: string;
    screenshotId?: string;
    uploaded: boolean;
  };
  onDelete: () => void;
  formatDate: (timestamp: number) => string;
}) {
  const [screenshotUrl, setScreenshotUrl] = useState<string | null>(null);

  // In a real app, you'd fetch the screenshot URL from Convex storage
  // For now, we'll just show a placeholder

  return (
    <div
      className={`border-2 rounded-lg overflow-hidden ${
        site.uploaded
          ? 'border-slate-300 dark:border-slate-700'
          : 'border-slate-200 dark:border-slate-800 opacity-60'
      }`}
    >
      <div className="aspect-video bg-slate-200 dark:bg-slate-800 flex items-center justify-center relative">
        {screenshotUrl ? (
          <img src={screenshotUrl} alt={site.name} className="w-full h-full object-cover" />
        ) : (
          <div className="text-slate-400 dark:text-slate-600 text-sm">No screenshot</div>
        )}
        {!site.uploaded && (
          <div className="absolute inset-0 bg-slate-900 bg-opacity-50 flex items-center justify-center">
            <span className="text-white text-sm font-semibold">Not uploaded</span>
          </div>
        )}
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div>
            <h3 className="font-semibold text-lg">{site.name}</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">/{site.slug}</p>
          </div>
          <button
            onClick={onDelete}
            className="text-red-500 hover:text-red-700 dark:hover:text-red-400 transition-colors"
            title="Delete site"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-500">
          Last updated: {formatDate(site._creationTime)}
        </p>
      </div>
    </div>
  );
}

