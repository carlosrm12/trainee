import { Pressable, ScrollView, Text } from "react-native";

type FilterChipOutlineProps = {
  options: string[];
  selected: string;
  onSelect: (option: string) => void;
};

export function FilterChipOutline({
  options,
  selected,
  onSelect,
}: FilterChipOutlineProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerClassName="gap-2"
    >
      {options.map((option) => {
        const isSelected = option === selected;
        return (
          <Pressable
            key={option}
            onPress={() => onSelect(option)}
            className={`rounded-pill border px-4 py-1.5 ${
              isSelected ? "border-accent" : "border-border-subtle"
            }`}
          >
            <Text
              className={`text-xs font-sans-medium ${
                isSelected ? "text-accent" : "text-text-secondary"
              }`}
            >
              {option}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}
