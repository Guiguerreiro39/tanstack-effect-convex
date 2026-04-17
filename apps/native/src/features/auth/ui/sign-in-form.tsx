import { Schema } from "effect";
import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { authClient } from "@/shared/lib/auth-client";
import { Email, Password } from "../model/schemas";

export function SignInForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setError(null);
    const emailResult = Schema.decodeUnknownEither(Email)(email);
    const passResult = Schema.decodeUnknownEither(Password)(password);

    if (emailResult._tag === "Left") {
      setError("Invalid email address");
      return;
    }
    if (passResult._tag === "Left") {
      setError("Password must be at least 8 characters");
      return;
    }

    setIsPending(true);
    const { error: authError } = await authClient.signIn.email({
      email,
      password,
    });
    setIsPending(false);

    if (authError) {
      setError(authError.message || "Failed to sign in");
    }
  };

  return (
    <View className="mx-auto w-full max-w-sm space-y-4 p-4">
      <Text className="mb-4 text-center font-bold text-2xl">Sign In</Text>

      {error ? (
        <View className="rounded-md bg-red-100 p-3">
          <Text className="font-medium text-red-700 text-sm">{error}</Text>
        </View>
      ) : null}

      <View className="space-y-1">
        <Text className="font-medium text-gray-700 text-sm">Email</Text>
        <TextInput
          autoCapitalize="none"
          className="w-full rounded-md border border-gray-300 bg-white p-3 shadow-sm"
          keyboardType="email-address"
          onChangeText={setEmail}
          placeholder="you@example.com"
          value={email}
        />
      </View>

      <View className="mt-4 space-y-1">
        <Text className="font-medium text-gray-700 text-sm">Password</Text>
        <TextInput
          className="w-full rounded-md border border-gray-300 bg-white p-3 shadow-sm"
          onChangeText={setPassword}
          placeholder="••••••••"
          secureTextEntry
          value={password}
        />
      </View>

      <Pressable
        className={`mt-6 w-full items-center justify-center rounded-md p-3 ${
          isPending ? "bg-black/70" : "bg-black"
        }`}
        disabled={isPending}
        onPress={handleSubmit}
      >
        {isPending ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text className="font-semibold text-white">Sign In</Text>
        )}
      </Pressable>
    </View>
  );
}
