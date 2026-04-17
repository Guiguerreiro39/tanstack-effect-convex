import { expoClient } from "@better-auth/expo/client";
import { convexClient } from "@convex-dev/better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";
// biome-ignore lint/performance/noNamespaceImport: SecureStore API requires it
import * as SecureStore from "expo-secure-store";

// Ensure process.env handles EXPO_PUBLIC_* correctly in NativeWind/Babel setup
const baseURL = process.env.EXPO_PUBLIC_CONVEX_SITE_URL;

if (!baseURL) {
  throw new Error("EXPO_PUBLIC_CONVEX_SITE_URL is not set");
}

export const authClient = createAuthClient({
  baseURL,
  plugins: [
    expoClient({
      scheme: "myapp",
      // biome-ignore lint/suspicious/noExplicitAny: Better Auth types mismatch
      storage: SecureStore as any,
    }),
    convexClient(),
  ],
});
