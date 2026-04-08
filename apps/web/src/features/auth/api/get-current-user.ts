import { api } from "@tanstack-effect-convex/backend/api";
import { useQuery } from "convex/react";

export function useCurrentUser() {
  return useQuery(api.auth.getCurrentUser);
}
