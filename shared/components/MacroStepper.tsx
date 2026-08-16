import { Pressable, Text, View } from "react-native";

type MacroStepperProps = {
  label: string;
  value: number;
  unit: string;
  step: number;
  min?: number;
  onChange: (value: number) => void;
};

// Mismo patrón de interacción que SetStepper (±, valor grande, sin texto
// libre) pero en formato compacto para encajar 2 por fila en una pantalla
// de ajustes — ver doc de Fase 2 §13: "MacroStepper: igual a SetStepper,
// reetiquetado".
export function MacroStepper({
  label,
  value,
  unit,
  step,
  min = 0,
  onChange,
}: MacroStepperProps) {
  return (
    <View
      className="items-center bg-bg-surface rounded-card border border-border-subtle py-4"
      style={{ minWidth: "47%", flexGrow: 1 }}
    >
      <Text className="text-text-secondary text-xs font-sans mb-1">
        {label}
      </Text>
      <Text className="text-text-primary text-2xl font-sans-bold">
        {value}
        <Text className="text-sm font-sans text-text-secondary"> {unit}</Text>
      </Text>
      <View className="flex-row gap-2 mt-2">
        <Pressable
          onPress={() => onChange(Math.max(min, value - step))}
          className="w-8 h-8 rounded-full bg-bg-surface-alt items-center justify-center"
        >
          <Text className="text-text-primary font-sans-bold">−</Text>
        </Pressable>
        <Pressable
          onPress={() => onChange(value + step)}
          className="w-8 h-8 rounded-full bg-bg-surface-alt items-center justify-center"
        >
          <Text className="text-text-primary font-sans-bold">+</Text>
        </Pressable>
      </View>
    </View>
  );
}
