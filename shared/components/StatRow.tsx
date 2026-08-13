import { CountUpText } from "@/shared/components/CountUpText";
import { Text, View } from "react-native";

type StatItem = {
  icon?: string; // emoji o glifo simple, ej. "🔥"
  value: string;
  label: string;
  // Ver docs/animaciones-ui-app-entrenamiento.md §2.8. Si se pasa, el
  // texto anima como count-up desde 0 hasta este número en vez de
  // mostrarse fijo — `value` sigue siendo obligatorio como fallback
  // estático (ej. accesibilidad) pero no se renderiza en ese caso.
  countUpTo?: number;
  countUpFormatter?: (n: number) => string;
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
          <View className="flex-row items-center">
            {item.icon ? (
              <Text className="text-text-primary text-base font-sans-semibold">
                {item.icon}{" "}
              </Text>
            ) : null}
            {item.countUpTo !== undefined ? (
              <CountUpText
                value={item.countUpTo}
                formatter={item.countUpFormatter}
                className="text-text-primary text-base font-sans-semibold"
              />
            ) : (
              <Text className="text-text-primary text-base font-sans-semibold">
                {item.value}
              </Text>
            )}
          </View>
          <Text className="text-text-secondary text-[11px] font-sans mt-0.5">
            {item.label}
          </Text>
        </View>
      ))}
    </View>
  );
}
