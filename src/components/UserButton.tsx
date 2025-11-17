import { Authenticated, Unauthenticated, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useState } from "react";
import { UserModal } from "./UserModal";
import { SignInForm } from "../SignInForm";

export function UserButton() {
  const [showModal, setShowModal] = useState(false);
  const [showSignIn, setShowSignIn] = useState(false);

  return (
    <>
      <Authenticated>
        <AuthenticatedUserButton onShowModal={() => setShowModal(true)} />
        {showModal && (
          <UserModal onClose={() => setShowModal(false)} />
        )}
      </Authenticated>

      <Unauthenticated>
        <button
          onClick={() => setShowSignIn(true)}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          Sign In
        </button>
        {showSignIn && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Sign In</h2>
                <button
                  onClick={() => setShowSignIn(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
              <SignInForm />
            </div>
          </div>
        )}
      </Unauthenticated>
    </>
  );
}

function AuthenticatedUserButton({ onShowModal }: { onShowModal: () => void }) {
  const user = useQuery(api.users.getUserProfile);

  if (!user) {
    return (
      <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse" />
    );
  }

  const displayName = user.profile?.firstName 
    ? `${user.profile.firstName} ${user.profile?.lastName || ''}`.trim()
    : user.email?.split('@')[0] || 'User';

  return (
    <button
      onClick={onShowModal}
      className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
    >
      <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-white text-sm font-semibold overflow-hidden">
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
      <span className="text-sm font-medium text-gray-700 hidden sm:block">
        {displayName}
      </span>
    </button>
  );
}
