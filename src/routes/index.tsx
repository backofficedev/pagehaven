import { Link, createFileRoute } from '@tanstack/react-router';
import { Authenticated, Unauthenticated } from 'convex/react';
import { getAuth, getSignInUrl, getSignUpUrl } from '@workos/authkit-tanstack-react-start';
import type { User } from '@workos/authkit-tanstack-react-start';
import { UserButton } from '../components/UserButton';

export const Route = createFileRoute('/')({
  component: Home,
  loader: async () => {
    const { user } = await getAuth();
    const signInUrl = await getSignInUrl();
    const signUpUrl = await getSignUpUrl();

    return { user, signInUrl, signUpUrl };
  },
});

function Home() {
  const { user, signInUrl, signUpUrl } = Route.useLoaderData();
  return <HomeContent user={user} signInUrl={signInUrl} signUpUrl={signUpUrl} />;
}

function HomeContent({ user, signInUrl, signUpUrl }: { user: User | null; signInUrl: string; signUpUrl: string }) {
  return (
    <>
      <header className="sticky top-0 z-10 bg-background p-4 border-b-2 border-slate-200 dark:border-slate-800 flex flex-row justify-between items-center">
        <Link to="/" className="text-xl font-bold">
          PageHaven
        </Link>
        <div className="flex items-center gap-4">
          {user && (
            <>
              <Link
                to="/sites"
                className="px-4 py-2 rounded-md bg-foreground text-background hover:opacity-90 transition-opacity"
              >
                Sites
              </Link>
              <UserButton user={user} />
            </>
          )}
          {!user && (
            <a href={signInUrl}>
              <button className="px-4 py-2 rounded-md bg-foreground text-background hover:opacity-90 transition-opacity">
                Sign In
              </button>
            </a>
          )}
        </div>
      </header>
      <main className="p-8 flex flex-col gap-8">
        <h1 className="text-4xl font-bold text-center">Welcome to PageHaven</h1>
        <p className="text-center text-lg">Host your static sites with authentication</p>
        <Unauthenticated>
          <div className="flex flex-col gap-4 w-96 mx-auto">
            <a href={signInUrl}>
              <button className="w-full bg-foreground text-background px-4 py-2 rounded-md hover:opacity-90 transition-opacity">
                Sign in
              </button>
            </a>
            <a href={signUpUrl}>
              <button className="w-full bg-foreground text-background px-4 py-2 rounded-md hover:opacity-90 transition-opacity">
                Sign up
              </button>
            </a>
          </div>
        </Unauthenticated>
        <Authenticated>
          <div className="flex flex-col gap-4 items-center">
            <p className="text-lg">Welcome back! Manage your sites from the Sites page.</p>
            <Link
              to="/sites"
              className="px-6 py-3 rounded-md bg-foreground text-background hover:opacity-90 transition-opacity text-lg"
            >
              Go to Sites
            </Link>
          </div>
        </Authenticated>
      </main>
    </>
  );
}

