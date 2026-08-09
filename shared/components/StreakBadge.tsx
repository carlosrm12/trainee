import { Text, View } from "react-native";

type StreakBadgeProps = {
  days: number;
};

export function StreakBadge({ days }: StreakBadgeProps) {
  if (days <= 0) return null;

  return (
    <View className="flex-row items-center px-2.5 py-1 rounded-pill border border-accent">
      <Text className="text-accent font-sans-semibold text-xs">🔥 {days}</Text>
    </View>
  );
}
