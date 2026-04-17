import type { Todo } from "@tanstack-effect-convex/backend/contracts";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { useDeleteTodo } from "../api/delete";
import { useToggleTodo } from "../api/toggle";

export function TodoItem({ todo }: { todo: Todo }) {
  const toggleTodo = useToggleTodo();
  const deleteTodo = useDeleteTodo();

  return (
    <View className="mb-2 flex-row items-center justify-between rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <Pressable
        className="flex-1 flex-row items-center"
        disabled={toggleTodo.isPending}
        onPress={() =>
          toggleTodo.mutate({ id: todo._id, completed: !todo.completed })
        }
      >
        <View
          className={`h-5 w-5 rounded border ${
            todo.completed
              ? "border-black bg-black"
              : "border-gray-300 bg-white"
          } mr-3 items-center justify-center`}
        >
          {todo.completed && (
            <View className="h-2.5 w-2.5 rounded-sm bg-white" />
          )}
        </View>
        <Text
          className={`text-base ${
            todo.completed ? "text-gray-400 line-through" : "text-gray-900"
          }`}
        >
          {todo.text}
        </Text>
      </Pressable>

      <Pressable
        className="ml-4 rounded bg-red-100 p-2"
        disabled={deleteTodo.isPending}
        onPress={() => deleteTodo.mutate({ id: todo._id })}
      >
        {deleteTodo.isPending ? (
          <ActivityIndicator color="#dc2626" size="small" />
        ) : (
          <Text className="font-medium text-red-600">Delete</Text>
        )}
      </Pressable>
    </View>
  );
}
