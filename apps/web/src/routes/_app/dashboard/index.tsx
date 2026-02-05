import { createFileRoute } from "@tanstack/react-router";
import { AuthGate } from "@/features/dashboard/ui/auth-gate";

export const Route = createFileRoute("/_app/dashboard/")({
  component: RouteComponent,
});

function RouteComponent() {
  return <AuthGate />;
}
