import { useState, useEffect } from 'react';
import type { User } from '@workos/authkit-tanstack-react-start';
import { UserProfileModal } from './UserProfileModal';

interface UserButtonProps {
  user: User;
}

export function UserButton({ user }: UserButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const firstName = (user as any).firstName || '';
  const lastName = (user as any).lastName || '';
  const profilePictureUrl = (user as any).profilePictureUrl || null;
  const email = user.email || '';

  const handleSignOut = async () => {
    try {
      // Try to use client-side signOut if available
      const { useAuth } = await import('@workos/authkit-tanstack-react-start/client');
      // We can't call hooks conditionally, so we'll use a different approach
      // For now, just redirect to home - sign out will be handled by the modal
      window.location.href = '/';
    } catch {
      window.location.href = '/';
    }
  };

  const handleClick = () => {
    alert('Button clicked! Opening modal...');
    console.log('UserButton clicked, isOpen will be set to true, current isOpen:', isOpen);
    setIsOpen(true);
    console.log('After setIsOpen, isOpen should be true');
  };

  return (
    <>
      <button
        onClick={handleClick}
        className="flex items-center gap-2 px-3 py-2 rounded-md hover:ring-2 hover:ring-blue-500 hover:ring-offset-2 transition-all shadow-md"
        aria-label="User menu"
      >
        {profilePictureUrl ? (
          <img
            src={profilePictureUrl}
            alt="Profile"
            className="w-8 h-8 rounded-full shadow-sm"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-slate-300 dark:bg-slate-700 flex items-center justify-center text-sm font-semibold shadow-sm">
            {firstName ? firstName[0].toUpperCase() : email[0]?.toUpperCase() || 'U'}
          </div>
        )}
        <span className="text-sm">{firstName || email}</span>
      </button>

      {isOpen && (
        <UserProfileModal
          user={user}
          onClose={() => setIsOpen(false)}
          onSignOut={handleSignOut}
        />
      )}
    </>
  );
}

