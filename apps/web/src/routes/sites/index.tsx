import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Globe, Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { AccessIcon } from "@/components/access-icon";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { requireAuth } from "@/lib/auth-types";
import { config, getSiteDisplayDomain } from "@/utils/config";
import { orpc, queryClient } from "@/utils/orpc";

export const Route = createFileRoute("/sites/")({
  component: SitesPage,
  beforeLoad: requireAuth,
});

function SitesPage() {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newSiteName, setNewSiteName] = useState("");
  const [newSiteSubdomain, setNewSiteSubdomain] = useState("");

  const sitesQuery = useQuery(orpc.site.list.queryOptions());

  const createSiteMutation = useMutation({
    ...orpc.site.create.mutationOptions(),
    onSuccess: () => {
      toast.success("Site created successfully!");
      setShowCreateForm(false);
      setNewSiteName("");
      setNewSiteSubdomain("");
      queryClient.invalidateQueries({ queryKey: ["site", "list"] });
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleCreateSite = (e: React.FormEvent) => {
    e.preventDefault();
    createSiteMutation.mutate({
      name: newSiteName,
      subdomain: newSiteSubdomain,
    });
  };

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-bold text-3xl">Your Sites</h1>
          <p className="text-muted-foreground">Manage your static websites</p>
        </div>
        <Button onClick={() => setShowCreateForm(!showCreateForm)}>
          <Plus className="mr-2 h-4 w-4" />
          New Site
        </Button>
      </div>

      {showCreateForm ? (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Create New Site</CardTitle>
            <CardDescription>
              Set up a new static website hosting
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleCreateSite}>
              <div className="space-y-2">
                <Label htmlFor="name">Site Name</Label>
                <Input
                  id="name"
                  onChange={(e) => setNewSiteName(e.target.value)}
                  placeholder="My Awesome Site"
                  required
                  value={newSiteName}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="subdomain">Subdomain</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="subdomain"
                    onChange={(e) =>
                      setNewSiteSubdomain(e.target.value.toLowerCase())
                    }
                    pattern="^[a-z0-9]([a-z0-9-]*[a-z0-9])?$"
                    placeholder="my-site"
                    required
                    value={newSiteSubdomain}
                  />
                  <span className="whitespace-nowrap text-muted-foreground">
                    .{config.staticDomain}
                  </span>
                </div>
              </div>
              <div className="flex gap-2">
                <Button disabled={createSiteMutation.isPending} type="submit">
                  {createSiteMutation.isPending ? "Creating..." : "Create Site"}
                </Button>
                <Button
                  onClick={() => setShowCreateForm(false)}
                  type="button"
                  variant="outline"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : null}

      {sitesQuery.isLoading ? (
        <div className="text-center text-muted-foreground">
          Loading sites...
        </div>
      ) : null}

      {sitesQuery.data?.length === 0 ? (
        <EmptyState
          action={
            <Button onClick={() => setShowCreateForm(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Site
            </Button>
          }
          description="Create your first site to get started"
          icon={Globe}
          title="No sites yet"
        />
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        {sitesQuery.data?.map((site) => (
          <Link key={site.id} params={{ siteId: site.id }} to="/sites/$siteId">
            <Card className="cursor-pointer transition-shadow hover:shadow-md">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {site.name}
                      <AccessIcon />
                    </CardTitle>
                    <CardDescription>
                      {getSiteDisplayDomain(site.subdomain)}
                    </CardDescription>
                  </div>
                  <span className="rounded-full bg-muted px-2 py-1 text-xs capitalize">
                    {site.role}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-muted-foreground text-sm">
                  {site.activeDeploymentId ? (
                    <span className="flex items-center gap-1 text-green-600">
                      <span className="h-2 w-2 rounded-full bg-green-500" />
                      <span>Live</span>
                    </span>
                  ) : (
                    <span className="flex items-center gap-1">
                      <span className="h-2 w-2 rounded-full bg-yellow-500" />
                      <span>No deployment</span>
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
