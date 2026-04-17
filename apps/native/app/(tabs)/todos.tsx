import { View } from "react-native";
import { TodoList } from "../../src/features/todos/ui/todo-list";

export default function TodosScreen() {
  return (
    <View className="flex-1 bg-gray-50">
      <TodoList />
    </View>
  );
}
