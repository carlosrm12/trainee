import { useEffect } from "react";
import { Text, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedProps,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import Svg, { Circle } from "react-native-svg";

// Reutiliza la técnica SVG de RestTimerRing (circunferencia + strokeDashoffset
// animado, ver docs/animaciones-ui-app-entrenamiento.md §2.2) para el anillo
// de progreso de calorías del dashboard de Nutrición (§6 del doc de Fase 2:
// "El anillo de progreso de calorías reutiliza la lógica de RestTimerRing").
// No es el mismo componente: acá no hay countdown, ni flash de "llegada a
// 0", ni botones ±15s — solo progreso (consumido/objetivo) que se anima al
// cambiar.

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const COLOR_ACCENT = "#F5C518";
const COLOR_TRACK = "#2A2A32";

type MacroRingProps = {
  consumedCalories: number;
  targetCalories: number;
  size?: number;
};

export function MacroRing({
  consumedCalories,
  targetCalories,
  size = 160,
}: MacroRingProps) {
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const targetProgress =
    targetCalories > 0 ? Math.min(1, consumedCalories / targetCalories) : 0;

  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(targetProgress, {
      duration: 700,
      easing: Easing.out(Easing.cubic),
    });
  }, [targetProgress, progress]);

  const animatedCircleProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - progress.value),
  }));

  return (
    <View
      style={{
        width: size,
        height: size,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Svg width={size} height={size} style={{ position: "absolute" }}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={COLOR_TRACK}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={COLOR_ACCENT}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeLinecap="round"
          rotation="-90"
          origin={`${size / 2}, ${size / 2}`}
          animatedProps={animatedCircleProps}
        />
      </Svg>
      <View style={{ alignItems: "center" }}>
        <Text className="text-text-primary text-xl font-sans-bold">
          {Math.round(consumedCalories)}
        </Text>
        <Text className="text-text-secondary text-[11px] font-sans">
          / {Math.round(targetCalories)} kcal
        </Text>
      </View>
    </View>
  );
}
