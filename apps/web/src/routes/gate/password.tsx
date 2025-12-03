import { useMutation } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Lock } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

function setCookie(name: string, value: string, days: number) {
  const expires = new Date(
    Date.now() + days * 24 * 60 * 60 * 1000
  ).toUTCString();
  // biome-ignore lint/suspicious/noDocumentCookie: Required for cross-domain cookie setting
  document.cookie = `${name}=${value}; expires=${expires}; path=/; SameSite=Lax`;
}

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
import { orpc } from "@/utils/orpc";

export const Route = createFileRoute("/gate/password")({
  component: PasswordGatePage,
  validateSearch: (search: Record<string, unknown>) => ({
    siteId: (search.siteId as string) || "",
    redirect: (search.redirect as string) || "/",
  }),
});

function PasswordGatePage() {
  const { siteId, redirect } = Route.useSearch();
  const [password, setPassword] = useState("");

  const verifyMutation = useMutation({
    ...orpc.access.verifyPassword.mutationOptions(),
    onSuccess: (data) => {
      if (data.valid && data.token) {
        // Set cookie for this site using a helper
        setCookie(`site_password_${siteId}`, data.token, 30);
        toast.success("Access granted!");
        // Redirect to the original destination
        globalThis.location.href = redirect;
      } else {
        toast.error("Incorrect password");
      }
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!siteId) {
      toast.error("Site ID is required");
      return;
    }
    verifyMutation.mutate({ siteId, password });
  };

  if (!siteId) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">Invalid request</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <Lock className="h-6 w-6" />
          </div>
          <CardTitle>Password Protected</CardTitle>
          <CardDescription>
            This site requires a password to access
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                autoFocus
                id="password"
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter site password"
                required
                type="password"
                value={password}
              />
            </div>
            <Button
              className="w-full"
              disabled={verifyMutation.isPending}
              type="submit"
            >
              {verifyMutation.isPending ? "Verifying..." : "Access Site"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
