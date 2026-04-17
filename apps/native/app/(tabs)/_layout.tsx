import { Tabs } from "expo-router";

export default function TabLayout() {
  return (
    <Tabs screenOptions={{ headerShown: true }}>
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          headerTitle: "Home",
          tabBarLabel: "Home",
        }}
      />
      <Tabs.Screen
        name="dashboard"
        options={{
          title: "Dashboard",
          headerTitle: "Dashboard",
          tabBarLabel: "Dashboard",
        }}
      />
      <Tabs.Screen
        name="todos"
        options={{
          title: "Todos",
          headerTitle: "Todos",
          tabBarLabel: "Todos",
        }}
      />
    </Tabs>
  );
}
