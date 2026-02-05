import { api } from "@tanstack-effect-convex/backend/src/convex/_generated/api";
import { useQuery } from "convex/react";

export function usePrivateData() {
  return useQuery(api.privateData.get);
}
