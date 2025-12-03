import { createFileRoute, Link } from "@tanstack/react-router";
import { LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const Route = createFileRoute("/gate/login")({
  component: LoginGatePage,
  validateSearch: (search: Record<string, unknown>) => ({
    redirect: (search.redirect as string) || "/",
  }),
});

function LoginGatePage() {
  const { redirect } = Route.useSearch();

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <LogIn className="h-6 w-6" />
          </div>
          <CardTitle>Login Required</CardTitle>
          <CardDescription>
            You need to sign in to access this site
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Link className="block" search={{ redirect }} to="/login">
            <Button className="w-full">Sign In</Button>
          </Link>
          <p className="text-center text-muted-foreground text-sm">
            Don't have an account?{" "}
            <Link className="text-primary hover:underline" to="/login">
              Sign up
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
