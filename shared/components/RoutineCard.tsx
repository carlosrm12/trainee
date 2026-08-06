import { Pressable, Text, View } from "react-native";

type RoutineCardProps = {
  name: string;
  meta: string;
  onPress: () => void;
  variant?: "list" | "grid";
};

export function RoutineCard({
  name,
  meta,
  onPress,
  variant = "list",
}: RoutineCardProps) {
  if (variant === "grid") {
    return (
      <Pressable
        onPress={onPress}
        className="rounded-card border border-border-subtle bg-bg-surface p-4 mb-3"
        style={{ width: "48%" }}
      >
        <Text className="text-text-primary font-semibold">{name}</Text>
        <Text className="text-text-secondary text-xs mt-1">{meta}</Text>
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      className="rounded-card border border-border-subtle bg-bg-surface p-4 mb-3"
    >
      <Text className="text-text-primary text-lg font-semibold">{name}</Text>
      <Text className="text-text-secondary text-sm mt-1">{meta}</Text>
      <View className="mt-3 self-start rounded-pill bg-accent px-4 py-2">
        <Text className="text-text-on-accent font-semibold">Empezar</Text>
      </View>
    </Pressable>
  );
}
