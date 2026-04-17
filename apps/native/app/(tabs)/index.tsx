import { Text, View } from "react-native";
import { ApiStatus } from "../../src/features/home/ui/api-status";

export default function HomeScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-white p-4">
      <Text className="mb-4 font-bold text-2xl">React Native App</Text>
      <Text className="mb-8 text-center text-base text-gray-500">
        Powered by NativeWind, Expo Router, and Convex
      </Text>
      <ApiStatus />
    </View>
  );
}
