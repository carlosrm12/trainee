import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { Pressable, Text, View } from "react-native";

export function AttachedBottomNav({
  state,
  descriptors,
  navigation,
  insets,
}: BottomTabBarProps) {
  return (
    <View
      className="bg-bg-base border-t border-border-subtle rounded-t-[24px] pt-2"
      style={{ paddingBottom: Math.max(insets.bottom, 8) }}
    >
      <View className="flex-row items-center justify-around px-2">
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const label =
            typeof options.title === "string" ? options.title : route.name;
          const isFocused = state.index === index;

          function onPress() {
            const event = navigation.emit({
              type: "tabPress",
              target: route.key,
              canPreventDefault: true,
            });
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          }

          const icon = options.tabBarIcon?.({
            focused: isFocused,
            color: isFocused ? "#0E0E12" : "#FFFFFF",
            size: 20,
          });

          if (isFocused) {
            return (
              <Pressable
                key={route.key}
                onPress={onPress}
                className="flex-row items-center gap-2 bg-accent rounded-pill px-4 py-2"
              >
                {icon}
                <Text className="text-text-on-accent font-semibold text-xs">
                  {label}
                </Text>
              </Pressable>
            );
          }

          return (
            <Pressable
              key={route.key}
              onPress={onPress}
              className="items-center py-1 px-2"
            >
              {icon}
              <Text className="text-text-secondary text-[10px] mt-1">
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>
      <View className="items-center mt-2">
        <View
          style={{
            width: 110,
            height: 4,
            borderRadius: 2,
            backgroundColor: "#FFFFFF",
          }}
        />
      </View>
    </View>
  );
}
