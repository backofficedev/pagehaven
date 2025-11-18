import { Link, useParams } from "react-router-dom";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { UserButton } from "../components/UserButton";
import { useState } from "react";
import { Id } from "../../convex/_generated/dataModel";
import { getConvexHttpUrl } from "../lib/utils";

export function SiteDetailPage() {
  const { siteId } = useParams<{ siteId: string }>();
  const [activeTab, setActiveTab] = useState<"overview" | "settings" | "members" | "content">("overview");

  if (!siteId) {
    return <div>Site ID required</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <Link to="/sites" className="text-2xl font-bold text-indigo-600">
            PageHaven
          </Link>
          <UserButton />
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <SiteDetailContent siteId={siteId as Id<"sites">} activeTab={activeTab} setActiveTab={setActiveTab} />
      </main>
    </div>
  );
}

function SiteDetailContent({
  siteId,
  activeTab,
  setActiveTab,
}: {
  siteId: Id<"sites">;
  activeTab: "overview" | "settings" | "members" | "content";
  setActiveTab: (tab: "overview" | "settings" | "members" | "content") => void;
}) {
  // Use listUserSites which we know works reliably
  const allSites = useQuery(api.sites.listUserSites);
  
  // Find the site by ID from the list
  const site = allSites?.find(s => s._id === siteId);

  if (allSites === undefined) {
    return (
      <div className="text-center py-12">
        <div className="animate-pulse">Loading site details...</div>
      </div>
    );
  }

  if (!site) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-4">Site not found or access denied</div>
        <Link
          to="/sites"
          className="text-indigo-600 hover:text-indigo-700 underline"
        >
          Back to Sites
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{site.name}</h1>
        <p className="text-gray-600">/{site.slug}</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab("overview")}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === "overview"
                ? "border-indigo-500 text-indigo-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab("settings")}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === "settings"
                ? "border-indigo-500 text-indigo-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            Settings
          </button>
          <button
            onClick={() => setActiveTab("members")}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === "members"
                ? "border-indigo-500 text-indigo-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            Members
          </button>
          <button
            onClick={() => setActiveTab("content")}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === "content"
                ? "border-indigo-500 text-indigo-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            Content
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-lg shadow p-6">
        {activeTab === "overview" && <OverviewTab site={site} />}
        {activeTab === "settings" && <SettingsTab site={site} />}
        {activeTab === "members" && <MembersTab siteId={siteId} />}
        {activeTab === "content" && <ContentTab site={site} />}
      </div>
    </div>
  );
}

function OverviewTab({ site }: { site: any }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-4">Site Information</h2>
        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-sm font-medium text-gray-500">Site Name</dt>
            <dd className="mt-1 text-sm text-gray-900">{site.name}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Slug</dt>
            <dd className="mt-1 text-sm text-gray-900">/{site.slug}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Access Mode</dt>
            <dd className="mt-1 text-sm text-gray-900">
              <span className={`px-2 py-1 rounded-full text-xs ${
                (site.authMode || "authenticated") === "public"
                  ? "bg-green-100 text-green-800"
                  : "bg-blue-100 text-blue-800"
              }`}>
                {(site.authMode || "authenticated") === "public" ? "Public" : "Authenticated"}
              </span>
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Status</dt>
            <dd className="mt-1 text-sm text-gray-900">
              {site.isUploaded ? (
                <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                  Uploaded
                </span>
              ) : (
                <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs">
                  Not Uploaded
                </span>
              )}
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Last Updated</dt>
            <dd className="mt-1 text-sm text-gray-900">
              {new Date(site.lastUpdated).toLocaleDateString()}
            </dd>
          </div>
        </dl>
      </div>

      {site.isUploaded && (
        <div>
          <a
            href={getConvexHttpUrl(site.slug)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
          >
            View Site
          </a>
        </div>
      )}
    </div>
  );
}

