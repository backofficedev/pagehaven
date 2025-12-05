import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ExternalLink, Globe, Plus, Rocket } from "lucide-react";
import { AccessIcon } from "@/components/access-icon";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { requireAuth } from "@/lib/auth-types";
import { config, getSiteDisplayDomain } from "@/utils/config";
import { orpc } from "@/utils/orpc";

export const Route = createFileRoute("/dashboard")({
  component: DashboardPage,
  beforeLoad: requireAuth,
});

function DashboardPage() {
  const { session } = Route.useRouteContext();
  const sitesQuery = useQuery(orpc.site.list.queryOptions());

  const recentSites = sitesQuery.data?.slice(0, 4) ?? [];
  const totalSites = sitesQuery.data?.length ?? 0;
  const liveSites =
    sitesQuery.data?.filter((s) => s.activeDeploymentId).length ?? 0;

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-bold text-3xl">
          Welcome back, {session.data?.user.name}
        </h1>
        <p className="text-muted-foreground">
          Manage your static websites from one place
        </p>
      </div>

      {/* Stats Cards */}
      <div className="mb-8 grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-medium text-sm">Total Sites</CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {sitesQuery.isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="font-bold text-2xl">{totalSites}</div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-medium text-sm">Live Sites</CardTitle>
            <Rocket className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {sitesQuery.isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="font-bold text-2xl">{liveSites}</div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-medium text-sm">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <Link to="/sites">
              <Button className="w-full" size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Create New Site
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Recent Sites */}
      <div className="mb-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-semibold text-xl">Recent Sites</h2>
          <Link
            className="text-muted-foreground text-sm hover:text-foreground"
            to="/sites"
          >
            View all
          </Link>
        </div>

        {sitesQuery.isLoading ? (
          <div className="grid gap-4 md:grid-cols-2">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-4 w-48" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-4 w-24" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : null}

        {!sitesQuery.isLoading && recentSites.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Globe className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
              <h3 className="mb-2 font-medium text-lg">No sites yet</h3>
              <p className="mb-4 text-muted-foreground">
                Create your first site to get started hosting static websites
              </p>
              <Link to="/sites">
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Your First Site
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : null}

        {!sitesQuery.isLoading && recentSites.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2">
            {recentSites.map((site) => (
              <Link
                key={site.id}
                params={{ siteId: site.id }}
                to="/sites/$siteId"
              >
                <Card className="cursor-pointer transition-shadow hover:shadow-md">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2 text-lg">
                          {site.name}
                          {<AccessIcon />}
                        </CardTitle>
                        <CardDescription className="flex items-center gap-1">
                          {getSiteDisplayDomain(site.subdomain)}
                          <ExternalLink className="h-3 w-3" />
                        </CardDescription>
                      </div>
                      <span className="rounded-full bg-muted px-2 py-1 text-xs capitalize">
                        {site.role}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {site.activeDeploymentId ? (
                      <span className="flex items-center gap-1 text-green-600 text-sm">
                        <span className="h-2 w-2 rounded-full bg-green-500" />
                        <span>Live</span>
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-muted-foreground text-sm">
                        <span className="h-2 w-2 rounded-full bg-yellow-500" />
                        <span>No deployment</span>
                      </span>
                    )}
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : null}
      </div>

      {/* Getting Started Guide */}
      {totalSites === 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Getting Started</CardTitle>
            <CardDescription>
              Follow these steps to host your first static website
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ol className="list-inside list-decimal space-y-2 text-muted-foreground">
              <li>Create a new site with a unique subdomain</li>
              <li>Upload your static files (HTML, CSS, JS, images)</li>
              <li>Configure access settings (public, password, or private)</li>
              <li>
                Share your site at{" "}
                <code className="rounded bg-muted px-1">
                  yoursite.{config.staticDomain}
                </code>
              </li>
            </ol>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
