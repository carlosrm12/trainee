import { Pressable, Text, View } from "react-native";

type RoutineCardProps = {
  name: string;
  meta: string;
  onPress: () => void;
};

export function RoutineCard({ name, meta, onPress }: RoutineCardProps) {
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
