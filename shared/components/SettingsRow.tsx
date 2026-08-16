import type { ReactNode } from "react";
import { Text, View } from "react-native";

type SettingsRowProps = {
  label: string;
  description?: string;
  control: ReactNode;
  isLast?: boolean;
};

// Extraído de profile.tsx (§7/§13 del doc de Fase 2) — patrón "label +
// descripción a la izquierda, control a la derecha, separador border-subtle"
// que ahora comparten Perfil y Ajustes de Nutrición.
export function SettingsRow({
  label,
  description,
  control,
  isLast = false,
}: SettingsRowProps) {
  return (
    <View
      className={`flex-row items-center justify-between px-4 py-4 ${
        isLast ? "" : "border-b border-border-subtle"
      }`}
    >
      <View className="flex-1 pr-3">
        <Text className="text-text-primary font-sans-semibold">{label}</Text>
        {description ? (
          <Text className="text-text-secondary text-xs font-sans mt-0.5">
            {description}
          </Text>
        ) : null}
      </View>
      {control}
    </View>
  );
}
