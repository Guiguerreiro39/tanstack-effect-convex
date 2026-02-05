import { cn } from "@/shared/lib/utils";
import { useHealthCheck } from "../api/health-check";

export function ApiStatus() {
  const healthCheck = useHealthCheck();

  const getStatusText = () => {
    if (healthCheck.isLoading) {
      return "Checking...";
    }
    if (healthCheck.data === "OK") {
      return "Connected";
    }
    return "Error";
  };

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
              {getStatusText()}
            </span>
          </div>
        </section>
      </div>
    </div>
  );
}
