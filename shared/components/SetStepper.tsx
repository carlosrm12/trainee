import { Pressable, Text, View } from "react-native";

type SetStepperProps = {
  label: string;
  value: number;
  unit?: string;
  step: number;
  min?: number;
  onChange: (value: number) => void;
};

export function SetStepper({
  label,
  value,
  unit,
  step,
  min = 0,
  onChange,
}: SetStepperProps) {
  return (
    <View className="items-center flex-1">
      <Text className="text-text-secondary text-sm mb-2">{label}</Text>
      <Text className="text-text-primary text-4xl font-bold">
        {value}
        {unit ? (
          <Text className="text-2xl text-text-secondary"> {unit}</Text>
        ) : null}
      </Text>
      <View className="flex-row gap-3 mt-3">
        <Pressable
          onPress={() => onChange(Math.max(min, value - step))}
          className="w-11 h-11 rounded-full bg-bg-surface-alt items-center justify-center"
        >
          <Text className="text-text-primary text-xl font-bold">−</Text>
        </Pressable>
        <Pressable
          onPress={() => onChange(value + step)}
          className="w-11 h-11 rounded-full bg-bg-surface-alt items-center justify-center"
        >
          <Text className="text-text-primary text-xl font-bold">+</Text>
        </Pressable>
      </View>
    </View>
  );
}
