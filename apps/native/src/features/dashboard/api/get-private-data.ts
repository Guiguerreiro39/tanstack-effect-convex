import { api } from "@tanstack-effect-convex/backend/api";
import { useQuery } from "convex/react";

export function usePrivateData() {
  return useQuery(api.privateData.get);
}
