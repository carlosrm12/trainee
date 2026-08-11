import { useEffect } from "react";
import { Pressable, ScrollView, Text } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

// Ver docs/animaciones-ui-app-entrenamiento.md §2.5
// Selección: el fondo se "llena" desde el centro hacia afuera (~150ms) en
// vez de solo cambiar color de borde/texto. Es un elemento "base/flat"
// del sistema de movimiento (§1) → timing suave (withTiming), no spring
// — el rebote se reserva para los acentos brutalistas.

const FILL_DURATION_MS = 150;
// Accent muy tenue: mantiene la identidad "outline" del chip (el amarillo
// relleno sólido queda exclusivo para los CTAs brutalistas, ver diseño §3).
const FILL_COLOR = "rgba(245, 197, 24, 0.16)";

type FilterChipOutlineProps = {
  options: string[];
  selected: string;
  onSelect: (option: string) => void;
};

export function FilterChipOutline({
  options,
  selected,
  onSelect,
}: FilterChipOutlineProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerClassName="gap-2"
    >
      {options.map((option) => (
        <Chip
          key={option}
          label={option}
          isSelected={option === selected}
          onPress={() => onSelect(option)}
        />
      ))}
    </ScrollView>
  );
}

type ChipProps = {
  label: string;
  isSelected: boolean;
  onPress: () => void;
};

function Chip({ label, isSelected, onPress }: ChipProps) {
  const fill = useSharedValue(isSelected ? 1 : 0);

  useEffect(() => {
    fill.value = withTiming(isSelected ? 1 : 0, {
      duration: FILL_DURATION_MS,
      easing: Easing.out(Easing.ease),
    });
  }, [isSelected, fill]);

  // scaleX crece desde 0: como el transform-origin por defecto es el
  // centro del elemento, esto se ve exactamente como "el fondo se llena
  // desde el centro hacia afuera".
  const fillStyle = useAnimatedStyle(() => ({
    transform: [{ scaleX: fill.value }],
  }));

  return (
    <Pressable
      onPress={onPress}
      className={`overflow-hidden rounded-pill border px-4 py-1.5 ${
        isSelected ? "border-accent" : "border-border-subtle"
      }`}
    >
      <Animated.View
        pointerEvents="none"
        style={[
          {
            position: "absolute",
            top: 0,
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor: FILL_COLOR,
          },
          fillStyle,
        ]}
      />
      <Text
        className={`text-xs font-sans-medium ${
          isSelected ? "text-accent" : "text-text-secondary"
        }`}
      >
        {label}
      </Text>
    </Pressable>
  );
}
