import { ActivityIndicator, Text, View } from "react-native";
import { UserMenu } from "../../auth/ui/user-menu";
import { usePrivateData } from "../api/get-private-data";

export function DashboardContent() {
  const data = usePrivateData();

  return (
    <View className="mx-auto w-full max-w-3xl flex-1 space-y-8 p-4">
      <View className="my-8">
        <Text className="mb-4 font-bold text-3xl text-gray-900">Dashboard</Text>
        <UserMenu />
      </View>

      <View className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <Text className="mb-4 font-semibold text-gray-900 text-xl">
          Super Secret Data
        </Text>
        <View className="rounded-lg border border-gray-100 bg-gray-50 p-4">
          {(() => {
            if (data === undefined) {
              return <ActivityIndicator color="black" />;
            }
            if (data === null) {
              return (
                <Text className="text-gray-500 italic">No data found</Text>
              );
            }
            return (
              <Text className="break-words font-mono text-gray-800 text-sm">
                {JSON.stringify(data, null, 2)}
              </Text>
            );
          })()}
        </View>
      </View>
    </View>
  );
}
