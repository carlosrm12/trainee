import { Text, View } from "react-native";

type ConfidenceBadgeProps = {
  confidence: number; // 0-1
};

// Mismo tratamiento visual chico que StreakBadge (§13 del doc de Fase 2).
// Confianza baja se resalta en vez de bloquear el guardado — es la comida
// del usuario, la IA solo ayuda (§5).
export function ConfidenceBadge({ confidence }: ConfidenceBadgeProps) {
  const percent = Math.round(confidence * 100);
  const isLow = confidence < 0.6;

  return (
    <View
      className={`flex-row items-center px-2.5 py-1 rounded-pill border ${
        isLow ? "border-danger" : "border-border-subtle"
      }`}
    >
      <Text
        className={`text-xs font-sans-semibold ${
          isLow ? "text-danger" : "text-text-secondary"
        }`}
      >
        Confianza IA: {percent}%
      </Text>
    </View>
  );
}
