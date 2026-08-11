import { useEffect, useRef } from "react";
import { Text, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

// Ver docs/animaciones-ui-app-entrenamiento.md §2.7
// El número de racha anima como odómetro (scroll vertical corto) en vez
// de saltar directo. Cada dígito es su propia "cinta": cuando cambia,
// entra deslizándose desde abajo + fade, en vez de reemplazarse de golpe.
// withTiming (no spring) — elemento base/flat del sistema (§1).

const DIGIT_DURATION_MS = 250;
const DIGIT_TRAVEL = 10; // px que recorre el dígito nuevo antes de asentarse

type StreakBadgeProps = {
  days: number;
};

export function StreakBadge({ days }: StreakBadgeProps) {
  if (days <= 0) return null;

  return (
    <View className="flex-row items-center px-2.5 py-1 rounded-pill border border-accent">
      <Text className="text-accent font-sans-semibold text-xs">🔥 </Text>
      <OdometerNumber value={days} />
    </View>
  );
}

function OdometerNumber({ value }: { value: number }) {
  const digits = String(value).split("");
  return (
    <View className="flex-row">
      {digits.map((digit, i) => (
        // Key por posición desde la derecha: si se agrega un dígito
        // (9→10), el nuevo entra por la izquierda sin reiniciar la
        // animación de los dígitos que ya estaban ahí.
        <DigitReel key={digits.length - i} digit={digit} />
      ))}
    </View>
  );
}

function DigitReel({ digit }: { digit: string }) {
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(1);
  const prevDigitRef = useRef(digit);

  useEffect(() => {
    if (prevDigitRef.current !== digit) {
      const easing = Easing.out(Easing.ease);
      translateY.value = DIGIT_TRAVEL;
      opacity.value = 0;
      translateY.value = withTiming(0, {
        duration: DIGIT_DURATION_MS,
        easing,
      });
      opacity.value = withTiming(1, { duration: DIGIT_DURATION_MS, easing });
      prevDigitRef.current = digit;
    }
  }, [digit, translateY, opacity]);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.Text
      style={style}
      className="text-accent font-sans-semibold text-xs"
    >
      {digit}
    </Animated.Text>
  );
}
