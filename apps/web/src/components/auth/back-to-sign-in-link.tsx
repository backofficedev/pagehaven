import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";

/**
 * Shared "Back to Sign In" link component for auth pages
 */
export function BackToSignInLink() {
  return (
    <Link to="/login">
      <Button className="text-indigo-600 hover:text-indigo-800" variant="link">
        Back to Sign In
      </Button>
    </Link>
  );
}
