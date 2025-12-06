import { useMutation, useQuery } from "@tanstack/react-query";
import { Check, Copy, Key, Plus, Trash2 } from "lucide-react";
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

type ApiKey = {
  id: string;
  name: string;
  keyPrefix: string;
  scopes: string[];
  lastUsedAt: Date | null;
  expiresAt: Date | null;
  createdAt: Date;
};

type NewApiKey = {
  id: string;
  name: string;
  key: string;
  keyPrefix: string;
  scopes: string[];
  expiresAt: Date | undefined;
};

export default function ApiKeysManager() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [newKeyExpiry, setNewKeyExpiry] = useState<string>("never");
  const [createdKey, setCreatedKey] = useState<NewApiKey | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);

  const keysQuery = useQuery(orpc.apiKey.list.queryOptions());

  const createMutation = useMutation(orpc.apiKey.create.mutationOptions());
  const revokeMutation = useMutation(orpc.apiKey.revoke.mutationOptions());

  const handleCreate = async () => {
    if (!newKeyName.trim()) {
      toast.error("Please enter a name for the API key");
      return;
    }

    try {
      const expiresInDays =
        newKeyExpiry === "never"
          ? undefined
          : Number.parseInt(newKeyExpiry, 10);
      const result = await createMutation.mutateAsync({
        name: newKeyName.trim(),
        scopes: ["*"],
        expiresInDays,
      });

      setCreatedKey(result);
      queryClient.invalidateQueries({ queryKey: orpc.apiKey.key() });
      setNewKeyName("");
      setNewKeyExpiry("never");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to create API key"
      );
    }
  };

  const handleRevoke = async (keyId: string) => {
    try {
      await revokeMutation.mutateAsync({ keyId });
      toast.success("API key revoked");
      queryClient.invalidateQueries({ queryKey: orpc.apiKey.key() });
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to revoke API key"
      );
    }
  };

  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const formatDate = (date: Date | string | null) => {
    if (!date) {
      return "Never";
    }
    const d = new Date(date);
    return d.toLocaleDateString();
  };

  const formatRelativeTime = (date: Date | string | null) => {
    if (!date) {
      return "Never";
    }
    const d = new Date(date);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return "Today";
    }
    if (diffDays === 1) {
      return "Yesterday";
    }
    if (diffDays < 7) {
      return `${diffDays} days ago`;
    }
    if (diffDays < 30) {
      return `${Math.floor(diffDays / 7)} weeks ago`;
    }
    return formatDate(date);
  };

  if (keysQuery.isPending) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>API Keys</CardTitle>
          <CardDescription>
            Manage API keys for CLI and programmatic access
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

  const keys = (keysQuery.data ?? []) as ApiKey[];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>API Keys</CardTitle>
              <CardDescription>
                Create API keys for CLI and programmatic access to your account
              </CardDescription>
            </div>
            <Dialog
              onOpenChange={(open: boolean) => {
                setIsCreateOpen(open);
                if (!open) {
                  setCreatedKey(null);
                  setNewKeyName("");
                  setNewKeyExpiry("never");
                }
              }}
              open={isCreateOpen}
            >
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Key
                </Button>
              </DialogTrigger>
              <DialogContent>
                {createdKey ? (
                  <>
                    <DialogHeader>
                      <DialogTitle>API Key Created</DialogTitle>
                      <DialogDescription>
                        Copy your API key now. You won't be able to see it
                        again.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label>Your API Key</Label>
                        <div className="flex gap-2">
                          <Input
                            className="font-mono"
                            readOnly
                            value={createdKey.key}
                          />
                          <Button
                            onClick={() => copyToClipboard(createdKey.key)}
                            size="icon"
                            variant="outline"
                          >
                            {copiedKey ? (
                              <Check className="h-4 w-4 text-green-500" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                      <div className="rounded-md bg-amber-50 p-3 text-amber-800 text-sm dark:bg-amber-950 dark:text-amber-200">
                        <strong>Important:</strong> Store this key securely. It
                        will only be shown once.
                      </div>
                    </div>
                    <DialogFooter>
                      <Button onClick={() => setIsCreateOpen(false)}>
                        Done
                      </Button>
                    </DialogFooter>
                  </>
                ) : (
                  <>
                    <DialogHeader>
                      <DialogTitle>Create API Key</DialogTitle>
                      <DialogDescription>
                        Create a new API key for CLI or programmatic access
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="key-name">Name</Label>
                        <Input
                          id="key-name"
                          onChange={(e) => setNewKeyName(e.target.value)}
                          placeholder="e.g., CLI, CI/CD, GitHub Actions"
                          value={newKeyName}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="key-expiry">Expiration</Label>
                        <Select
                          onValueChange={setNewKeyExpiry}
                          value={newKeyExpiry}
                        >
                          <SelectTrigger id="key-expiry">
                            <SelectValue placeholder="Select expiration" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="never">Never expires</SelectItem>
                            <SelectItem value="30">30 days</SelectItem>
                            <SelectItem value="90">90 days</SelectItem>
                            <SelectItem value="180">180 days</SelectItem>
                            <SelectItem value="365">1 year</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button
                        onClick={() => setIsCreateOpen(false)}
                        variant="outline"
                      >
                        Cancel
                      </Button>
                      <Button
                        disabled={createMutation.isPending}
                        onClick={handleCreate}
                      >
                        {createMutation.isPending ? <Loader /> : "Create Key"}
                      </Button>
                    </DialogFooter>
                  </>
                )}
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {keys.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              <Key className="mx-auto mb-4 h-12 w-12 opacity-50" />
              <p>No API keys yet</p>
              <p className="text-sm">
                Create an API key to use the CLI or integrate with CI/CD
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {keys.map((key) => (
                <div
                  className="flex items-center justify-between rounded-lg border p-4"
                  key={key.id}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Key className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{key.name}</span>
                    </div>
                    <p className="font-mono text-muted-foreground text-sm">
                      {key.keyPrefix}...
                    </p>
                    <div className="flex gap-4 text-muted-foreground text-xs">
                      <span>Created: {formatDate(key.createdAt)}</span>
                      <span>
                        Last used: {formatRelativeTime(key.lastUsedAt)}
                      </span>
                      {key.expiresAt ? (
                        <span>Expires: {formatDate(key.expiresAt)}</span>
                      ) : null}
                    </div>
                  </div>
                  <Button
                    disabled={revokeMutation.isPending}
                    onClick={() => handleRevoke(key.id)}
                    size="sm"
                    variant="destructive"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Revoke
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Using API Keys</CardTitle>
          <CardDescription>
            How to authenticate with your API key
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="mb-2 font-medium">CLI</h4>
            <pre className="rounded-md bg-muted p-3 font-mono text-sm">
              pagehaven login --token YOUR_API_KEY
            </pre>
          </div>
          <div>
            <h4 className="mb-2 font-medium">HTTP Header</h4>
            <pre className="rounded-md bg-muted p-3 font-mono text-sm">
              Authorization: Bearer YOUR_API_KEY
            </pre>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
