import { Tabs } from "expo-router";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#F5C518",
        tabBarInactiveTintColor: "#9B9BA5",
        tabBarStyle: {
          backgroundColor: "#0E0E12",
          borderTopColor: "#2A2A32",
          borderTopWidth: 1,
        },
      }}
    >
      <Tabs.Screen name="index" options={{ title: "Home" }} />
      <Tabs.Screen name="routines" options={{ title: "Rutinas" }} />
      <Tabs.Screen name="history" options={{ title: "Historial" }} />
      <Tabs.Screen name="exercises" options={{ title: "Buscar" }} />
      <Tabs.Screen name="profile" options={{ title: "Perfil" }} />
    </Tabs>
  );
}
