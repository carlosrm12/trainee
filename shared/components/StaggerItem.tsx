import type { ReactNode } from "react";
import { useEffect } from "react";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from "react-native-reanimated";

// Ver docs/animaciones-ui-app-entrenamiento.md §2.4
// Entrada de listas (RoutineCard, SessionListItem): fade + translateY(8px),
// escalonado ~40-60ms entre cards consecutivas. Es un elemento "base/flat"
// del sistema de movimiento (§1) → timing suave (withTiming, ease-out), no
// spring — el rebote se reserva para los acentos brutalistas.

const STAGGER_MS = 50;
const DURATION_MS = 250;
const OFFSET_Y = 8;

type StaggerItemProps = {
  // Posición del item dentro de la lista, para calcular el delay escalonado.
  index: number;
  children: ReactNode;
};

export function StaggerItem({ index, children }: StaggerItemProps) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(OFFSET_Y);

  useEffect(() => {
    const delay = index * STAGGER_MS;
    const easing = Easing.out(Easing.ease);
    opacity.value = withDelay(
      delay,
      withTiming(1, { duration: DURATION_MS, easing }),
    );
    translateY.value = withDelay(
      delay,
      withTiming(0, { duration: DURATION_MS, easing }),
    );
    // Solo se anima una vez, al montar el item.
  }, [index, opacity, translateY]);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return <Animated.View style={style}>{children}</Animated.View>;
}
