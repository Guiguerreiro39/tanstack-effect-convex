import { matchEffect } from "@tanstack-effect-convex/effect-convex";
import { useConvexAuth } from "convex/react";
import { ActivityIndicator, ScrollView, Text, View } from "react-native";
import { useTodos } from "../api/get-all";
import { AddTodoForm } from "./add-todo-form";
import { TodoItem } from "./todo-item";

export function TodoList() {
  const { isAuthenticated } = useConvexAuth();
  const todos = useTodos();

  if (!isAuthenticated) {
    return (
      <View className="flex-1 items-center justify-center p-4">
        <Text className="text-gray-500 italic">
          Please sign in to view todos
        </Text>
      </View>
    );
  }

  return (
    <View className="mx-auto w-full max-w-2xl flex-1 flex-col space-y-6 p-4">
      <Text className="mb-2 font-bold text-3xl text-gray-900">Todos</Text>

      <AddTodoForm />

      <View className="mt-6 flex-1">
        {matchEffect(todos, {
          onPending: () => (
            <View className="mt-8 items-center justify-center">
              <ActivityIndicator color="black" size="large" />
            </View>
          ),
          onFailure: (error) => (
            <View className="mt-4 rounded-lg bg-red-100 p-4">
              <Text className="mb-1 font-semibold text-red-700">Error</Text>
              <Text className="text-red-600">
                {error.message || "Failed to load todos"}
              </Text>
            </View>
          ),
          onSuccess: (data) =>
            data.length === 0 ? (
              <View className="mt-8 items-center justify-center rounded-lg border border-gray-100 border-dashed bg-gray-50 p-8">
                <Text className="text-gray-500 text-lg">No todos yet.</Text>
                <Text className="mt-1 text-gray-400">Add one above!</Text>
              </View>
            ) : (
              <ScrollView
                className="mt-4 space-y-2"
                showsVerticalScrollIndicator={false}
              >
                {data.map((todo) => (
                  <TodoItem key={todo._id} todo={todo} />
                ))}
                <View className="h-8" />
              </ScrollView>
            ),
        })}
      </View>
    </View>
  );
}
