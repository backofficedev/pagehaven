import { Link } from "react-router-dom";
import { Authenticated, Unauthenticated, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { SignInForm } from "../SignInForm";
import { UserButton } from "../components/UserButton";

export function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <header className="flex justify-between items-center p-6">
        <Link to="/" className="text-2xl font-bold text-indigo-600">
          PageHaven
        </Link>
        <UserButton />
      </header>

      <main className="flex flex-col items-center justify-center min-h-[80vh] px-6">
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="text-6xl font-bold text-gray-900 mb-6">
            Host Your Static Sites
            <span className="text-indigo-600"> Privately</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Upload HTML sites and share them with authenticated users only. 
            Perfect for private demos, client previews, and team collaboration.
          </p>

          <Authenticated>
            <AuthenticatedContent />
          </Authenticated>

          <Unauthenticated>
            <UnauthenticatedContent />
          </Unauthenticated>
        </div>
      </main>
    </div>
  );
}

function AuthenticatedContent() {
  const user = useQuery(api.users.getUserProfile);

  return (
    <div className="space-y-6">
      <p className="text-lg text-gray-700">
        Welcome back, {user?.profile?.firstName || user?.email || "friend"}!
      </p>
      <Link
        to="/sites"
        className="inline-flex items-center px-8 py-4 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors shadow-lg hover:shadow-xl"
      >
        Manage Your Sites
      </Link>
    </div>
  );
}

function UnauthenticatedContent() {
  return (
    <div className="space-y-8">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-md mx-auto">
        <h2 className="text-2xl font-semibold text-gray-900 mb-6 text-center">
          Sign In to Get Started
        </h2>
        <SignInForm />
      </div>
      
      <div className="grid md:grid-cols-3 gap-6 mt-12">
        <div className="bg-white rounded-lg p-6 shadow-lg">
          <div className="text-indigo-600 text-3xl mb-4">🔒</div>
          <h3 className="text-lg font-semibold mb-2">Private by Default</h3>
          <p className="text-gray-600">Only authenticated users can access your sites</p>
        </div>
        <div className="bg-white rounded-lg p-6 shadow-lg">
          <div className="text-indigo-600 text-3xl mb-4">⚡</div>
          <h3 className="text-lg font-semibold mb-2">Lightning Fast</h3>
          <p className="text-gray-600">Static sites load instantly with global CDN</p>
        </div>
        <div className="bg-white rounded-lg p-6 shadow-lg">
          <div className="text-indigo-600 text-3xl mb-4">🎯</div>
          <h3 className="text-lg font-semibold mb-2">Simple Upload</h3>
          <p className="text-gray-600">Drag and drop your HTML files to deploy</p>
        </div>
      </div>
    </div>
  );
}
