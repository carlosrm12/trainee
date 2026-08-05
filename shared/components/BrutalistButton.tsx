import { Pressable, Text, View } from "react-native";

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
  const bg = state === "success" ? "bg-success" : "bg-accent";
  const shadowBg = state === "success" ? "bg-success" : "bg-accent-pressed";

  if (variant === "fab") {
    return (
      <View className="relative self-start mr-[3px] mb-[3px]">
        <View
          className={`absolute top-[3px] left-[3px] w-full h-full rounded-full ${shadowBg}`}
        />
        <Pressable
          onPress={onPress}
          disabled={disabled}
          className={`relative w-14 h-14 items-center justify-center rounded-full border-2 border-bg-base ${bg}`}
        >
          <Text className="text-text-on-accent text-2xl font-bold">+</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View className="relative self-stretch mr-[3px] mb-[3px]">
      <View
        className={`absolute top-[3px] left-[3px] w-full h-full rounded-chip ${shadowBg}`}
      />
      <Pressable
        onPress={onPress}
        disabled={disabled}
        className={`relative items-center justify-center rounded-chip border-2 border-bg-base px-5 py-3 ${bg}`}
      >
        <Text className="text-text-on-accent text-center font-semibold uppercase tracking-wide">
          {label}
        </Text>
      </Pressable>
    </View>
  );
}
