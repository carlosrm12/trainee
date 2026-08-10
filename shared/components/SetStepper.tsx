import { Pressable, Text, View } from "react-native";

type SetStepperProps = {
  label: string;
  value: number;
  unit?: string;
  step: number;
  min?: number;
  helperText?: string;
  onChange: (value: number) => void;
};

export function SetStepper({
  label,
  value,
  unit,
  step,
  min = 0,
  helperText,
  onChange,
}: SetStepperProps) {
  return (
    <View className="items-center flex-1">
      <Text className="text-text-secondary text-sm font-sans mb-2">
        {label}
      </Text>
      <Text className="text-text-primary text-4xl font-sans-bold">
        {value}
        {unit ? (
          <Text className="text-2xl font-sans text-text-secondary">
            {" "}
            {unit}
          </Text>
        ) : null}
      </Text>
      {helperText ? (
        <Text className="text-text-secondary text-xs font-sans mt-1">
          {helperText}
        </Text>
      ) : (
        <View style={{ height: 16 }} />
      )}
      <View className="flex-row gap-3 mt-3">
        <Pressable
          onPress={() => onChange(Math.max(min, value - step))}
          className="w-11 h-11 rounded-full bg-bg-surface-alt items-center justify-center"
        >
          <Text className="text-text-primary text-xl font-sans-bold">−</Text>
        </Pressable>
        <Pressable
          onPress={() => onChange(value + step)}
          className="w-11 h-11 rounded-full bg-bg-surface-alt items-center justify-center"
        >
          <Text className="text-text-primary text-xl font-sans-bold">+</Text>
        </Pressable>
      </View>
    </View>
  );
}
