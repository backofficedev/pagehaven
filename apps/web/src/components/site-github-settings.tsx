import { useMutation, useQuery } from "@tanstack/react-query";
import {
  AlertCircle,
  Check,
  ExternalLink,
  GitBranch,
  Github,
  Link2,
  RefreshCw,
  Settings,
  Unlink,
} from "lucide-react";
import { useState } from "react";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { orpc, queryClient } from "@/utils/orpc";

type SiteGitHubSettingsProps = {
  siteId: string;
};

// Loading state component
function GitHubLoadingCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Github className="h-5 w-5" />
          GitHub Integration
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-center py-8">
          <Loader />
        </div>
      </CardContent>
    </Card>
  );
}

// Not connected state component
function GitHubNotConnectedCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Github className="h-5 w-5" />
          GitHub Integration
        </CardTitle>
        <CardDescription>
          Connect your GitHub account to enable automatic deployments
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200">
          <AlertCircle className="h-5 w-5" />
          <p className="text-sm">
            You need to connect your GitHub account first. Go to{" "}
            <a className="underline" href="/settings">
              Account Settings → GitHub
            </a>{" "}
            to connect.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: UI component with multiple states
export default function SiteGitHubSettings({
  siteId,
}: Readonly<SiteGitHubSettingsProps>) {
  const [isLinkDialogOpen, setIsLinkDialogOpen] = useState(false);
  const [selectedRepo, setSelectedRepo] = useState<string>("");
  const [selectedBranch, setSelectedBranch] = useState("main");
  const [buildCommand, setBuildCommand] = useState("");
  const [outputDirectory, setOutputDirectory] = useState("dist");
  const [installCommand, setInstallCommand] = useState("");

  const connectionQuery = useQuery(orpc.github.getConnection.queryOptions());
  const configQuery = useQuery(
    orpc.github.getSiteConfig.queryOptions({ input: { siteId } })
  );
  const reposQuery = useQuery({
    ...orpc.github.listRepos.queryOptions({ input: { page: 1, perPage: 100 } }),
    enabled: !!connectionQuery.data && isLinkDialogOpen,
  });

  const [repoOwner, repoName] = selectedRepo.split("/");

  const branchesQuery = useQuery({
    ...orpc.github.listBranches.queryOptions({
      input: { owner: repoOwner ?? "", repo: repoName ?? "" },
    }),
    enabled: !!selectedRepo,
  });

  const linkMutation = useMutation(orpc.github.linkRepo.mutationOptions());
  const unlinkMutation = useMutation(orpc.github.unlinkRepo.mutationOptions());
  const updateMutation = useMutation(
    orpc.github.updateSiteConfig.mutationOptions()
  );

  const handleLink = async () => {
    if (!selectedRepo) {
      return;
    }

    try {
      await linkMutation.mutateAsync({
        siteId,
        repoOwner,
        repoName,
        branch: selectedBranch,
        buildCommand: buildCommand || undefined,
        outputDirectory,
        installCommand: installCommand || undefined,
        autoDeploy: true,
      });
      toast.success("Repository linked successfully");
      queryClient.invalidateQueries({ queryKey: orpc.github.key() });
      setIsLinkDialogOpen(false);
      resetForm();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to link repository"
      );
    }
  };

  const handleUnlink = async () => {
    try {
      await unlinkMutation.mutateAsync({ siteId });
      toast.success("Repository unlinked");
      queryClient.invalidateQueries({ queryKey: orpc.github.key() });
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to unlink repository"
      );
    }
  };

  const handleToggleAutoDeploy = async () => {
    if (!configQuery.data) {
      return;
    }

    try {
      await updateMutation.mutateAsync({
        siteId,
        autoDeploy: !configQuery.data.autoDeploy,
      });
      toast.success(
        configQuery.data.autoDeploy
          ? "Auto-deploy disabled"
          : "Auto-deploy enabled"
      );
      queryClient.invalidateQueries({ queryKey: orpc.github.key() });
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to update settings"
      );
    }
  };

  const resetForm = () => {
    setSelectedRepo("");
    setSelectedBranch("main");
    setBuildCommand("");
    setOutputDirectory("dist");
    setInstallCommand("");
  };

  if (connectionQuery.isPending || configQuery.isPending) {
    return <GitHubLoadingCard />;
  }

  const connection = connectionQuery.data;
  const config = configQuery.data;

  if (!connection) {
    return <GitHubNotConnectedCard />;
  }

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
              Deploy automatically from your GitHub repository
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {config ? (
          <div className="space-y-4">
            <div className="rounded-lg border p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Github className="h-8 w-8" />
                  <div>
                    <a
                      className="flex items-center gap-1 font-medium hover:underline"
                      href={`https://github.com/${config.repoFullName}`}
                      rel="noopener noreferrer"
                      target="_blank"
                    >
                      {config.repoFullName}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                    <div className="flex items-center gap-2 text-muted-foreground text-sm">
                      <GitBranch className="h-3 w-3" />
                      {config.repoBranch}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    disabled={updateMutation.isPending}
                    onClick={handleToggleAutoDeploy}
                    size="sm"
                    variant="outline"
                  >
                    {config.autoDeploy ? (
                      <>
                        <Check className="mr-2 h-4 w-4 text-green-500" />
                        Auto-deploy On
                      </>
                    ) : (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Auto-deploy Off
                      </>
                    )}
                  </Button>
                  <Button
                    disabled={unlinkMutation.isPending}
                    onClick={handleUnlink}
                    size="sm"
                    variant="outline"
                  >
                    <Unlink className="mr-2 h-4 w-4" />
                    Unlink
                  </Button>
                </div>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1">
                <p className="font-medium text-sm">Build Command</p>
                <p className="text-muted-foreground text-sm">
                  {config.buildCommand ?? "None"}
                </p>
              </div>
              <div className="space-y-1">
                <p className="font-medium text-sm">Output Directory</p>
                <p className="text-muted-foreground text-sm">
                  {config.outputDirectory}
                </p>
              </div>
              <div className="space-y-1">
                <p className="font-medium text-sm">Install Command</p>
                <p className="text-muted-foreground text-sm">
                  {config.installCommand ?? "None"}
                </p>
              </div>
              <div className="space-y-1">
                <p className="font-medium text-sm">Last Deployed</p>
                <p className="text-muted-foreground text-sm">
                  {config.lastDeployedAt
                    ? new Date(config.lastDeployedAt).toLocaleString()
                    : "Never"}
                </p>
              </div>
            </div>

            {config.lastDeployedCommit ? (
              <div className="rounded-lg bg-muted p-3">
                <p className="font-medium text-sm">Last Deployed Commit</p>
                <code className="text-muted-foreground text-xs">
                  {config.lastDeployedCommit.slice(0, 7)}
                </code>
              </div>
            ) : null}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-lg border border-dashed p-8 text-center">
              <Github className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
              <h3 className="mb-2 font-medium">Link a Repository</h3>
              <p className="mb-4 text-muted-foreground text-sm">
                Connect a GitHub repository to enable automatic deployments when
                you push code.
              </p>
              <Dialog
                onOpenChange={setIsLinkDialogOpen}
                open={isLinkDialogOpen}
              >
                <DialogTrigger asChild>
                  <Button>
                    <Link2 className="mr-2 h-4 w-4" />
                    Link Repository
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-lg">
                  <DialogHeader>
                    <DialogTitle>Link GitHub Repository</DialogTitle>
                    <DialogDescription>
                      Select a repository and configure deployment settings.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Repository</Label>
                      <Select
                        onValueChange={setSelectedRepo}
                        value={selectedRepo}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a repository" />
                        </SelectTrigger>
                        <SelectContent>
                          {reposQuery.isPending ? (
                            <div className="flex items-center justify-center p-4">
                              <Loader />
                            </div>
                          ) : (
                            reposQuery.data?.map((repo) => (
                              <SelectItem key={repo.id} value={repo.fullName}>
                                {repo.fullName}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                    </div>

                    {selectedRepo ? (
                      <>
                        <div className="space-y-2">
                          <Label>Branch</Label>
                          <Select
                            onValueChange={setSelectedBranch}
                            value={selectedBranch}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select a branch" />
                            </SelectTrigger>
                            <SelectContent>
                              {branchesQuery.isPending ? (
                                <div className="flex items-center justify-center p-4">
                                  <Loader />
                                </div>
                              ) : (
                                branchesQuery.data?.map((branch) => (
                                  <SelectItem
                                    key={branch.name}
                                    value={branch.name}
                                  >
                                    {branch.name}
                                  </SelectItem>
                                ))
                              )}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="outputDir">Output Directory</Label>
                          <Input
                            id="outputDir"
                            onChange={(e) => setOutputDirectory(e.target.value)}
                            placeholder="dist"
                            value={outputDirectory}
                          />
                          <p className="text-muted-foreground text-xs">
                            The directory containing your built files
                          </p>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="buildCmd">
                            Build Command (optional)
                          </Label>
                          <Input
                            id="buildCmd"
                            onChange={(e) => setBuildCommand(e.target.value)}
                            placeholder="npm run build"
                            value={buildCommand}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="installCmd">
                            Install Command (optional)
                          </Label>
                          <Input
                            id="installCmd"
                            onChange={(e) => setInstallCommand(e.target.value)}
                            placeholder="npm install"
                            value={installCommand}
                          />
                        </div>
                      </>
                    ) : null}
                  </div>
                  <DialogFooter>
                    <Button
                      onClick={() => setIsLinkDialogOpen(false)}
                      variant="outline"
                    >
                      Cancel
                    </Button>
                    <Button
                      disabled={!selectedRepo || linkMutation.isPending}
                      onClick={handleLink}
                    >
                      {linkMutation.isPending ? (
                        <Loader />
                      ) : (
                        <>
                          <Settings className="mr-2 h-4 w-4" />
                          Link Repository
                        </>
                      )}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
