import { Trash2 } from "lucide-react-native";
import { Pressable } from "react-native";
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
// Durante el arrastre, la card sigue el dedo 1:1 (gesto, no timing). Al
// soltar, snap-back/snap-open con withTiming (ease-out) — elemento
// "base/silencioso" del sistema (§1), mismo criterio que FilterChipOutline.
//
// Al confirmar el borrado: NO se anima un colapso de altura del
// contenedor. Un colapso animado necesita conocer la altura del contenido
// de antemano (via onLayout, asíncrono) y combinarla con overflow:hidden
// — esa combinación (altura potencialmente indefinida + overflow:hidden)
// era justo lo que hacía que el panel rojo se filtrara fuera de los
// bordes redondeados de las cards, sobre todo antes de que onLayout
// terminara de medir. Acá en cambio: fade + slide-out de la fila
// completa, y al terminar recién se avisa al padre para sacar el item de
// la lista — se reacomoda al instante, sin animación de colapso, pero sin
// depender de una medición async.

const ACTION_WIDTH = 76;
const DELETE_THRESHOLD = ACTION_WIDTH / 2;
const EXIT_DURATION = 200;

type SwipeableRowProps = {
  children: React.ReactNode;
  onDelete: () => void;
  // Para envolver cards con esquinas redondeadas (RoutineCard, la card de
  // "sesión más reciente"): recorta el fondo danger al mismo radio. Las
  // filas planas de listas (historial "anteriores") usan 0 (default).
  borderRadius?: number;
  // Algunos children (ej. SessionListItem) no pintan su propio fondo —
  // confían en que el contenedor padre compartido ya lo hace. Wrapeados
  // individualmente acá, eso deja pasar el panel danger de atrás incluso
  // en reposo. bg-surface (#1A1A20) es el fondo correcto en casi todos
  // los casos de esta app; pasar "transparent" si el child ya pinta su
  // propio fondo opaco de borde a borde (ej. RoutineCard).
  backgroundColor?: string;
};

export function SwipeableRow({
  children,
  onDelete,
  borderRadius = 0,
  backgroundColor = "#1A1A20",
}: SwipeableRowProps) {
  const translateX = useSharedValue(0);
  const startX = useSharedValue(0);
  const opacity = useSharedValue(1);

  function triggerDelete() {
    translateX.value = withTiming(-500, { duration: EXIT_DURATION });
    opacity.value = withTiming(0, { duration: EXIT_DURATION }, (finished) => {
      if (finished) {
        runOnJS(onDelete)();
      }
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
    backgroundColor,
  }));

  const actionStyle = useAnimatedStyle(() => {
    const progress = interpolate(translateX.value, [-ACTION_WIDTH, 0], [1, 0]);
    return {
      opacity: progress,
      transform: [{ scale: interpolate(progress, [0, 1], [0.6, 1]) }],
    };
  });

  return (
    // overflow/borderRadius son estilos estáticos ahora — el contenedor
    // ya no depende de ninguna altura medida/animada, así que el recorte
    // es confiable desde el primer frame.
    <Animated.View style={{ overflow: "hidden", borderRadius }}>
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
