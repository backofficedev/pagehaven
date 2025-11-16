import { Link } from "@tanstack/react-router";
import type { AuthUser } from "../authkit/serverFunctions";

interface SignInButtonProps {
	user: AuthUser;
	signInUrl: string;
}

export function SignInButton({ user, signInUrl }: SignInButtonProps) {
	if (user) {
		return (
			<div className="flex items-center gap-4">
				<span className="text-sm text-gray-700">{user.name || user.email}</span>
				<Link
					to="/logout"
					className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
				>
					Sign Out
				</Link>
			</div>
		);
	}

	return (
		<a
			href={signInUrl}
			className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
		>
			Sign In
		</a>
	);
}
