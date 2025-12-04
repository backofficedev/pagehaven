import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import {
  ArrowLeft,
  Eye,
  Globe,
  Lock,
  Mail,
  Plus,
  Trash2,
  Users,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
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

export const Route = createFileRoute("/sites/$siteId/settings")({
  component: SettingsPage,
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

const accessOptions = [
  {
    value: "public",
    label: "Public",
    description: "Anyone can view your site",
    icon: Globe,
  },
  {
    value: "password",
    label: "Password Protected",
    description: "Visitors need a password to view",
    icon: Lock,
  },
  {
    value: "private",
    label: "Private",
    description: "Only invited users can view",
    icon: Users,
  },
  {
    value: "owner_only",
    label: "Owner Only",
    description: "Only site members can view",
    icon: Eye,
  },
] as const;

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Settings page has many form sections
function SettingsPage() {
  const { siteId } = Route.useParams();
  const [siteName, setSiteName] = useState("");
  const [siteDescription, setSiteDescription] = useState("");
  const [customDomain, setCustomDomain] = useState("");
  const [accessType, setAccessType] = useState<string>("public");
  const [sitePassword, setSitePassword] = useState("");

  const siteQuery = useQuery(orpc.site.get.queryOptions({ input: { siteId } }));
  const accessQuery = useQuery(
    orpc.access.get.queryOptions({ input: { siteId } })
  );
  const invitesQuery = useQuery(
    orpc.access.listInvites.queryOptions({ input: { siteId } })
  );

  const [inviteEmail, setInviteEmail] = useState("");

  useEffect(() => {
    if (siteQuery.data) {
      setSiteName(siteQuery.data.name);
      setSiteDescription(siteQuery.data.description ?? "");
      setCustomDomain(siteQuery.data.customDomain ?? "");
    }
  }, [siteQuery.data]);

  useEffect(() => {
    if (accessQuery.data) {
      setAccessType(accessQuery.data.accessType);
    }
  }, [accessQuery.data]);

  const updateSiteMutation = useMutation({
    ...orpc.site.update.mutationOptions(),
    onSuccess: () => {
      toast.success("Site updated successfully");
      queryClient.invalidateQueries({ queryKey: ["site"] });
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const updateAccessMutation = useMutation({
    ...orpc.access.update.mutationOptions(),
    onSuccess: () => {
      toast.success("Access settings updated");
      queryClient.invalidateQueries({ queryKey: ["access"] });
      setSitePassword("");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const deleteSiteMutation = useMutation({
    ...orpc.site.delete.mutationOptions(),
    onSuccess: () => {
      toast.success("Site deleted");
      queryClient.invalidateQueries({ queryKey: ["site"] });
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const createInviteMutation = useMutation({
    ...orpc.access.createInvite.mutationOptions(),
    onSuccess: () => {
      toast.success("Invite sent");
      queryClient.invalidateQueries({ queryKey: ["access", "listInvites"] });
      setInviteEmail("");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const deleteInviteMutation = useMutation({
    ...orpc.access.deleteInvite.mutationOptions(),
    onSuccess: () => {
      toast.success("Invite removed");
      queryClient.invalidateQueries({ queryKey: ["access", "listInvites"] });
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleUpdateSite = (e: React.FormEvent) => {
    e.preventDefault();
    updateSiteMutation.mutate({
      siteId,
      name: siteName,
      description: siteDescription || undefined,
      customDomain: customDomain || null,
    });
  };

  const handleUpdateAccess = (e: React.FormEvent) => {
    e.preventDefault();
    updateAccessMutation.mutate({
      siteId,
      accessType: accessType as
        | "public"
        | "password"
        | "private"
        | "owner_only",
      password: accessType === "password" ? sitePassword : undefined,
    });
  };

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleDeleteSite = () => {
    setShowDeleteConfirm(true);
  };

  const confirmDelete = () => {
    deleteSiteMutation.mutate({ siteId });
    setShowDeleteConfirm(false);
  };

  const site = siteQuery.data;

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <div className="mb-6">
        <Link
          className="mb-4 inline-flex items-center gap-1 text-muted-foreground text-sm hover:text-foreground"
          params={{ siteId }}
          to="/sites/$siteId"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to {site?.name ?? "Site"}
        </Link>
      </div>

      <div className="mb-8">
        <h1 className="font-bold text-3xl">Settings</h1>
        <p className="text-muted-foreground">Manage your site configuration</p>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>General</CardTitle>
            <CardDescription>Basic site information</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleUpdateSite}>
              <div className="space-y-2">
                <Label htmlFor="name">Site Name</Label>
                <Input
                  id="name"
                  onChange={(e) => setSiteName(e.target.value)}
                  placeholder="My Site"
                  value={siteName}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  onChange={(e) => setSiteDescription(e.target.value)}
                  placeholder="A brief description of your site"
                  value={siteDescription}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="domain">Custom Domain</Label>
                <Input
                  id="domain"
                  onChange={(e) => setCustomDomain(e.target.value)}
                  placeholder="example.com"
                  value={customDomain}
                />
                <p className="text-muted-foreground text-xs">
                  Point your domain's DNS to our servers to use a custom domain
                </p>
              </div>
              <Button disabled={updateSiteMutation.isPending} type="submit">
                {updateSiteMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Access Control</CardTitle>
            <CardDescription>Control who can view your site</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleUpdateAccess}>
              <div className="grid gap-3">
                {accessOptions.map((option) => (
                  <label
                    className={`flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-colors ${
                      accessType === option.value
                        ? "border-primary bg-primary/5"
                        : "hover:bg-muted/50"
                    }`}
                    key={option.value}
                  >
                    <input
                      checked={accessType === option.value}
                      className="mt-1"
                      name="accessType"
                      onChange={(e) => setAccessType(e.target.value)}
                      type="radio"
                      value={option.value}
                    />
                    <option.icon className="mt-0.5 h-5 w-5 text-muted-foreground" />
                    <div>
                      <div className="font-medium">{option.label}</div>
                      <div className="text-muted-foreground text-sm">
                        {option.description}
                      </div>
                    </div>
                  </label>
                ))}
              </div>

              {accessType === "password" ? (
                <div className="space-y-2">
                  <Label htmlFor="password">Site Password</Label>
                  <Input
                    id="password"
                    onChange={(e) => setSitePassword(e.target.value)}
                    placeholder="Enter a password for visitors"
                    type="password"
                    value={sitePassword}
                  />
                </div>
              ) : null}

              <Button disabled={updateAccessMutation.isPending} type="submit">
                {updateAccessMutation.isPending
                  ? "Updating..."
                  : "Update Access"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Invite Management - only show for private sites */}
        {accessType === "private" ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Invited Users
              </CardTitle>
              <CardDescription>
                Manage who can access your private site
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <form
                className="flex gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (inviteEmail) {
                    createInviteMutation.mutate({
                      siteId,
                      email: inviteEmail,
                    });
                  }
                }}
              >
                <Input
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="user@example.com"
                  type="email"
                  value={inviteEmail}
                />
                <Button
                  disabled={!inviteEmail || createInviteMutation.isPending}
                  type="submit"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Invite
                </Button>
              </form>

              {invitesQuery.isLoading ? (
                <p className="text-muted-foreground text-sm">
                  Loading invites...
                </p>
              ) : null}

              {Array.isArray(invitesQuery.data) &&
              invitesQuery.data.length > 0 ? (
                <div className="space-y-2">
                  {invitesQuery.data.map((invite) => (
                    <div
                      className="flex items-center justify-between rounded-lg border p-3"
                      key={invite.id}
                    >
                      <div>
                        <p className="font-medium text-sm">{invite.email}</p>
                        {invite.expiresAt ? (
                          <p className="text-muted-foreground text-xs">
                            Expires:{" "}
                            {new Date(invite.expiresAt).toLocaleDateString()}
                          </p>
                        ) : null}
                      </div>
                      <Button
                        disabled={deleteInviteMutation.isPending}
                        onClick={() =>
                          deleteInviteMutation.mutate({ inviteId: invite.id })
                        }
                        size="sm"
                        variant="ghost"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : null}

              {invitesQuery.data?.length === 0 ? (
                <p className="text-muted-foreground text-sm">
                  No invites yet. Add email addresses above to invite users.
                </p>
              ) : null}
            </CardContent>
          </Card>
        ) : null}

        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">Danger Zone</CardTitle>
            <CardDescription>
              Irreversible actions for your site
            </CardDescription>
          </CardHeader>
          <CardContent>
            {showDeleteConfirm ? (
              <div className="space-y-4">
                <p className="text-muted-foreground text-sm">
                  Are you sure you want to delete this site? This action cannot
                  be undone.
                </p>
                <div className="flex gap-2">
                  <Button
                    disabled={deleteSiteMutation.isPending}
                    onClick={confirmDelete}
                    variant="destructive"
                  >
                    {deleteSiteMutation.isPending
                      ? "Deleting..."
                      : "Yes, Delete Site"}
                  </Button>
                  <Button
                    onClick={() => setShowDeleteConfirm(false)}
                    variant="outline"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <Button onClick={handleDeleteSite} variant="destructive">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Site
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
