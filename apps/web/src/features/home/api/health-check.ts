import { convexQuery } from "@convex-dev/react-query";
import { useQuery } from "@tanstack/react-query";
import { api } from "@tanstack-effect-convex/backend/api";

export function useHealthCheck() {
  return useQuery(convexQuery(api.healthCheck.get, {}));
}
