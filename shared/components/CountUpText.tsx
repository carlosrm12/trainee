import { useEffect, useState } from "react";
import type { TextStyle } from "react-native";
import { Text } from "react-native";
import {
  Easing,
  runOnJS,
  useAnimatedReaction,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

// Ver docs/animaciones-ui-app-entrenamiento.md §2.8
// Count-up animado desde 0 hasta el valor final (ej. "3,240 kg totales" en
// el resumen de sesión).
//
// IMPORTANTE: `formatter` es una función JS común (ej. formatKg), no un
// worklet — no se puede invocar directamente dentro de un callback de
// Reanimated que corre en el hilo de UI (useAnimatedProps/useAnimatedStyle),
// tira "formatter is not a function" en runtime. Por eso acá NO se usa
// useAnimatedProps: se observa el valor animado con useAnimatedReaction
// (que sí corre en UI) y se manda el NÚMERO —no la función— de vuelta al
// hilo de JS con runOnJS, donde recién ahí se formatea y se actualiza el
// texto con setState normal.
type CountUpTextProps = {
  value: number;
  duration?: number;
  formatter?: (n: number) => string;
  className?: string;
  style?: TextStyle;
};

export function CountUpText({
  value,
  duration = 900,
  formatter = (n) => String(Math.round(n)),
  className,
  style,
}: CountUpTextProps) {
  const animated = useSharedValue(0);
  const [display, setDisplay] = useState(() => formatter(0));

  useEffect(() => {
    animated.value = 0;
    animated.value = withTiming(value, {
      duration,
      easing: Easing.out(Easing.cubic),
    });
  }, [value, duration, animated]);

  function updateDisplay(current: number) {
    setDisplay(formatter(current));
  }

  useAnimatedReaction(
    () => animated.value,
    (current) => {
      runOnJS(updateDisplay)(current);
    },
  );

  return (
    <Text className={className} style={style}>
      {display}
    </Text>
  );
}
