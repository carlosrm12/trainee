import { Trash2 } from "lucide-react-native";
import { useState } from "react";
import { Pressable, type LayoutChangeEvent } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

// Ver docs/animaciones-ui-app-entrenamiento.md §2.4
// "Swipe horizontal que revela una acción en danger (#F26D6D)."
//
// Durante el arrastre, la card sigue el dedo 1:1 (sin animación propia —
// es gesto, no timing). El ícono de basurero se revela interpolado del
// propio progreso del swipe, no con una animación disparada aparte. Al
// soltar, el snap-back/snap-open usa withTiming (ease-out) porque, según
// el §1 del doc, las cards de listas son elementos "base/silenciosos"
// (mismo criterio que ya usa FilterChipOutline) — el rebote (withSpring)
// se reserva para los acentos brutalistas.

const ACTION_WIDTH = 76;
const DELETE_THRESHOLD = ACTION_WIDTH / 2;
const COLLAPSE_DURATION = 200;

type SwipeableRowProps = {
  children: React.ReactNode;
  onDelete: () => void;
  // Para envolver cards con esquinas redondeadas (RoutineCard, la card de
  // "sesión más reciente"): recorta el fondo danger al mismo radio, si no
  // el rojo asoma en las esquinas por fuera del borde redondeado de la
  // card. Las filas planas de listas (historial "anteriores") usan 0.
  borderRadius?: number;
};

export function SwipeableRow({
  children,
  onDelete,
  borderRadius = 0,
}: SwipeableRowProps) {
  const translateX = useSharedValue(0);
  const startX = useSharedValue(0);
  const rowHeight = useSharedValue<number | null>(null);
  const opacity = useSharedValue(1);
  const [measured, setMeasured] = useState(false);

  function handleLayout(e: LayoutChangeEvent) {
    if (!measured) {
      rowHeight.value = e.nativeEvent.layout.height;
      setMeasured(true);
    }
  }

  function triggerDelete() {
    // Cierra el swipe y colapsa la fila antes de avisarle al padre que
    // borre — así no desaparece de golpe.
    translateX.value = withTiming(-400, { duration: COLLAPSE_DURATION });
    opacity.value = withTiming(0, { duration: COLLAPSE_DURATION });
    rowHeight.value = withTiming(0, { duration: COLLAPSE_DURATION }, () => {
      runOnJS(onDelete)();
    });
  }

  const pan = Gesture.Pan()
    .activeOffsetX([-10, 10])
    .failOffsetY([-10, 10])
    .onStart(() => {
      startX.value = translateX.value;
    })
    .onUpdate((e) => {
      const next = startX.value + e.translationX;
      translateX.value = Math.min(0, Math.max(next, -ACTION_WIDTH));
    })
    .onEnd(() => {
      const shouldOpen = translateX.value < -DELETE_THRESHOLD;
      translateX.value = withTiming(shouldOpen ? -ACTION_WIDTH : 0, {
        duration: 180,
      });
    });

  const rowStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
    opacity: opacity.value,
  }));

  const containerStyle = useAnimatedStyle(() => ({
    height: rowHeight.value ?? undefined,
  }));

  const actionStyle = useAnimatedStyle(() => {
    const progress = interpolate(translateX.value, [-ACTION_WIDTH, 0], [1, 0]);
    return {
      opacity: progress,
      transform: [{ scale: interpolate(progress, [0, 1], [0.6, 1]) }],
    };
  });

  return (
    <Animated.View
      style={[{ overflow: "hidden", borderRadius }, containerStyle]}
      onLayout={handleLayout}
    >
      <Animated.View
        pointerEvents="box-none"
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          bottom: 0,
          width: ACTION_WIDTH,
          backgroundColor: "#F26D6D",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Animated.View style={actionStyle}>
          <Pressable
            onPress={triggerDelete}
            hitSlop={12}
            accessibilityLabel="Borrar"
            accessibilityRole="button"
          >
            <Trash2 color="#0E0E12" size={22} />
          </Pressable>
        </Animated.View>
      </Animated.View>

      <GestureDetector gesture={pan}>
        <Animated.View style={rowStyle}>{children}</Animated.View>
      </GestureDetector>
    </Animated.View>
  );
}
