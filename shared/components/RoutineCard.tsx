import { Pressable, Text, View } from "react-native";
import { BrutalistButton } from "./BrutalistButton";

type RoutineCardProps = {
  name: string;
  meta: string;
  onPress: () => void;
  onStart?: () => void;
  isToday?: boolean;
  variant?: "list" | "grid";
};

export function RoutineCard({
  name,
  meta,
  onPress,
  onStart,
  isToday = false,
  variant = "list",
}: RoutineCardProps) {
  if (variant === "grid") {
    return (
      <Pressable
        onPress={onPress}
        className="rounded-card border border-border-subtle bg-bg-surface p-4 mb-3"
        style={{ width: "48%" }}
      >
        <Text className="text-text-primary font-sans-semibold">{name}</Text>
        <Text className="text-text-secondary text-xs font-sans mt-1">
          {meta}
        </Text>
      </Pressable>
    );
  }

  return (
    <View className="rounded-card border border-border-subtle bg-bg-surface p-4 mb-3">
      <View className="flex-row items-center justify-between">
        <Text className="text-text-primary text-base font-sans-semibold">
          {name}
        </Text>
        {isToday && (
          <View className="rounded-pill bg-accent px-3 py-1">
            <Text className="text-text-on-accent text-[10px] font-sans-semibold uppercase">
              Hoy
            </Text>
          </View>
        )}
      </View>
      <Text className="text-text-secondary text-sm font-sans mt-1">{meta}</Text>
      <View className="flex-row items-center gap-3 mt-3">
        <Pressable
          onPress={onPress}
          className="rounded-pill bg-bg-surface-alt border border-border-subtle px-4 py-2"
        >
          <Text className="text-text-primary font-sans-semibold">Ver</Text>
        </Pressable>
        {onStart && (
          <View className="flex-1">
            <BrutalistButton label="Empezar" onPress={onStart} />
          </View>
        )}
      </View>
    </View>
  );
}
