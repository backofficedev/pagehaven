import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import type { User } from '@workos/authkit-tanstack-react-start';

interface UserProfileModalProps {
  user: User;
  onClose: () => void;
  onSignOut: () => void;
}

export function UserProfileModal({ user, onClose, onSignOut }: UserProfileModalProps) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [connectedAccounts, setConnectedAccounts] = useState<Array<{ provider: string; email: string }>>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Initialize form with user data
    setFirstName((user as any).firstName || '');
    setLastName((user as any).lastName || '');
    
    // TODO: Fetch connected accounts from WorkOS API
    // For now, we'll show a placeholder
    // In a real implementation, you'd call WorkOS API to get connected accounts
    setConnectedAccounts([]);
  }, [user]);

  if (!mounted) {
    return null;
  }

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // TODO: Implement API call to update user profile in WorkOS
      // await updateUserProfile({ firstName, lastName });
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update profile:', error);
      alert('Failed to update profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setFirstName((user as any).firstName || '');
    setLastName((user as any).lastName || '');
    setIsEditing(false);
  };

  const profilePictureUrl = (user as any).profilePictureUrl || null;
  const email = user.email || '';

  return createPortal(
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="bg-background border-2 border-slate-200 dark:border-slate-800 rounded-lg shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Account Settings</h2>
              <button
                onClick={onClose}
                className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
                aria-label="Close"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Profile Picture Section */}
            <div className="flex items-center gap-4 pb-6 border-b border-slate-200 dark:border-slate-800 mb-6">
              {profilePictureUrl ? (
                <img
                  src={profilePictureUrl}
                  alt="Profile"
                  className="w-20 h-20 rounded-full shadow-md"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-slate-300 dark:bg-slate-700 flex items-center justify-center text-2xl font-semibold shadow-md">
                  {firstName ? firstName[0].toUpperCase() : email[0]?.toUpperCase() || 'U'}
                </div>
              )}
              <div className="flex-1">
                <div className="font-semibold text-lg">
                  {firstName || lastName ? `${firstName} ${lastName}`.trim() : 'User'}
                </div>
                <div className="text-sm text-slate-600 dark:text-slate-400">{email}</div>
              </div>
              <button
                onClick={() => {
                  // TODO: Implement profile picture upload
                  alert('Profile picture upload coming soon');
                }}
                className="px-3 py-1.5 text-sm border border-slate-300 dark:border-slate-700 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Change
              </button>
            </div>

            {/* Name Fields */}
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium mb-2">First Name</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="First name"
                  />
                ) : (
                  <div className="px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-md bg-slate-50 dark:bg-slate-900">
                    {firstName || <span className="text-slate-400">Not set</span>}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Last Name</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Last name"
                  />
                ) : (
                  <div className="px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-md bg-slate-50 dark:bg-slate-900">
                    {lastName || <span className="text-slate-400">Not set</span>}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Email</label>
                <div className="px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                  {email}
                </div>
                <p className="text-xs text-slate-500 mt-1">Email cannot be changed</p>
              </div>
            </div>

            {/* Edit/Save Buttons */}
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="w-full px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors mb-4"
              >
                Edit Profile
              </button>
            ) : (
              <div className="flex gap-2 mb-4">
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  onClick={handleCancel}
                  disabled={isSaving}
                  className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            )}

            {/* Connected Accounts */}
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">Connected Accounts</label>
              {connectedAccounts.length > 0 ? (
                <div className="space-y-2">
                  {connectedAccounts.map((account, index) => (
                    <div
                      key={index}
                      className="px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-md bg-slate-50 dark:bg-slate-900 flex items-center justify-between"
                    >
                      <div>
                        <div className="font-medium capitalize">{account.provider}</div>
                        <div className="text-sm text-slate-600 dark:text-slate-400">{account.email}</div>
                      </div>
                      <button
                        className="text-sm text-red-500 hover:text-red-700 dark:hover:text-red-400"
                        onClick={() => {
                          // TODO: Implement disconnect account
                          alert('Disconnect account coming soon');
                        }}
                      >
                        Disconnect
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="px-3 py-4 border border-slate-200 dark:border-slate-800 rounded-md bg-slate-50 dark:bg-slate-900 text-center text-slate-500">
                  <p className="text-sm">No connected accounts</p>
                  <button
                    className="mt-2 text-sm text-blue-500 hover:text-blue-700 dark:hover:text-blue-400"
                    onClick={() => {
                      // TODO: Implement connect account flow
                      alert('Connect account coming soon');
                    }}
                  >
                    Connect an account
                  </button>
                </div>
              )}
            </div>

            {/* Sign Out Button */}
              <button
                onClick={() => {
                  onSignOut();
                  // Also try to use WorkOS signOut if available
                  if (typeof window !== 'undefined') {
                    import('@workos/authkit-tanstack-react-start/client').then(({ useAuth }) => {
                      // This won't work here since we can't call hooks in callbacks
                      // The onSignOut handler should handle it
                    }).catch(() => {
                      // Fallback handled by onSignOut
                    });
                  }
                }}
                className="w-full px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
              >
                Sign Out
              </button>
          </div>
        </div>
      </div>
    </>,
    document.body
  );
}

