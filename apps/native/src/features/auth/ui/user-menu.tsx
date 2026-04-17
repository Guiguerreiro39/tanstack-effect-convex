import { useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { authClient } from "@/shared/lib/auth-client";
import { useCurrentUser } from "../api/get-current-user";

export function UserMenu() {
  const user = useCurrentUser();
  const [isPending, setIsPending] = useState(false);

  if (user === undefined) {
    return <ActivityIndicator size="small" />;
  }

  if (user === null) {
    return null;
  }

  const handleSignOut = async () => {
    setIsPending(true);
    await authClient.signOut();
    setIsPending(false);
  };

  return (
    <View className="flex-row items-center space-x-4 rounded-lg bg-gray-100 p-4">
      <View className="flex-1">
        <Text className="font-semibold text-gray-900">{user.name}</Text>
        <Text className="text-gray-500 text-sm">{user.email}</Text>
      </View>
      <Pressable
        className="rounded-md bg-gray-200 px-4 py-2"
        disabled={isPending}
        onPress={handleSignOut}
      >
        {isPending ? (
          <ActivityIndicator color="black" size="small" />
        ) : (
          <Text className="font-medium text-gray-700 text-sm">Sign out</Text>
        )}
      </Pressable>
    </View>
  );
}
