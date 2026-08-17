import type { NutritionGoal } from "@/domain/entities";
import {
  analyzeMealPhoto,
  GeminiAnalysisError,
} from "@/features/nutrition/analyzeMealPhoto";
import { resolveWeightUnit } from "@/features/nutrition/resolveWeightUnit";
import { useGeminiApiKey } from "@/features/nutrition/useGeminiApiKey";
import { useNutritionProfile } from "@/features/nutrition/useNutritionProfile";
import { useSettings } from "@/features/profile/useSettings";
import { MacroStepper } from "@/shared/components/MacroStepper";
import { SettingsRow } from "@/shared/components/SettingsRow";
import { formatCurrency } from "@/shared/utils/formatCurrency";
import { segmentedToggleStyle } from "@/shared/utils/segmentedToggleStyle";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";

const GOAL_LABEL: Record<NutritionGoal, string> = {
  deficit: "Déficit",
  bulk: "Volumen",
  maintenance: "Mantener",
};

const GOAL_OPTIONS: NutritionGoal[] = ["deficit", "bulk", "maintenance"];

// Input numérico controlado que solo persiste al perder foco — evita
// escribir a SQLite en cada tecla y evita guardar números a medio escribir
// (ej. "1." mientras se tipea "1.5").
function NumberField({
  label,
  value,
  suffix,
  onCommit,
}: {
  label: string;
  value: number | null;
  suffix?: string;
  onCommit: (value: number | null) => void;
}) {
  const [text, setText] = useState(value !== null ? String(value) : "");

  useEffect(() => {
    setText(value !== null ? String(value) : "");
  }, [value]);

  function handleBlur() {
    const trimmed = text.trim();
    if (trimmed === "") {
      onCommit(null);
      return;
    }
    const parsed = Number(trimmed.replace(",", "."));
    if (Number.isNaN(parsed)) {
      setText(value !== null ? String(value) : "");
      return;
    }
    onCommit(parsed);
  }

  return (
    <View className="flex-1">
      <Text className="text-text-secondary text-xs font-sans mb-1">
        {label}
      </Text>
      <View className="flex-row items-center bg-bg-surface border border-border-subtle rounded-chip px-3 py-2">
        <TextInput
          value={text}
          onChangeText={setText}
          onBlur={handleBlur}
          keyboardType="decimal-pad"
          placeholder="—"
          placeholderTextColor="#9B9BA5"
          className="flex-1 text-text-primary font-sans"
        />
        {suffix ? (
          <Text className="text-text-secondary text-xs font-sans ml-1">
            {suffix}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

function TagListEditor({
  label,
  tags,
  onChange,
}: {
  label: string;
  tags: string[];
  onChange: (tags: string[]) => void;
}) {
  const [draft, setDraft] = useState("");

  function handleAdd() {
    const value = draft.trim();
    if (!value) return;
    if (tags.some((t) => t.toLowerCase() === value.toLowerCase())) {
      setDraft("");
      return;
    }
    onChange([...tags, value]);
    setDraft("");
  }

  return (
    <View className="mb-6">
      <Text className="text-text-secondary text-xs font-sans mb-2">
        {label}
      </Text>
      <View className="flex-row flex-wrap gap-2 mb-2">
        {tags.length === 0 && (
          <Text className="text-text-secondary text-xs font-sans">
            Ninguna todavía
          </Text>
        )}
        {tags.map((tag) => (
          <Pressable
            key={tag}
            onPress={() => onChange(tags.filter((t) => t !== tag))}
            className="flex-row items-center rounded-pill border border-accent px-3 py-1.5"
          >
            <Text className="text-accent text-xs font-sans-medium mr-1">
              {tag}
            </Text>
            <Text className="text-accent text-xs font-sans-bold">×</Text>
          </Pressable>
        ))}
      </View>
      <View className="flex-row items-center gap-2">
        <TextInput
          value={draft}
          onChangeText={setDraft}
          onSubmitEditing={handleAdd}
          placeholder="Agregar..."
          placeholderTextColor="#9B9BA5"
          className="flex-1 bg-bg-surface border border-border-subtle rounded-chip px-3 py-2 text-text-primary font-sans"
        />
        <Pressable
          onPress={handleAdd}
          className="rounded-chip bg-bg-surface-alt border border-border-subtle px-3 py-2"
        >
          <Text className="text-text-primary font-sans-semibold">+</Text>
        </Pressable>
      </View>
    </View>
  );
}

// Sección propia de este tab (§2, "principio de propiedad de ajustes"): la
// API key de Gemini es exclusiva del módulo de nutrición, no tiene lugar en
// Perfil. No se precarga el valor real en el input al editar — solo se
// muestra si está configurada o no, para no tener el secreto en texto plano
// en memoria/pantalla más tiempo del necesario.
function GeminiApiKeySection() {
  const { apiKey, loading, save, clear } = useGeminiApiKey();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [visible, setVisible] = useState(false);
  const [testing, setTesting] = useState(false);

  if (loading) return null;

  const isConfigured = apiKey !== null;

  async function handleTestConnection() {
    if (!apiKey) return;

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(
        "Permiso necesario",
        "Necesitamos acceso a tus fotos para la prueba.",
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.5,
      base64: true,
    });
    if (result.canceled || !result.assets[0].base64) return;

    setTesting(true);
    try {
      const analysis = await analyzeMealPhoto(result.assets[0].base64, apiKey);
      Alert.alert(
        "Conexión OK",
        `${analysis.name}\n${analysis.calories} kcal · ${analysis.proteinG}g prot · ${analysis.carbsG}g carb · ${analysis.fatG}g grasa\nConfianza: ${Math.round(analysis.confidence * 100)}%`,
      );
    } catch (err) {
      const message =
        err instanceof GeminiAnalysisError ? err.message : "Error desconocido.";
      Alert.alert("Error de conexión", message);
    } finally {
      setTesting(false);
    }
  }

  async function handleSave() {
    const trimmed = draft.trim();
    if (!trimmed) return;
    await save(trimmed);
    setDraft("");
    setVisible(false);
    setEditing(false);
  }

  function handleCancel() {
    setDraft("");
    setVisible(false);
    setEditing(false);
  }

  async function handleClear() {
    await clear();
    handleCancel();
  }

  return (
    <View className="mb-8">
      <Text className="text-text-primary font-sans-semibold mb-1">
        Configuración de IA
      </Text>
      <Text className="text-text-secondary text-xs font-sans mb-3">
        API key de Gemini (tier gratuito) para analizar fotos de comida. Se
        guarda cifrada en el dispositivo — nunca se sube a ningún lado salvo en
        la llamada puntual a Gemini.
      </Text>

      {!editing && (
        <View className="rounded-card border border-border-subtle bg-bg-surface px-4 py-3">
          <View className="flex-row items-center justify-between">
            <Text
              className={
                isConfigured
                  ? "text-success font-sans-medium"
                  : "text-text-secondary font-sans"
              }
            >
              {isConfigured ? "Configurada ✓" : "Sin configurar"}
            </Text>
            <View className="flex-row gap-4">
              <Pressable onPress={() => setEditing(true)}>
                <Text className="text-accent font-sans-semibold text-sm">
                  {isConfigured ? "Cambiar" : "Agregar"}
                </Text>
              </Pressable>
              {isConfigured && (
                <Pressable onPress={handleClear}>
                  <Text className="text-danger font-sans-semibold text-sm">
                    Quitar
                  </Text>
                </Pressable>
              )}
            </View>
          </View>
          {isConfigured && (
            <Pressable
              onPress={handleTestConnection}
              disabled={testing}
              style={{ opacity: testing ? 0.6 : 1 }}
              className="mt-3 items-center justify-center rounded-chip border border-border-subtle py-2"
            >
              {testing ? (
                <ActivityIndicator color="#9B9BA5" size="small" />
              ) : (
                <Text className="text-text-secondary font-sans-semibold text-sm">
                  Probar conexión
                </Text>
              )}
            </Pressable>
          )}
        </View>
      )}

      {editing && (
        <View className="rounded-card border border-border-subtle bg-bg-surface p-4">
          <View className="flex-row items-center bg-bg-surface-alt border border-border-subtle rounded-chip px-3 py-2 mb-3">
            <TextInput
              value={draft}
              onChangeText={setDraft}
              secureTextEntry={!visible}
              autoCapitalize="none"
              autoCorrect={false}
              placeholder="AIza..."
              placeholderTextColor="#9B9BA5"
              className="flex-1 text-text-primary font-sans"
            />
            <Pressable onPress={() => setVisible((v) => !v)}>
              <Text className="text-text-secondary text-xs font-sans ml-2">
                {visible ? "Ocultar" : "Mostrar"}
              </Text>
            </Pressable>
          </View>
          <View className="flex-row gap-2">
            <Pressable
              onPress={handleCancel}
              className="flex-1 items-center justify-center rounded-chip border border-border-subtle py-2"
            >
              <Text className="text-text-secondary font-sans-semibold">
                Cancelar
              </Text>
            </Pressable>
            <Pressable
              onPress={handleSave}
              disabled={!draft.trim()}
              style={{ opacity: draft.trim() ? 1 : 0.5 }}
              className="flex-1 items-center justify-center rounded-chip bg-accent py-2"
            >
              <Text className="text-text-on-accent font-sans-semibold">
                Guardar
              </Text>
            </Pressable>
          </View>
        </View>
      )}
    </View>
  );
}
// Se monta/desmonta condicionalmente (nada de medición manual de altura,
// que peleaba con Reanimated y causaba el parpadeo) — FadeIn/FadeOut se
// encargan de la transición suave, es el mecanismo nativo de Reanimated
// para esto, no algo armado a mano.
function WeightUnitPicker({
  expanded,
  value,
  onChange,
}: {
  expanded: boolean;
  value: "kg" | "lb";
  onChange: (unit: "kg" | "lb") => void;
}) {
  if (!expanded) return null;

  return (
    <Animated.View
      entering={FadeIn.duration(150)}
      exiting={FadeOut.duration(120)}
      className="flex-row gap-2 px-4 pt-4 pb-4"
    >
      <Pressable
        onPress={() => onChange("kg")}
        style={[segmentedToggleStyle(value === "kg"), { alignSelf: "stretch" }]}
        className="flex-1 items-center justify-center"
      >
        <Text
          className={
            value === "kg"
              ? "text-text-on-accent font-sans-semibold"
              : "text-text-secondary font-sans"
          }
        >
          Kilogramos (kg)
        </Text>
      </Pressable>
      <Pressable
        onPress={() => onChange("lb")}
        style={[segmentedToggleStyle(value === "lb"), { alignSelf: "stretch" }]}
        className="flex-1 items-center justify-center"
      >
        <Text
          className={
            value === "lb"
              ? "text-text-on-accent font-sans-semibold"
              : "text-text-secondary font-sans"
          }
        >
          Libras (lb)
        </Text>
      </Pressable>
    </Animated.View>
  );
}
export default function NutritionSettingsScreen() {
  const router = useRouter();
  const { profile, loading, update } = useNutritionProfile();
  const { weightUnit: globalWeightUnit } = useSettings();
  const scrollRef = useRef<ScrollView>(null);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  // Solución 100% JS (Keyboard + ScrollView.scrollToEnd, ambas APIs core de
  // RN) — compatible con Expo Go, a diferencia de KeyboardAvoidingView (roto
  // con edgeToEdgeEnabled en Android) o de librerías con módulos nativos.
  // Como "Configuración de IA" es siempre lo último de la pantalla, hacer
  // scroll al final alcanza para dejarlo visible arriba del teclado.
  useEffect(() => {
    const showSub = Keyboard.addListener("keyboardDidShow", (e) => {
      setKeyboardHeight(e.endCoordinates.height);
      requestAnimationFrame(() => {
        scrollRef.current?.scrollToEnd({ animated: true });
      });
    });
    const hideSub = Keyboard.addListener("keyboardDidHide", () => {
      setKeyboardHeight(0);
    });
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-bg-base">
        <ActivityIndicator color="#F5C518" />
      </View>
    );
  }

  const current = profile ?? {
    heightCm: null,
    currentWeightKg: null,
    targetWeightKg: null,
    goal: null,
    weightUnitOverride: null,
    dailyCalorieTarget: null,
    dailyProteinG: null,
    dailyCarbsG: null,
    dailyFatG: null,
    weeklyBudget: null,
    currency: "USD",
    dietaryPreferences: [] as string[],
    dietaryRestrictions: [] as string[],
  };

  const displayUnit = resolveWeightUnit(
    globalWeightUnit,
    current.weightUnitOverride,
  );
  const usesOwnUnit = current.weightUnitOverride !== null;

  return (
    <ScrollView
      ref={scrollRef}
      className="flex-1 bg-bg-base px-4 pt-16"
      contentContainerStyle={{ paddingBottom: 100 + keyboardHeight }}
      keyboardShouldPersistTaps="handled"
    >
      <View className="flex-row items-center justify-between mb-6">
        <Text className="text-text-primary text-2xl font-sans-bold">
          Ajustes de Nutrición
        </Text>
        <Pressable onPress={() => router.back()}>
          <Text className="text-accent font-sans-semibold">Cerrar</Text>
        </Pressable>
      </View>

      <Text className="text-text-primary font-sans-semibold mb-3">
        Perfil físico
      </Text>
      <View className="flex-row gap-3 mb-3">
        <NumberField
          label="Altura"
          value={current.heightCm}
          suffix="cm"
          onCommit={(v) => update({ heightCm: v })}
        />
        <NumberField
          label="Peso actual"
          value={current.currentWeightKg}
          suffix={displayUnit}
          onCommit={(v) => update({ currentWeightKg: v })}
        />
      </View>
      <View className="flex-row mb-4">
        <NumberField
          label="Peso objetivo"
          value={current.targetWeightKg}
          suffix={displayUnit}
          onCommit={(v) => update({ targetWeightKg: v })}
        />
      </View>

      <Text className="text-text-secondary text-xs font-sans mb-2">Meta</Text>
      <View className="flex-row gap-2 mb-8">
        {GOAL_OPTIONS.map((g) => (
          <Pressable
            key={g}
            onPress={() => update({ goal: g })}
            style={[
              segmentedToggleStyle(current.goal === g),
              { flex: 1, alignSelf: "stretch" },
            ]}
            className="items-center justify-center"
          >
            <Text
              className={
                current.goal === g
                  ? "text-text-on-accent font-sans-semibold text-xs"
                  : "text-text-secondary font-sans text-xs"
              }
            >
              {GOAL_LABEL[g]}
            </Text>
          </Pressable>
        ))}
      </View>

      <Text className="text-text-primary font-sans-semibold mb-3">
        Unidad de peso
      </Text>
      <View className="rounded-card border border-border-subtle bg-bg-surface mb-8">
        <SettingsRow
          label="Usar unidad global"
          description={`Actualmente: ${globalWeightUnit === "kg" ? "Kilogramos (kg)" : "Libras (lb)"}`}
          control={
            <Pressable
              onPress={() => {
                Keyboard.dismiss();
                update({ weightUnitOverride: null });
              }}
              className="w-6 h-6 rounded-full border-2 border-accent items-center justify-center"
            >
              {!usesOwnUnit && (
                <View className="w-3 h-3 rounded-full bg-accent" />
              )}
            </Pressable>
          }
        />
        <SettingsRow
          label="Elegir para Nutrición"
          isLast={!usesOwnUnit}
          control={
            <Pressable
              onPress={() => {
                Keyboard.dismiss();
                update({
                  weightUnitOverride:
                    current.weightUnitOverride ?? globalWeightUnit,
                });
              }}
              className="w-6 h-6 rounded-full border-2 border-accent items-center justify-center"
            >
              {usesOwnUnit && (
                <View className="w-3 h-3 rounded-full bg-accent" />
              )}
            </Pressable>
          }
        />
        <WeightUnitPicker
          expanded={usesOwnUnit}
          value={displayUnit}
          onChange={(unit) => update({ weightUnitOverride: unit })}
        />
      </View>

      <Text className="text-text-primary font-sans-semibold mb-3">
        Metas diarias de macros
      </Text>
      <View className="flex-row flex-wrap gap-3 mb-8">
        <MacroStepper
          label="Calorías"
          value={current.dailyCalorieTarget ?? 2000}
          unit="kcal"
          step={50}
          onChange={(v) => update({ dailyCalorieTarget: v })}
        />
        <MacroStepper
          label="Proteína"
          value={current.dailyProteinG ?? 150}
          unit="g"
          step={5}
          onChange={(v) => update({ dailyProteinG: v })}
        />
        <MacroStepper
          label="Carbohidratos"
          value={current.dailyCarbsG ?? 200}
          unit="g"
          step={5}
          onChange={(v) => update({ dailyCarbsG: v })}
        />
        <MacroStepper
          label="Grasas"
          value={current.dailyFatG ?? 60}
          unit="g"
          step={5}
          onChange={(v) => update({ dailyFatG: v })}
        />
      </View>

      <Text className="text-text-primary font-sans-semibold mb-3">
        Presupuesto semanal
      </Text>
      <View className="flex-row items-end gap-3 mb-8">
        <NumberField
          label="Monto"
          value={current.weeklyBudget}
          suffix={current.currency}
          onCommit={(v) => update({ weeklyBudget: v })}
        />
        <Text className="text-text-secondary text-xs font-sans pb-2 flex-1">
          {current.weeklyBudget !== null
            ? formatCurrency(current.weeklyBudget, current.currency)
            : "Moneda fija por ahora (selector futuro)"}
        </Text>
      </View>

      <TagListEditor
        label="Preferencias"
        tags={current.dietaryPreferences}
        onChange={(tags) => update({ dietaryPreferences: tags })}
      />
      <TagListEditor
        label="Restricciones"
        tags={current.dietaryRestrictions}
        onChange={(tags) => update({ dietaryRestrictions: tags })}
      />
      <GeminiApiKeySection />
    </ScrollView>
  );
}
