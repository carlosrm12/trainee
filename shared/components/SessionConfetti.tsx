import { useEffect, useState } from "react";
import { Dimensions, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from "react-native-reanimated";

// Ver docs/animaciones-ui-app-entrenamiento.md §2.8
// Único momento del flujo donde se permite celebración (evento de cierre
// único por sesión). Partículas ligeras en accent cayendo 1-2s.
//
// El doc sugiere lottie-react-native con un asset .json minimal. Se
// implementa en su lugar directo con Reanimated: mismo resultado visual
// (unas pocas piezas cayendo, sin gradientes/blur), pero sin sumar una
// dependencia nueva ni un asset de Lottie escrito a mano que no se puede
// previsualizar antes de shipearlo — consistente con que el resto del
// sistema de animación de la app ya está construido sobre Reanimated.

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const PARTICLE_COUNT = 14;
const FALL_DISTANCE = 420;
// accent / accent-pressed — ver diseño §3, nada de colores nuevos.
const COLORS = ["#F5C518", "#D9AE0E"];

type Particle = {
  id: number;
  left: number;
  width: number;
  height: number;
  color: string;
  delay: number;
  duration: number;
  rotationDeg: number;
};

function makeParticles(): Particle[] {
  return Array.from({ length: PARTICLE_COUNT }, (_, i) => {
    const size = 5 + Math.random() * 5;
    return {
      id: i,
      left: Math.random() * SCREEN_WIDTH,
      width: size,
      height: size * 1.6,
      color: COLORS[i % COLORS.length],
      delay: Math.random() * 300,
      duration: 1100 + Math.random() * 700, // 1.1s - 1.8s, dentro del rango 1-2s del doc
      rotationDeg: Math.random() > 0.5 ? 180 : -180,
    };
  });
}

function ConfettiPiece({ particle }: { particle: Particle }) {
  const translateY = useSharedValue(-20);
  const rotate = useSharedValue(0);
  const opacity = useSharedValue(1);

  useEffect(() => {
    translateY.value = withDelay(
      particle.delay,
      withTiming(FALL_DISTANCE, {
        duration: particle.duration,
        easing: Easing.in(Easing.quad),
      }),
    );
    rotate.value = withDelay(
      particle.delay,
      withTiming(particle.rotationDeg, {
        duration: particle.duration,
        easing: Easing.linear,
      }),
    );
    // Se desvanece en el último 40% de la caída, no de golpe al final.
    opacity.value = withDelay(
      particle.delay + particle.duration * 0.6,
      withTiming(0, { duration: particle.duration * 0.4 }),
    );
    // Corre una sola vez, al montar — no reacciona a cambios de `particle`.
  }, [particle, translateY, rotate, opacity]);

  const style = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { rotate: `${rotate.value}deg` },
    ],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        {
          position: "absolute",
          left: particle.left,
          top: 0,
          width: particle.width,
          height: particle.height,
          borderRadius: 2,
          backgroundColor: particle.color,
        },
        style,
      ]}
    />
  );
}

export function SessionConfetti() {
  // Lazy init: se calcula una sola vez por montaje, no en cada render.
  const [particles] = useState(() => makeParticles());

  return (
    <View
      pointerEvents="none"
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        height: FALL_DISTANCE,
      }}
    >
      {particles.map((p) => (
        <ConfettiPiece key={p.id} particle={p} />
      ))}
    </View>
  );
}
