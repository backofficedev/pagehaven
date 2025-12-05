import { createFileRoute, redirect } from "@tanstack/react-router";
import SettingsPage from "@/components/settings/settings-page";
import { authClient } from "@/lib/auth-client";
import type { SessionData } from "@/lib/auth-types";

export const Route = createFileRoute("/settings/")({
  component: RouteComponent,
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

function RouteComponent() {
  const { session } = Route.useRouteContext();
  // We know session.data exists because of the beforeLoad guard
  return <SettingsPage session={session.data as SessionData} />;
}
