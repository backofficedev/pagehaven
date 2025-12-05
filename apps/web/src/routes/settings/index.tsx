import { createFileRoute } from "@tanstack/react-router";
import SettingsPage from "@/components/settings/settings-page";
import { requireAuth, type SessionData } from "@/lib/auth-types";

export const Route = createFileRoute("/settings/")({
  component: RouteComponent,
  beforeLoad: requireAuth,
});

function RouteComponent() {
  const { session } = Route.useRouteContext();
  // We know session.data exists because of the beforeLoad guard
  return <SettingsPage session={session.data as SessionData} />;
}
