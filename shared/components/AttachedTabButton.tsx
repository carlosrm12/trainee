import type { BottomTabBarButtonProps } from "@react-navigation/bottom-tabs";
import { Pressable, View } from "react-native";
import { colors, radius } from "../theme/tokens";

export function AttachedTabButton(props: BottomTabBarButtonProps) {
  const { children, onPress, accessibilityState } = props;
  const focused = accessibilityState?.selected ?? false;

  return (
    <Pressable
      onPress={onPress}
      style={{
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        paddingTop: 6,
      }}
    >
      <View
        style={{
          paddingHorizontal: focused ? 16 : 4,
          paddingVertical: focused ? 6 : 0,
          borderRadius: radius.pill,
          backgroundColor: focused ? colors.accent : "transparent",
          alignItems: "center",
        }}
      >
        {children}
      </View>
    </Pressable>
  );
}
