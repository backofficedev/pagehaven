import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/gate/denied")({
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Hello "/gate/denied"!</div>;
}
