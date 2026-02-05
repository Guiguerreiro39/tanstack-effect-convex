import { createFileRoute } from "@tanstack/react-router";
import { ApiStatus } from "@/features/home/ui/api-status";

export const Route = createFileRoute("/_app/")({
  component: HomeComponent,
});

function HomeComponent() {
  return <ApiStatus />;
}
