import { Pressable, Text } from "react-native";

type SessionCardProps = {
  routineName: string;
  dateLabel: string;
  onPress: () => void;
};

export function SessionCard({
  routineName,
  dateLabel,
  onPress,
}: SessionCardProps) {
  return (
    <Pressable
      onPress={onPress}
      className="rounded-card border border-border-subtle bg-bg-surface p-4 mb-3"
    >
      <Text className="text-text-primary text-lg font-semibold">
        {routineName}
      </Text>
      <Text className="text-text-secondary text-sm mt-1">{dateLabel}</Text>
    </Pressable>
  );
}
