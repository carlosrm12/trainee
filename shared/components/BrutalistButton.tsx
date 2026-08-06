import { useRef } from "react";
import { Animated, Pressable, Text, View } from "react-native";
import { colors, radius } from "../theme/tokens";

type BrutalistButtonProps = {
  label: string;
  onPress: () => void;
  variant?: "primary" | "fab";
  state?: "default" | "success";
  disabled?: boolean;
};

export function BrutalistButton({
  label,
  onPress,
  variant = "primary",
  state = "default",
  disabled = false,
}: BrutalistButtonProps) {
  const translate = useRef(new Animated.Value(0)).current;

  function handlePressIn() {
    Animated.timing(translate, {
      toValue: 3,
      duration: 80,
      useNativeDriver: true,
    }).start();
  }

  function handlePressOut() {
    Animated.spring(translate, {
      toValue: 0,
      damping: 12,
      useNativeDriver: true,
    }).start();
  }

  const bg = state === "success" ? colors.success : colors.accent;
  const isFab = variant === "fab";

  return (
    <View style={{ alignSelf: isFab ? "flex-end" : "stretch" }}>
      {/* Sombra offset fija — no se mueve, el botón se desplaza sobre ella */}
      <View
        style={{
          position: "absolute",
          top: 3,
          left: 3,
          right: isFab ? undefined : -3,
          bottom: -3,
          width: isFab ? 56 : undefined,
          height: isFab ? 56 : undefined,
          backgroundColor: colors.accentPressed,
          borderRadius: isFab ? 28 : radius.card,
        }}
      />
      <Animated.View
        style={{
          transform: [{ translateX: translate }, { translateY: translate }],
        }}
      >
        <Pressable
          onPress={onPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          disabled={disabled}
          style={{
            backgroundColor: disabled ? colors.bgSurfaceAlt : bg,
            borderWidth: 2,
            borderColor: colors.bgBase,
            borderRadius: isFab ? 28 : radius.card,
            width: isFab ? 56 : undefined,
            height: isFab ? 56 : undefined,
            alignItems: "center",
            justifyContent: "center",
            paddingVertical: isFab ? 0 : 14,
            paddingHorizontal: isFab ? 0 : 20,
          }}
        >
          <Text
            style={{
              color: disabled ? colors.textSecondary : colors.textOnAccent,
              fontFamily: "Inter_600SemiBold",
              fontSize: isFab ? 24 : 15,
            }}
          >
            {label}
          </Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}
