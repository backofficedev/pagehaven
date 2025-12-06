import { useMutation, useQuery } from "@tanstack/react-query";
import { Github, Link2, Unlink } from "lucide-react";
import { toast } from "sonner";
import Loader from "@/components/loader";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { orpc, queryClient } from "@/utils/orpc";

export default function GitHubConnection() {
  const connectionQuery = useQuery(orpc.github.getConnection.queryOptions());

  const getAuthUrlMutation = useMutation(
    orpc.github.getAuthUrl.mutationOptions()
  );
  const disconnectMutation = useMutation(
    orpc.github.disconnect.mutationOptions()
  );

  const handleConnect = async () => {
    try {
      const result = await getAuthUrlMutation.mutateAsync({});
      // Store state in sessionStorage for verification on callback
      sessionStorage.setItem("github_oauth_state", result.state);
      // Redirect to GitHub
      window.location.href = result.url;
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to start GitHub OAuth"
      );
    }
  };

  const handleDisconnect = async () => {
    try {
      await disconnectMutation.mutateAsync({});
      toast.success("GitHub disconnected");
      queryClient.invalidateQueries({ queryKey: orpc.github.key() });
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to disconnect GitHub"
      );
    }
  };

  if (connectionQuery.isPending) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>GitHub Integration</CardTitle>
          <CardDescription>
            Connect your GitHub account to deploy from repositories
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader />
          </div>
        </CardContent>
      </Card>
    );
  }

  const connection = connectionQuery.data;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Github className="h-5 w-5" />
              GitHub Integration
            </CardTitle>
            <CardDescription>
              Connect your GitHub account to deploy from repositories
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {connection ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="flex items-center gap-3">
                {connection.githubAvatarUrl ? (
                  <img
                    alt={connection.githubUsername}
                    className="h-10 w-10 rounded-full"
                    height={40}
                    src={connection.githubAvatarUrl}
                    width={40}
                  />
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                    <Github className="h-5 w-5" />
                  </div>
                )}
                <div>
                  <p className="font-medium">{connection.githubUsername}</p>
                  <p className="text-muted-foreground text-sm">
                    Connected{" "}
                    {new Date(connection.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <Button
                disabled={disconnectMutation.isPending}
                onClick={handleDisconnect}
                size="sm"
                variant="outline"
              >
                {disconnectMutation.isPending ? (
                  <Loader />
                ) : (
                  <>
                    <Unlink className="mr-2 h-4 w-4" />
                    Disconnect
                  </>
                )}
              </Button>
            </div>
            <p className="text-muted-foreground text-sm">
              You can now link your sites to GitHub repositories for automatic
              deployments.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-lg border border-dashed p-8 text-center">
              <Github className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
              <h3 className="mb-2 font-medium">Connect GitHub</h3>
              <p className="mb-4 text-muted-foreground text-sm">
                Link your GitHub account to enable automatic deployments from
                your repositories.
              </p>
              <Button
                disabled={getAuthUrlMutation.isPending}
                onClick={handleConnect}
              >
                {getAuthUrlMutation.isPending ? (
                  <Loader />
                ) : (
                  <>
                    <Link2 className="mr-2 h-4 w-4" />
                    Connect GitHub
                  </>
                )}
              </Button>
            </div>
            <div className="space-y-2 text-muted-foreground text-sm">
              <p className="font-medium text-foreground">
                What you'll get with GitHub integration:
              </p>
              <ul className="list-inside list-disc space-y-1">
                <li>Automatic deployments on push</li>
                <li>Deploy from any branch</li>
                <li>Build command support</li>
                <li>Deployment history with commit info</li>
              </ul>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
