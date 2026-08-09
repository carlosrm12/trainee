import { Text, View } from "react-native";

type StatItem = {
  icon?: string; // emoji o glifo simple, ej. "🔥"
  value: string;
  label: string;
};

type StatRowProps = {
  items: StatItem[];
};

export function StatRow({ items }: StatRowProps) {
  return (
    <View className="flex-row">
      {items.map((item, index) => (
        <View
          key={`${item.label}-${index}`}
          className={`flex-1 items-center px-2 ${
            index > 0 ? "border-l border-border-subtle" : ""
          }`}
        >
          <Text className="text-text-primary text-base font-sans-semibold">
            {item.icon ? `${item.icon} ` : ""}
            {item.value}
          </Text>
          <Text className="text-text-secondary text-[11px] font-sans mt-0.5">
            {item.label}
          </Text>
        </View>
      ))}
    </View>
  );
}
