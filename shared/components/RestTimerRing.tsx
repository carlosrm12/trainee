import { useEffect, useRef } from "react";
import { Pressable, Text, View } from "react-native";
import Animated, {
  Easing,
  interpolateColor,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import Svg, { Circle } from "react-native-svg";

// Ver docs/animaciones-ui-app-entrenamiento.md §2.2
// - Progreso: stroke-dashoffset animado en tiempo real siguiendo `remaining`
//   (useRestTimer actualiza ese valor ~1 vez por segundo; acá lo suavizamos
//   con withTiming en vez de saltar de golpe cada vez que cambia).
// - Llegada a 0: flash amarillo→blanco + expansión radial breve antes de
//   cerrar el modal. El haptic de éxito ya lo dispara useRestTimer.finish(),
//   así que no lo repetimos acá.
// - Botones ±15s: el número central salta levemente en cada ajuste.

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const COLOR_ACCENT = "#F5C518";
const COLOR_TRACK = "#2A2A32";
const COLOR_WHITE = "#FFFFFF";

type RestTimerRingProps = {
  remaining: number;
  total: number;
  onSkip: () => void;
  size?: number;
};

export function RestTimerRing({
  remaining,
  total,
  onSkip,
  size = 220,
}: RestTimerRingProps) {
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const isFinished = remaining <= 0;
  const targetProgress = isFinished ? 0 : total > 0 ? remaining / total : 0;

  const progress = useSharedValue(targetProgress);
  const flashProgress = useSharedValue(isFinished ? 1 : 0);
  const ringScale = useSharedValue(1);
  const numberBump = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(targetProgress, {
      duration: 1000,
      easing: Easing.linear,
    });
  }, [remaining, total, targetProgress, progress]);

  // useRestTimer espera 400ms entre remaining<=0 y desmontar este componente
  // (ver finish() en useRestTimer.ts) — tiempo de sobra para que este flash
  // + expansión se vea completo antes de que se cierre el modal.
  useEffect(() => {
    if (isFinished) {
      flashProgress.value = withTiming(1, { duration: 150 });
      ringScale.value = withSequence(
        withTiming(1.07, { duration: 150 }),
        withTiming(1, { duration: 150 }),
      );
    }
  }, [isFinished, flashProgress, ringScale]);

  // Detecta un ajuste ±15s por el cambio en `total` (adjust() lo modifica
  // sin reiniciar el componente). El primer render no dispara bump porque
  // el ref arranca ya igualado al total inicial.
  const prevTotalRef = useRef(total);
  useEffect(() => {
    if (prevTotalRef.current !== total) {
      numberBump.value = withSequence(
        withSpring(-2, { duration: 60, dampingRatio: 1 }),
        withSpring(0, { duration: 120, dampingRatio: 0.6 }),
      );
    }
    prevTotalRef.current = total;
  }, [total, numberBump]);

  const animatedCircleProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - progress.value),
    stroke: interpolateColor(
      flashProgress.value,
      [0, 1],
      [COLOR_ACCENT, COLOR_WHITE],
    ),
  }));

  const ringContainerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: ringScale.value }],
  }));

  const numberStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: numberBump.value }],
  }));

  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;
  const label = `${minutes}:${seconds.toString().padStart(2, "0")}`;

  return (
    <View style={{ alignItems: "center" }}>
      <Animated.View
        style={[
          {
            width: size,
            height: size,
            alignItems: "center",
            justifyContent: "center",
          },
          ringContainerStyle,
        ]}
      >
        <Svg width={size} height={size}>
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
        <Animated.View style={[{ position: "absolute" }, numberStyle]}>
          <Text className="text-text-primary text-4xl font-sans-bold">
            {label}
          </Text>
        </Animated.View>
      </Animated.View>
      <Pressable onPress={onSkip} className="mt-8">
        <Text className="text-text-secondary font-sans underline">
          Saltar descanso
        </Text>
      </Pressable>
    </View>
  );
}