function SettingsTab({ site }: { site: any }) {
  const updateAuthMode = useMutation(api.sites.updateSiteAuthMode);
  const [authMode, setAuthMode] = useState<"public" | "authenticated">(
    (site.authMode || "authenticated") as "public" | "authenticated"
  );
  const [isSaving, setIsSaving] = useState(false);

  const handleAuthModeChange = async (newMode: "public" | "authenticated") => {
    setAuthMode(newMode);
    setIsSaving(true);
    try {
      await updateAuthMode({ siteId: site._id, authMode: newMode });
    } catch (error) {
      console.error("Failed to update auth mode:", error);
      // Revert on error
      setAuthMode(site.authMode || "authenticated");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-4">Access Control</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Site Access Mode
            </label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="authMode"
                  value="public"
                  checked={authMode === "public"}
                  onChange={() => handleAuthModeChange("public")}
                  disabled={isSaving}
                  className="mr-2"
                />
                <div>
                  <div className="font-medium">Public</div>
                  <div className="text-sm text-gray-500">
                    Anyone can access this site without authentication
                  </div>
                </div>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="authMode"
                  value="authenticated"
                  checked={authMode === "authenticated"}
                  onChange={() => handleAuthModeChange("authenticated")}
                  disabled={isSaving}
                  className="mr-2"
                />
                <div>
                  <div className="font-medium">Authenticated</div>
                  <div className="text-sm text-gray-500">
                    Only logged-in users with access can view this site
                  </div>
                </div>
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MembersTab({ siteId }: { siteId: Id<"sites"> }) {
  // Query might fail if Convex hasn't synced yet - handle gracefully  
  const memberships = useQuery(api.sites.getSiteMemberships, { siteId });
  const [showAddMember, setShowAddMember] = useState(false);

  if (memberships === undefined) {
    return <div className="text-center py-8">Loading members...</div>;
  }

  // Handle error case - if query returns null or non-array, show message
  // This can happen if Convex hasn't synced the function yet
  if (!Array.isArray(memberships)) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">Site Members</h2>
        </div>
        <div className="text-center py-8">
          <div className="text-gray-500 mb-2">Members feature is syncing...</div>
          <div className="text-sm text-gray-400">Please wait a moment and refresh the page.</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Site Members</h2>
        <button
          onClick={() => setShowAddMember(true)}
          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
        >
          Add Member
        </button>
      </div>

      {showAddMember && (
        <AddMemberForm siteId={siteId} onClose={() => setShowAddMember(false)} />
      )}

      {memberships.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No members yet. Add members to share access to this site.
        </div>
      ) : (
        <div className="space-y-2">
          {memberships.map((membership) => (
            <MemberRow key={membership._id} membership={membership} siteId={siteId} />
          ))}
        </div>
      )}
    </div>
  );
}

function MemberRow({ membership, siteId }: { membership: any; siteId: Id<"sites"> }) {
  const removeMembership = useMutation(api.sites.removeSiteMembership);
  const [showRemove, setShowRemove] = useState(false);

  const handleRemove = async () => {
    try {
      await removeMembership({ membershipId: membership._id });
      setShowRemove(false);
    } catch (error: any) {
      alert(error.message || "Failed to remove member");
    }
  };

  return (
    <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
      <div>
        <div className="font-medium">{membership.user?.email || "Unknown User"}</div>
        <div className="text-sm text-gray-500">
          {membership.role === "admin" ? "Admin" : "Viewer"}
        </div>
      </div>
      <button
        onClick={() => setShowRemove(true)}
        className="text-red-600 hover:text-red-700 text-sm"
      >
        Remove
      </button>

      {showRemove && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-sm mx-4">
            <h3 className="text-lg font-semibold mb-2">Remove Member</h3>
            <p className="text-gray-600 mb-4">
              Are you sure you want to remove {membership.user?.email} from this site?
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowRemove(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleRemove}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function AddMemberForm({ siteId, onClose }: { siteId: Id<"sites">; onClose: () => void }) {
  const addMembership = useMutation(api.sites.addSiteMembership);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"admin" | "viewer">("viewer");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchEmail, setSearchEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  
  // Use query to search for user when searchEmail is set
  const foundUser = useQuery(
    api.users.findUserByEmail,
    searchEmail.trim() ? { email: searchEmail.trim() } : "skip"
  );

  const handleSearch = () => {
    if (!email.trim()) {
      setError("Please enter an email address");
      return;
    }
    setSearchEmail(email);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      setError("Please enter an email address");
      return;
    }

    // First search for the user
    setSearchEmail(email);
    
    // Wait a bit for the query to resolve
    await new Promise(resolve => setTimeout(resolve, 500));
    
    if (!foundUser) {
      setError("User not found. Please check the email address.");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    
    try {
      await addMembership({
        siteId,
        userId: foundUser._id,
        role,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to add member");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 border border-gray-200 rounded-lg space-y-4">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
          {error}
        </div>
      )}
      
      {foundUser && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-md text-sm">
          Found user: {foundUser.email} {foundUser.name && `(${foundUser.name})`}
        </div>
      )}
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          User Email
        </label>
        <div className="flex space-x-2">
          <input
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setSearchEmail(""); // Reset search when email changes
            }}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
            placeholder="user@example.com"
            required
          />
          <button
            type="button"
            onClick={handleSearch}
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
          >
            Search
          </button>
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Role
        </label>
        <select
          value={role}
          onChange={(e) => setRole(e.target.value as "admin" | "viewer")}
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
        >
          <option value="viewer">Viewer</option>
          <option value="admin">Admin</option>
        </select>
      </div>
      <div className="flex space-x-3">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting || !foundUser}
          className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
        >
          {isSubmitting ? "Adding..." : "Add Member"}
        </button>
      </div>
    </form>
  );
}

function ContentTab({ site }: { site: any }) {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Site Content</h2>
      {site.isUploaded ? (
        <div>
          <p className="text-gray-600 mb-4">Site files are uploaded and ready to serve.</p>
          <a
            href={getConvexHttpUrl(site.slug)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
          >
            View Site
          </a>
        </div>
      ) : (
        <div>
          <p className="text-gray-600 mb-4">No files uploaded yet. Upload a ZIP file to get started.</p>
          <p className="text-sm text-gray-500">
            Note: File upload functionality is available from the site card on the sites page.
          </p>
        </div>
      )}
    </div>
  );
}

