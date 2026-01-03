import { convexQuery } from "@convex-dev/react-query";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { api } from "@tanstack-effect-convex/backend/convex/_generated/api";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  component: HomeComponent,
});

function HomeComponent() {
  const healthCheck = useQuery(convexQuery(api.healthCheck.get, {}));

  return (
    <div className="container mx-auto max-w-3xl px-4 py-2">
      <div className="grid gap-6">
        <section className="rounded-lg border p-4">
          <h2 className="mb-2 font-medium">API Status</h2>
          <div className="flex items-center gap-2">
            <div
              className={cn("h-2 w-2 rounded-full", {
                "bg-green-500": healthCheck.data === "OK",
                "bg-orange-400": healthCheck.isLoading,
                "bg-red-500":
                  healthCheck.data !== "OK" && !healthCheck.isLoading,
              })}
            />
            <span className="text-muted-foreground text-sm">
              {(() => {
                if (healthCheck.isLoading) {
                  return "Checking...";
                }

                if (healthCheck.data === "OK") {
                  return "Connected";
                }

                return "Error";
              })()}
            </span>
          </div>
        </section>
      </div>
    </div>
  );
}
