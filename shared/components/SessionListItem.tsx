import { Pressable, Text, View } from "react-native";

type SessionListItemProps = {
  routineName: string;
  dateLabel: string;
  durationMinutes: number | null;
  totalSets: number;
  onPress: () => void;
};

export function SessionListItem({
  routineName,
  dateLabel,
  durationMinutes,
  totalSets,
  onPress,
}: SessionListItemProps) {
  const metaParts = [
    durationMinutes !== null ? `${durationMinutes} min` : null,
    `${totalSets} sets`,
    dateLabel,
  ].filter(Boolean);

  return (
    <Pressable onPress={onPress} className="flex-row items-center py-3 px-4">
      <Text className="text-lg mr-3">🏋</Text>
      <View className="flex-1">
        <Text className="text-text-primary font-sans-semibold">
          {routineName}
        </Text>
        <Text className="text-text-secondary text-xs font-sans mt-0.5">
          {metaParts.join(" · ")}
        </Text>
      </View>
    </Pressable>
  );
}
