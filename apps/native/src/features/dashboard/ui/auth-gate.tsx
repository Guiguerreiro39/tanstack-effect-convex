import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { SignInForm } from "../../auth/ui/sign-in-form";
import { SignUpForm } from "../../auth/ui/sign-up-form";

export function AuthGate() {
  const [isSignIn, setIsSignIn] = useState(true);

  return (
    <View className="mx-auto w-full max-w-sm flex-1 items-center justify-center p-4">
      {isSignIn ? <SignInForm /> : <SignUpForm />}
      <View className="mt-8 flex-row items-center">
        <Text className="text-gray-500">
          {isSignIn ? "Don't have an account? " : "Already have an account? "}
        </Text>
        <Pressable onPress={() => setIsSignIn(!isSignIn)}>
          <Text className="font-semibold text-blue-600 hover:underline">
            {isSignIn ? "Sign up" : "Sign in"}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
