import { useConvexAuth } from "convex/react";
import { ActivityIndicator, View } from "react-native";
import { AuthGate } from "../../src/features/dashboard/ui/auth-gate";
import { DashboardContent } from "../../src/features/dashboard/ui/dashboard-content";

export default function DashboardScreen() {
  const { isLoading, isAuthenticated } = useConvexAuth();

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50">
        <ActivityIndicator color="black" size="large" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      {isAuthenticated ? <DashboardContent /> : <AuthGate />}
    </View>
  );
}
