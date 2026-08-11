import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { useCallback, useEffect, useRef, useState } from "react";
import type { LayoutChangeEvent } from "react-native";
import { Pressable, Text, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

// Ver docs/animaciones-ui-app-entrenamiento.md §2.6
// "Liquid tab": pill de fondo que se desliza hacia el tab activo (física
// de resorte, withSpring — estado activo del sistema de acentos, ver
// diseño §2 y animaciones §1).
//
// El tab activo muestra solo el ícono (sin label), igual que los
// inactivos — así el pill es un círculo de tamaño constante.
//
// La posición del pill se MIDE, no se calcula: como todos los slots son
// flex:1 (ancho fijo, nunca cambia con el foco), cada uno reporta su
// x/width real por onLayout una sola vez al montar. Usar ese valor medido
// en vez de derivarlo matemáticamente de rowWidth/padding evita cualquier
// desfase por asunciones incorrectas sobre cómo RN posiciona los
// elementos absolutos respecto al padding del contenedor.

const PILL_SIZE = 52;

type SlotLayout = { x: number; width: number };

export function AttachedBottomNav({
  state,
  descriptors,
  navigation,
  insets,
}: BottomTabBarProps) {
  const [pillReady, setPillReady] = useState(false);
  const slotLayouts = useRef<Record<number, SlotLayout>>({});

  const pillX = useSharedValue(0);
  const pillOpacity = useSharedValue(0);

  const movePill = useCallback(
    (index: number, animate: boolean) => {
      const layout = slotLayouts.current[index];
      if (!layout) return;
      const targetX = layout.x + (layout.width - PILL_SIZE) / 2;

      if (animate) {
        pillX.value = withSpring(targetX, {
          duration: 350,
          dampingRatio: 0.8,
        });
      } else {
        pillX.value = targetX;
        pillOpacity.value = withSpring(1, { duration: 200, dampingRatio: 1 });
        setPillReady(true);
      }
    },
    [pillX, pillOpacity],
  );

  function handleSlotLayout(index: number, event: LayoutChangeEvent) {
    const { x, width } = event.nativeEvent.layout;
    slotLayouts.current[index] = { x, width };
    if (index === state.index && !pillReady) {
      movePill(index, false);
    }
  }

  // Todos los slots ya se miden al montar (todos tienen la misma
  // estructura fija), así que al cambiar de tab alcanza con reusar el
  // layout ya cacheado — no hace falta esperar un onLayout nuevo.
  useEffect(() => {
    if (pillReady) {
      movePill(state.index, true);
    }
  }, [state.index, pillReady, movePill]);

  const pillStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: pillX.value }],
    opacity: pillOpacity.value,
  }));

  return (
    <View className="bg-bg-base">
      <View
        className="bg-bg-base border-t border-border-subtle rounded-t-[24px] pt-2"
        style={{ paddingBottom: Math.max(insets.bottom, 8) }}
      >
        <View className="flex-row items-center px-2">
          <Animated.View
            pointerEvents="none"
            style={[
              {
                position: "absolute",
                left: 0,
                width: PILL_SIZE,
                height: PILL_SIZE,
                borderRadius: PILL_SIZE / 2,
                backgroundColor: "#F5C518",
              },
              pillStyle,
            ]}
          />
          {state.routes.map((route, index) => {
            const { options } = descriptors[route.key];
            const label =
              typeof options.title === "string" ? options.title : route.name;
            const isFocused = state.index === index;

            function onPress() {
              const event = navigation.emit({
                type: "tabPress",
                target: route.key,
                canPreventDefault: true,
              });
              if (!isFocused && !event.defaultPrevented) {
                navigation.navigate(route.name);
              }
            }

            const icon = options.tabBarIcon?.({
              focused: isFocused,
              color: isFocused ? "#0E0E12" : "#FFFFFF",
              size: 20,
            });

            return (
              <View
                key={route.key}
                style={{ flex: 1, alignItems: "center" }}
                onLayout={(e) => handleSlotLayout(index, e)}
              >
                <Pressable
                  onPress={onPress}
                  className="items-center justify-center"
                  style={{ height: PILL_SIZE }}
                >
                  {icon}
                  {!isFocused && (
                    <Text
                      numberOfLines={1}
                      className="text-text-secondary text-[10px] font-sans mt-1"
                    >
                      {label}
                    </Text>
                  )}
                </Pressable>
              </View>
            );
          })}
        </View>
        <View className="items-center mt-2">
          <View
            style={{
              width: 110,
              height: 4,
              borderRadius: 2,
              backgroundColor: "#FFFFFF",
            }}
          />
        </View>
      </View>
    </View>
  );
}
