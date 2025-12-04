import { createFileRoute, Link } from "@tanstack/react-router";
import { Home, ShieldX, UserX } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const Route = createFileRoute("/gate/denied")({
  component: DeniedGatePage,
  validateSearch: (search: Record<string, unknown>) => ({
    reason: (search.reason as string) || "unknown",
    redirect: (search.redirect as string) || "/",
  }),
});

function DeniedGatePage() {
  const { reason } = Route.useSearch();

  const getContent = () => {
    switch (reason) {
      case "not_member":
        return {
          icon: <UserX className="h-6 w-6" />,
          title: "Not a Member",
          description:
            "You are not a member of this site. Only team members can access this content.",
        };
      case "not_invited":
        return {
          icon: <ShieldX className="h-6 w-6" />,
          title: "Not Invited",
          description:
            "You have not been invited to view this site. Contact the site owner to request access.",
        };
      default:
        return {
          icon: <ShieldX className="h-6 w-6" />,
          title: "Access Denied",
          description: "You do not have permission to access this site.",
        };
    }
  };

  const content = getContent();

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            {content.icon}
          </div>
          <CardTitle>{content.title}</CardTitle>
          <CardDescription>{content.description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Link className="block" to="/">
            <Button className="w-full" variant="outline">
              <Home className="mr-2 h-4 w-4" />
              Go to Homepage
            </Button>
          </Link>
          <p className="text-center text-muted-foreground text-sm">
            If you believe this is an error, please contact the site
            administrator.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
