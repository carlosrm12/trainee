import { Text, View } from "react-native";

type ExerciseRowState = "default" | "active" | "done";

type ExerciseRowProps = {
  order: number;
  name: string;
  meta: string;
  state?: ExerciseRowState;
};

export function ExerciseRow({
  order,
  name,
  meta,
  state = "default",
}: ExerciseRowProps) {
  const isDone = state === "done";
  const isActive = state === "active";

  return (
    <View className="flex-row items-center py-3 flex-1">
      <View
        className={`w-7 h-7 rounded-full items-center justify-center mr-3 ${
          isDone ? "bg-success" : isActive ? "bg-accent" : "bg-bg-surface-alt"
        }`}
      >
        <Text
          className={`text-xs font-sans-bold ${
            isDone || isActive ? "text-text-on-accent" : "text-text-secondary"
          }`}
        >
          {order}
        </Text>
      </View>
      <View className="flex-1">
        <Text
          className={`font-sans-semibold ${
            isDone ? "text-text-secondary" : "text-text-primary"
          }`}
        >
          {name}
        </Text>
        <Text className="text-text-secondary text-sm font-sans mt-0.5">
          {meta}
        </Text>
      </View>
    </View>
  );
}
