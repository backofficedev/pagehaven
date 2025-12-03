import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { Eye, Globe, Lock, Plus, Users } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
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
import { authClient } from "@/lib/auth-client";
import { orpc, queryClient } from "@/utils/orpc";

export const Route = createFileRoute("/sites/")({
  component: SitesPage,
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

  const getAccessIcon = (accessType?: string) => {
    switch (accessType) {
      case "public":
        return <Globe className="h-4 w-4 text-green-500" />;
      case "password":
        return <Lock className="h-4 w-4 text-yellow-500" />;
      case "private":
        return <Users className="h-4 w-4 text-blue-500" />;
      case "owner_only":
        return <Eye className="h-4 w-4 text-red-500" />;
      default:
        return <Globe className="h-4 w-4 text-muted-foreground" />;
    }
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
                    .pagehaven.io
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
        <Card>
          <CardContent className="py-12 text-center">
            <Globe className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="mb-2 font-medium text-lg">No sites yet</h3>
            <p className="mb-4 text-muted-foreground">
              Create your first site to get started
            </p>
            <Button onClick={() => setShowCreateForm(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Site
            </Button>
          </CardContent>
        </Card>
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
                      {getAccessIcon()}
                    </CardTitle>
                    <CardDescription>
                      {site.subdomain}.pagehaven.io
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
                      Live
                    </span>
                  ) : (
                    <span className="flex items-center gap-1">
                      <span className="h-2 w-2 rounded-full bg-yellow-500" />
                      No deployment
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
