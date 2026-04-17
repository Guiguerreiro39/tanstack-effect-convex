import { Text, View } from "react-native";
import { useHealthCheck } from "../api/health-check";

export function ApiStatus() {
  const { data: isHealthy, isPending, isError } = useHealthCheck();

  let statusText = "Checking...";
  let statusColor = "bg-gray-400";

  if (!isPending) {
    if (isError) {
      statusText = "Error";
      statusColor = "bg-red-500";
    } else if (isHealthy) {
      statusText = "Connected";
      statusColor = "bg-green-500";
    }
  }

  return (
    <View className="max-w-fit flex-row items-center space-x-2 rounded bg-gray-100 p-2">
      <View className={`h-2 w-2 rounded-full ${statusColor}`} />
      <Text className="font-medium text-gray-700 text-sm">
        API: {statusText}
      </Text>
    </View>
  );
}
