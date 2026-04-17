import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { useCreateTodo } from "../api/create";

export function AddTodoForm() {
  const [text, setText] = useState("");
  const createTodo = useCreateTodo();

  const handleSubmit = () => {
    if (!text.trim()) {
      return;
    }
    createTodo.mutate({ text });
    setText("");
  };

  return (
    <View className="flex-row items-center space-x-2">
      <TextInput
        className="flex-1 rounded-lg border border-gray-300 bg-white p-3 text-base shadow-sm"
        onChangeText={setText}
        onSubmitEditing={handleSubmit}
        placeholder="Add a new todo..."
        returnKeyType="done"
        value={text}
      />
      <Pressable
        className={`min-w-[70px] flex-row items-center justify-center rounded-lg bg-black p-3 ${
          createTodo.isPending || !text.trim() ? "opacity-50" : ""
        }`}
        disabled={createTodo.isPending || !text.trim()}
        onPress={handleSubmit}
      >
        {createTodo.isPending ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text className="font-semibold text-white">Add</Text>
        )}
      </Pressable>
    </View>
  );
}
