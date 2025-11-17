import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useState } from "react";
import { toast } from "sonner";

interface AddSiteCardProps {
  showForm: boolean;
  onShowForm: () => void;
  onHideForm: () => void;
}

export function AddSiteCard({ showForm, onShowForm, onHideForm }: AddSiteCardProps) {
  const createSite = useMutation(api.sites.createSite);
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
  });
  const [isCreating, setIsCreating] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.slug.trim()) {
      toast.error("Please fill in all fields");
      return;
    }

    // Validate slug format
    const slugRegex = /^[a-z0-9-]+$/;
    if (!slugRegex.test(formData.slug)) {
      toast.error("Slug can only contain lowercase letters, numbers, and hyphens");
      return;
    }

    setIsCreating(true);
    try {
      await createSite(formData);
      toast.success("Site created successfully");
      setFormData({ name: "", slug: "" });
      onHideForm();
    } catch (error: any) {
      toast.error(error.message || "Failed to create site");
    } finally {
      setIsCreating(false);
    }
  };

  if (showForm) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Site Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="My Awesome Site"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              URL Slug
            </label>
            <div className="flex">
              <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                /
              </span>
              <input
                type="text"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
                placeholder="my-awesome-site"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-r-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Only lowercase letters, numbers, and hyphens allowed
            </p>
          </div>

          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onHideForm}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isCreating}
              className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors disabled:opacity-50"
            >
              {isCreating ? "Creating..." : "Create Site"}
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <button
      onClick={onShowForm}
      className="bg-white rounded-lg shadow-md border-2 border-dashed border-gray-300 hover:border-indigo-400 transition-colors p-6 flex flex-col items-center justify-center min-h-[200px] group"
    >
      <div className="text-4xl text-gray-400 group-hover:text-indigo-500 transition-colors mb-2">
        +
      </div>
      <span className="text-gray-600 group-hover:text-indigo-600 font-medium">
        Add New Site
      </span>
    </button>
  );
}
