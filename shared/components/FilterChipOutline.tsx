import { Pressable, Text } from "react-native";
import { colors, radius } from "../theme/tokens";

type FilterChipOutlineProps = {
  label: string;
  selected: boolean;
  onPress: () => void;
};

export function FilterChipOutline({
  label,
  selected,
  onPress,
}: FilterChipOutlineProps) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        height: 36,
        justifyContent: "center",
        paddingHorizontal: 16,
        borderRadius: radius.pill,
        borderWidth: 1,
        borderColor: selected ? colors.accent : colors.borderSubtle,
        backgroundColor: "transparent",
      }}
    >
      <Text
        style={{
          color: selected ? colors.accent : colors.textSecondary,
          fontFamily: selected ? "Inter_600SemiBold" : "Inter_500Medium",
          fontSize: 13,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}
