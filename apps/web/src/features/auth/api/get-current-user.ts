import { api } from "@tanstack-effect-convex/backend/src/convex/_generated/api";
import { useQuery } from "convex/react";

export function useCurrentUser() {
  return useQuery(api.auth.getCurrentUser);
}
