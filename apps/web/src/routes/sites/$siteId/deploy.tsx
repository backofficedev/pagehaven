import { formatSize } from "@pagehaven/utils/format";
import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { File, Loader2, Upload } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { SitePageHeader } from "@/components/site-page-header";
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
import { orpc, queryClient } from "@/utils/orpc";

export const Route = createFileRoute("/sites/$siteId/deploy")({
  component: DeployPage,
  beforeLoad: requireAuth,
});

type FileToUpload = {
  path: string;
  content: string;
  size: number;
};

function DeployPage() {
  const { siteId } = Route.useParams();
  const navigate = useNavigate();
  const [files, setFiles] = useState<FileToUpload[]>([]);
  const [commitMessage, setCommitMessage] = useState("");
  const [isDeploying, setIsDeploying] = useState(false);

  const siteQuery = useQuery(orpc.site.get.queryOptions({ input: { siteId } }));

  const createDeploymentMutation = useMutation(
    orpc.deployment.create.mutationOptions()
  );
  const uploadFilesMutation = useMutation(
    orpc.upload.uploadFiles.mutationOptions()
  );
  const markProcessingMutation = useMutation(
    orpc.deployment.markProcessing.mutationOptions()
  );
  const finalizeMutation = useMutation(
    orpc.deployment.finalize.mutationOptions()
  );

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles) {
      return;
    }

    const filePromises = Array.from(selectedFiles).map(async (file) => {
      const content = await readFileAsBase64(file);
      // Use webkitRelativePath for folder uploads, fallback to name
      const path =
        (file as File & { webkitRelativePath?: string }).webkitRelativePath ||
        file.name;
      return {
        path,
        content,
        size: file.size,
      };
    });

    const newFiles = await Promise.all(filePromises);
    setFiles((prev) => [...prev, ...newFiles]);
  };

  const readFileAsBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // Remove data URL prefix
        const base64 = result.split(",")[1];
        resolve(base64 ?? "");
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleDeploy = async () => {
    if (files.length === 0) {
      toast.error("Please select files to deploy");
      return;
    }

    setIsDeploying(true);

    try {
      // 1. Create deployment
      const deployment = await createDeploymentMutation.mutateAsync({
        siteId,
        commitMessage: commitMessage || undefined,
      });

      // 2. Mark as processing
      await markProcessingMutation.mutateAsync({
        deploymentId: deployment.id,
      });

      // 3. Upload files in batches
      const batchSize = 10;
      for (let i = 0; i < files.length; i += batchSize) {
        const batch = files.slice(i, i + batchSize);
        await uploadFilesMutation.mutateAsync({
          deploymentId: deployment.id,
          files: batch.map((f) => ({
            filePath: f.path,
            content: f.content,
          })),
        });
      }

      // 4. Finalize deployment
      const totalSize = files.reduce((acc, f) => acc + f.size, 0);
      await finalizeMutation.mutateAsync({
        deploymentId: deployment.id,
        fileCount: files.length,
        totalSize,
      });

      toast.success("Deployment successful!");
      queryClient.invalidateQueries({ queryKey: ["site"] });
      queryClient.invalidateQueries({ queryKey: ["deployment"] });
      navigate({ to: "/sites/$siteId", params: { siteId } });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Deployment failed");
    } finally {
      setIsDeploying(false);
    }
  };

  const removeFile = (path: string) => {
    setFiles((prev) => prev.filter((f) => f.path !== path));
  };

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <SitePageHeader
        description="Upload your static files to deploy"
        siteId={siteId}
        siteName={siteQuery.data?.name}
        title="Deploy"
      />

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Upload Files</CardTitle>
          <CardDescription>
            Select files or a folder to deploy. All files will be uploaded to
            your site.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="files">Select Files</Label>
            <Input
              className="cursor-pointer"
              id="files"
              multiple
              onChange={handleFileSelect}
              type="file"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="folder">Or Select Folder</Label>
            <input
              className="flex h-9 w-full cursor-pointer rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:font-medium file:text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
              id="folder"
              multiple
              onChange={handleFileSelect}
              type="file"
              // @ts-expect-error - webkitdirectory is a non-standard attribute
              webkitdirectory=""
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Commit Message (optional)</Label>
            <Input
              id="message"
              onChange={(e) => setCommitMessage(e.target.value)}
              placeholder="What changed in this deployment?"
              value={commitMessage}
            />
          </div>
        </CardContent>
      </Card>

      {files.length > 0 ? (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Files to Deploy ({files.length})</CardTitle>
            <CardDescription>
              Total size:{" "}
              {formatSize(files.reduce((acc, f) => acc + f.size, 0))}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="max-h-64 space-y-2 overflow-y-auto">
              {files.map((file) => (
                <div
                  className="flex items-center justify-between rounded border p-2"
                  key={file.path}
                >
                  <div className="flex items-center gap-2">
                    <File className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{file.path}</span>
                    <span className="text-muted-foreground text-xs">
                      ({formatSize(file.size)})
                    </span>
                  </div>
                  <Button
                    onClick={() => removeFile(file.path)}
                    size="sm"
                    variant="ghost"
                  >
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : null}

      <div className="flex gap-4">
        <Button
          className="min-w-32"
          disabled={files.length === 0 || isDeploying}
          onClick={handleDeploy}
        >
          {isDeploying ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Deploying...
            </>
          ) : (
            <>
              <Upload className="mr-2 h-4 w-4" />
              Deploy
            </>
          )}
        </Button>
        <Button
          disabled={files.length === 0 || isDeploying}
          onClick={() => setFiles([])}
          variant="outline"
        >
          Clear Files
        </Button>
      </div>
    </div>
  );
}
