import { Link } from "react-router-dom";
import { Authenticated, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { SiteNavBar } from "../components/SiteNavBar";
import { SiteCard } from "../components/SiteCard";
import { AddSiteCard } from "../components/AddSiteCard";
import { useState } from "react";

export function SitesPage() {
  return (
    <Authenticated>
      <SitesContent />
    </Authenticated>
  );
}

function SitesContent() {
  const sites = useQuery(api.sites.listUserSites);
  const [showCreateForm, setShowCreateForm] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      <SiteNavBar />

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Your Sites</h1>
          <p className="text-gray-600">
            Manage your static sites and control who can access them
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {sites?.map((site) => (
            <SiteCard key={site._id} site={site} />
          ))}
          <AddSiteCard 
            showForm={showCreateForm}
            onShowForm={() => setShowCreateForm(true)}
            onHideForm={() => setShowCreateForm(false)}
          />
        </div>

        {sites?.length === 0 && !showCreateForm && (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">📄</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No sites yet
            </h3>
            <p className="text-gray-600 mb-6">
              Create your first site to get started
            </p>
            <button
              onClick={() => setShowCreateForm(true)}
              className="inline-flex items-center px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Create Your First Site
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
