import { useQuery, useMutation } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { api } from "../../convex/_generated/api";
import { useState, useRef } from "react";
import { toast } from "sonner";

interface UserModalProps {
  onClose: () => void;
}

export function UserModal({ onClose }: UserModalProps) {
  const { signOut } = useAuthActions();
  const user = useQuery(api.users.getUserProfile);
  const updateProfile = useMutation(api.users.updateProfile);
  const generateUploadUrl = useMutation(api.users.generateUploadUrl);
  
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    firstName: user?.profile?.firstName || "",
    lastName: user?.profile?.lastName || "",
  });
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSave = async () => {
    try {
      await updateProfile(formData);
      setIsEditing(false);
      toast.success("Profile updated successfully");
    } catch (error) {
      toast.error("Failed to update profile");
    }
  };

  const handleAvatarUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error("Please select an image file");
      return;
    }

    setIsUploading(true);
    try {
      const uploadUrl = await generateUploadUrl();
      
      const result = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });

      if (!result.ok) {
        throw new Error("Upload failed");
      }

      const { storageId } = await result.json();
      await updateProfile({ avatarId: storageId });
      toast.success("Avatar updated successfully");
    } catch (error) {
      toast.error("Failed to upload avatar");
    } finally {
      setIsUploading(false);
    }
  };

  if (!user) return null;

  const displayName = user.profile?.firstName 
    ? `${user.profile.firstName} ${user.profile?.lastName || ''}`.trim()
    : user.email?.split('@')[0] || 'User';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Account Settings</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        <div className="space-y-6">
          {/* Avatar Section */}
          <div className="text-center">
            <div className="relative inline-block">
              <div className="w-20 h-20 bg-indigo-600 rounded-full flex items-center justify-center text-white text-2xl font-semibold overflow-hidden">
                {user.profile?.avatarUrl ? (
                  <img 
                    src={user.profile.avatarUrl} 
                    alt="Avatar" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  displayName.charAt(0).toUpperCase()
                )}
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="absolute -bottom-1 -right-1 w-6 h-6 bg-gray-600 text-white rounded-full text-xs hover:bg-gray-700 transition-colors disabled:opacity-50"
              >
                {isUploading ? "..." : "✎"}
              </button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleAvatarUpload(file);
              }}
              className="hidden"
            />
          </div>

          {/* Name Section */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-medium text-gray-700">Name</label>
              <button
                onClick={() => {
                  if (isEditing) {
                    handleSave();
                  } else {
                    setIsEditing(true);
                  }
                }}
                className="text-sm text-indigo-600 hover:text-indigo-700"
              >
                {isEditing ? "Save" : "Edit"}
              </button>
            </div>
            {isEditing ? (
              <div className="space-y-2">
                <input
                  type="text"
                  placeholder="First name"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <input
                  type="text"
                  placeholder="Last name"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            ) : (
              <p className="text-gray-900">
                {displayName}
              </p>
            )}
          </div>

          {/* Email Section */}
          <div>
            <label className="text-sm font-medium text-gray-700">Email</label>
            <p className="text-gray-900">{user.email}</p>
          </div>

          {/* Connected Apps Section */}
          <div>
            <label className="text-sm font-medium text-gray-700">Connected Apps</label>
            <div className="mt-2 p-3 bg-gray-50 rounded-md">
              <p className="text-sm text-gray-600">Password Authentication</p>
            </div>
          </div>

          {/* Sign Out Button */}
          <button
            onClick={() => signOut()}
            className="w-full px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}
