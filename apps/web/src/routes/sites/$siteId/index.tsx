import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import {
  ArrowLeft,
  BarChart3,
  CheckCircle,
  Clock,
  ExternalLink,
  Globe,
  Loader2,
  Settings,
  Upload,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { authClient } from "@/lib/auth-client";
import { getSiteDisplayDomain, getSiteUrl } from "@/utils/config";
import { orpc } from "@/utils/orpc";

export const Route = createFileRoute("/sites/$siteId/")({
  component: SiteDetailPage,
  beforeLoad: async () => {
    const session = await authClient.getSession();
    if (!session.data) {
      redirect({
        to: "/login",
        throw: true,
      });
    }
    return { session };
  },
});

function SiteDetailPage() {
  const { siteId } = Route.useParams();

  const siteQuery = useQuery(orpc.site.get.queryOptions({ input: { siteId } }));
  const deploymentsQuery = useQuery(
    orpc.deployment.list.queryOptions({
      input: { siteId, limit: 10, offset: 0 },
    })
  );

  const site = siteQuery.data;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "live":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "failed":
        return <XCircle className="h-4 w-4 text-red-500" />;
      case "processing":
        return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
      default:
        return <Clock className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case "live":
        return "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300";
      case "failed":
        return "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300";
      default:
        return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300";
    }
  };

  const formatDate = (date: Date | null | undefined) => {
    if (!date) {
      return "N/A";
    }
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (siteQuery.isLoading) {
    return (
      <div className="container mx-auto max-w-4xl px-4 py-8">
        <div className="text-center text-muted-foreground">Loading site...</div>
      </div>
    );
  }

  if (!site) {
    return (
      <div className="container mx-auto max-w-4xl px-4 py-8">
        <div className="text-center text-muted-foreground">Site not found</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <div className="mb-6">
        <Link
          className="mb-4 inline-flex items-center gap-1 text-muted-foreground text-sm hover:text-foreground"
          to="/sites"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Sites
        </Link>
      </div>

      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="font-bold text-3xl">{site.name}</h1>
          <div className="mt-1 flex items-center gap-2 text-muted-foreground">
            <Globe className="h-4 w-4" />
            <a
              className="hover:underline"
              href={getSiteUrl(site.subdomain)}
              rel="noopener noreferrer"
              target="_blank"
            >
              {getSiteDisplayDomain(site.subdomain)}
              <ExternalLink className="ml-1 inline h-3 w-3" />
            </a>
          </div>
          {site.description ? (
            <p className="mt-2 text-muted-foreground">{site.description}</p>
          ) : null}
        </div>
        <div className="flex gap-2">
          <Link params={{ siteId }} to="/sites/$siteId/deploy">
            <Button>
              <Upload className="mr-2 h-4 w-4" />
              Deploy
            </Button>
          </Link>
          <Link params={{ siteId }} to="/sites/$siteId/analytics">
            <Button variant="outline">
              <BarChart3 className="mr-2 h-4 w-4" />
              Analytics
            </Button>
          </Link>
          <Link params={{ siteId }} to="/sites/$siteId/settings">
            <Button variant="outline">
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Status</CardTitle>
          </CardHeader>
          <CardContent>
            {site.activeDeploymentId ? (
              <div className="flex items-center gap-2 text-green-600">
                <span className="h-3 w-3 rounded-full bg-green-500" />
                <span className="font-medium">Live</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-yellow-600">
                <span className="h-3 w-3 rounded-full bg-yellow-500" />
                <span className="font-medium">No deployment</span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Role</CardTitle>
          </CardHeader>
          <CardContent>
            <span className="rounded-full bg-muted px-3 py-1 font-medium text-sm capitalize">
              {site.role}
            </span>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Recent Deployments</CardTitle>
          <CardDescription>
            Your deployment history for this site
          </CardDescription>
        </CardHeader>
        <CardContent>
          {deploymentsQuery.isLoading ? (
            <div className="text-center text-muted-foreground">
              Loading deployments...
            </div>
          ) : null}

          {deploymentsQuery.data?.length === 0 ? (
            <div className="py-8 text-center">
              <Upload className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
              <p className="text-muted-foreground">No deployments yet</p>
              <Link params={{ siteId }} to="/sites/$siteId/deploy">
                <Button className="mt-4">
                  <Upload className="mr-2 h-4 w-4" />
                  Create First Deployment
                </Button>
              </Link>
            </div>
          ) : null}

          <div className="space-y-3">
            {deploymentsQuery.data?.map((deployment) => (
              <div
                className="flex items-center justify-between rounded-lg border p-4"
                key={deployment.id}
              >
                <div className="flex items-center gap-3">
                  {getStatusIcon(deployment.status)}
                  <div>
                    <div className="font-medium">
                      {deployment.commitMessage ?? "Deployment"}
                    </div>
                    <div className="text-muted-foreground text-sm">
                      {formatDate(deployment.createdAt)}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`rounded-full px-2 py-1 text-xs capitalize ${getStatusClass(deployment.status)}`}
                  >
                    {deployment.status}
                  </span>
                  {deployment.id === site.activeDeploymentId ? (
                    <span className="rounded-full bg-blue-100 px-2 py-1 text-blue-700 text-xs dark:bg-blue-900 dark:text-blue-300">
                      Active
                    </span>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
