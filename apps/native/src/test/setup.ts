import { vi } from "vitest";

// Mock Expo modules
vi.mock("expo-constants", () => ({
  default: {
    expoConfig: {
      extra: {
        convexUrl: "https://mock-url.convex.cloud",
      },
    },
  },
}));

// Mock Convex React
vi.mock("convex/react", () => ({
  useConvexAuth: vi.fn(() => ({
    isAuthenticated: true,
    isLoading: false,
  })),
}));
