import { Tabs } from "expo-router";
import { Dumbbell, History, Home, Search, User } from "lucide-react-native";
import { View } from "react-native";

function TabIcon({
  focused,
  Icon,
  size,
}: {
  focused: boolean;
  Icon: typeof Home;
  size: number;
}) {
  return (
    <View
      style={{
        paddingHorizontal: focused ? 16 : 0,
        paddingVertical: focused ? 6 : 0,
        borderRadius: 22,
        backgroundColor: focused ? "#F5C518" : "transparent",
      }}
    >
      <Icon color={focused ? "#0E0E12" : "#9B9BA5"} size={size} />
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#F5C518",
        tabBarInactiveTintColor: "#9B9BA5",
        tabBarLabelStyle: { fontFamily: "Inter_500Medium", fontSize: 11 },
        tabBarStyle: {
          backgroundColor: "#0E0E12",
          borderTopColor: "#2A2A32",
          borderTopWidth: 1,
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          height: 68,
          paddingTop: 10,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ focused, size }) => (
            <TabIcon focused={focused} Icon={Home} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="routines"
        options={{
          title: "Rutinas",
          tabBarIcon: ({ focused, size }) => (
            <TabIcon focused={focused} Icon={Dumbbell} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: "Historial",
          tabBarIcon: ({ focused, size }) => (
            <TabIcon focused={focused} Icon={History} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="exercises"
        options={{
          title: "Buscar",
          tabBarIcon: ({ focused, size }) => (
            <TabIcon focused={focused} Icon={Search} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Perfil",
          tabBarIcon: ({ focused, size }) => (
            <TabIcon focused={focused} Icon={User} size={size} />
          ),
        }}
      />
    </Tabs>
  );
}
