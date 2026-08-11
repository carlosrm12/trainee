import * as Haptics from "expo-haptics";
import { useEffect, useRef } from "react";
import { Pressable, Text, View } from "react-native";
import Animated, {
  interpolateColor,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";

// Ver docs/animaciones-ui-app-entrenamiento.md §2.1
// - Press: withTiming (~80ms, sin bounce) — "se hunde" hacia su sombra
// - Release: withSpring (damping bajo) — rebote al soltar
// - success: scale 1→1.15→1 con withSpring + color accent→success + haptic
//
// IMPORTANTE: quien use state="success" para avanzar a otra pantalla (ej.
// Ejecución → timer de descanso) debe hacerlo desde onSuccessAnimationEnd,
// nunca con un setTimeout a ciegas — un damping bajo puede hacer que el
// spring tarde más de lo esperado en asentarse, y un setTimeout fijo corta
// la animación a mitad de camino.

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const PRESS_OFFSET = 3; // mismo valor que el offset de la sombra (3px, ver diseño §5)
const COLOR_ACCENT = "#F5C518";
const COLOR_ACCENT_PRESSED = "#D9AE0E";
const COLOR_SUCCESS = "#4ADE80";

type BrutalistButtonProps = {
  label: string;
  onPress: () => void;
  variant?: "primary" | "fab";
  state?: "default" | "success";
  disabled?: boolean;
  // Se dispara cuando el pop de éxito (scale 1→1.15→1) termina de asentarse
  // de verdad. Úsalo para encadenar navegación/lógica en vez de un timer fijo.
  onSuccessAnimationEnd?: () => void;
};

export function BrutalistButton({
  label,
  onPress,
  variant = "primary",
  state = "default",
  disabled = false,
  onSuccessAnimationEnd,
}: BrutalistButtonProps) {
  const pressed = useSharedValue(0); // 0 = reposo, 1 = hundido contra la sombra
  const successProgress = useSharedValue(state === "success" ? 1 : 0);
  const scale = useSharedValue(1);

  // Ref para que el worklet siempre llame a la versión más reciente del
  // callback sin tener que reiniciar la animación si el padre re-renderiza.
  const onSuccessAnimationEndRef = useRef(onSuccessAnimationEnd);
  useEffect(() => {
    onSuccessAnimationEndRef.current = onSuccessAnimationEnd;
  }, [onSuccessAnimationEnd]);

  function notifySuccessAnimationEnd() {
    onSuccessAnimationEndRef.current?.();
  }

  useEffect(() => {
    if (state === "success") {
      successProgress.value = withTiming(1, { duration: 120 });
      // Config por duración (no física mass/damping/stiffness): con esa
      // versión el spring podía tardar 500-800ms en cruzar el threshold de
      // "asentado" de Reanimated aunque visualmente ya se viera quieto.
      // duration+dampingRatio da un tiempo total acotado y predecible
      // (~230ms) mientras conserva el rebote (dampingRatio < 1).
      scale.value = withSequence(
        withSpring(1.15, { duration: 90, dampingRatio: 0.6 }),
        withSpring(1, { duration: 140, dampingRatio: 0.8 }, (finished) => {
          if (finished) {
            runOnJS(notifySuccessAnimationEnd)();
          }
        }),
      );
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } else {
      successProgress.value = withTiming(0, { duration: 120 });
    }
  }, [state, successProgress, scale]);

  function handlePressIn() {
    if (disabled) return;
    pressed.value = withTiming(1, { duration: 80 });
  }

  function handlePressOut() {
    if (disabled) return;
    pressed.value = withSpring(0, { damping: 12 });
  }

  const buttonAnimatedStyle = useAnimatedStyle(() => {
    const translate = pressed.value * PRESS_OFFSET;
    return {
      transform: [
        { translateX: translate },
        { translateY: translate },
        { scale: scale.value },
      ],
      backgroundColor: interpolateColor(
        successProgress.value,
        [0, 1],
        [COLOR_ACCENT, COLOR_SUCCESS],
      ),
    };
  });

  const shadowAnimatedStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      successProgress.value,
      [0, 1],
      [COLOR_ACCENT_PRESSED, COLOR_SUCCESS],
    ),
  }));

  if (variant === "fab") {
    return (
      <View className="relative self-start mr-[3px] mb-[3px]">
        <Animated.View
          style={shadowAnimatedStyle}
          className="absolute top-[3px] left-[3px] w-full h-full rounded-full"
        />
        <AnimatedPressable
          onPress={onPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          disabled={disabled}
          style={buttonAnimatedStyle}
          className="relative w-14 h-14 items-center justify-center rounded-full border-2 border-bg-base"
        >
          <Text className="text-text-on-accent text-2xl font-sans-bold">+</Text>
        </AnimatedPressable>
      </View>
    );
  }

  return (
    <View className="relative self-stretch mr-[3px] mb-[3px]">
      <Animated.View
        style={shadowAnimatedStyle}
        className="absolute top-[3px] left-[3px] w-full h-full rounded-chip"
      />
      <AnimatedPressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
        style={buttonAnimatedStyle}
        className="relative items-center justify-center rounded-chip border-2 border-bg-base px-5 py-3"
      >
        <Text className="text-text-on-accent text-center font-sans-semibold uppercase tracking-wide">
          {label}
        </Text>
      </AnimatedPressable>
    </View>
  );
}
