import { SQLiteMealLogRepository } from "@/data/repositories/SQLiteMealLogRepository";
import type { MealType } from "@/domain/entities";
import {
  analyzeMealPhoto,
  GeminiAnalysisError,
  type MealAnalysisResult,
} from "@/features/nutrition/analyzeMealPhoto";
import { persistMealPhoto } from "@/features/nutrition/persistMealPhoto";
import { useGeminiApiKey } from "@/features/nutrition/useGeminiApiKey";
import { BrutalistButton } from "@/shared/components/BrutalistButton";
import { ConfidenceBadge } from "@/shared/components/ConfidenceBadge";
import { MacroStepper } from "@/shared/components/MacroStepper";
import { getLocalDateString } from "@/shared/utils/getLocalDateString";
import { File } from "expo-file-system";
import * as ImagePicker from "expo-image-picker";
import { Stack, useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";

const mealLogRepo = new SQLiteMealLogRepository();

type ScreenState = "picker" | "analyzing" | "confirm" | "error";

const MEAL_TYPE_LABEL: Record<MealType, string> = {
  breakfast: "Desayuno",
  lunch: "Almuerzo",
  dinner: "Cena",
  snack: "Snack",
};

// La pantalla no aparece en el ASCII de §5 con selector de tipo de comida,
// pero el schema lo exige — se infiere un default razonable según la hora,
// siempre editable por el usuario en la confirmación.
function inferMealType(): MealType {
  const hour = new Date().getHours();
  if (hour < 11) return "breakfast";
  if (hour < 16) return "lunch";
  if (hour < 21) return "dinner";
  return "snack";
}

export default function MealCaptureScreen() {
  const router = useRouter();
  const { apiKey } = useGeminiApiKey();

  const [state, setState] = useState<ScreenState>("picker");
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [base64, setBase64] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  // Fila en SQLite creada solo si falló el análisis (ver §5 y el log de
  // decisiones del fix post-5c) — null mientras el camino sea feliz.
  const [mealLogId, setMealLogId] = useState<string | null>(null);

  // Campos editables de la confirmación
  const [mealType, setMealType] = useState<MealType>(inferMealType());
  const [name, setName] = useState("");
  const [calories, setCalories] = useState(0);
  const [proteinG, setProteinG] = useState(0);
  const [carbsG, setCarbsG] = useState(0);
  const [fatG, setFatG] = useState(0);
  const [confidence, setConfidence] = useState<number | null>(null);

  async function runAnalysis(persistedUri: string, imageBase64: string) {
    if (!apiKey) {
      setState("error");
      setErrorMessage(
        "Falta configurar la API key de Gemini en Ajustes de Nutrición.",
      );
      return;
    }

    setState("analyzing");
    try {
      const result: MealAnalysisResult = await analyzeMealPhoto(
        imageBase64,
        apiKey,
      );
      applyAnalysis(result);
      setState("confirm");
    } catch (err) {
      const message =
        err instanceof GeminiAnalysisError
          ? err.message
          : "Error inesperado al analizar la foto.";
      setErrorMessage(message);
      setState("error");

      // Solo se crea la fila la primera vez que falla (§5: "el registro
      // queda en estado pending... reintentable desde el dashboard") — un
      // reintento que vuelve a fallar reutiliza la misma fila, no duplica.
      if (!mealLogId) {
        try {
          const pendingRow = await mealLogRepo.create({
            date: getLocalDateString(),
            mealType,
            photoUri: persistedUri,
            name: "Comida pendiente de analizar",
            calories: 0,
            proteinG: 0,
            carbsG: 0,
            fatG: 0,
            confidence: null,
            source: "ai",
            analysisStatus: "pending",
            notes: null,
          });
          setMealLogId(pendingRow.id);
        } catch {
          // Si ni esto se puede guardar no hay mucho más que hacer acá —
          // el usuario sigue viendo la pantalla de error de todas formas.
        }
      }
    }
  }

  function applyAnalysis(result: MealAnalysisResult) {
    setName(result.name);
    setCalories(result.calories);
    setProteinG(result.proteinG);
    setCarbsG(result.carbsG);
    setFatG(result.fatG);
    setConfidence(result.confidence);
  }

  async function handlePick(source: "camera" | "library") {
    const permission =
      source === "camera"
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert(
        "Permiso necesario",
        source === "camera"
          ? "Necesitamos acceso a la cámara para tomar la foto."
          : "Necesitamos acceso a tus fotos para elegir una.",
      );
      return;
    }

    const result =
      source === "camera"
        ? await ImagePicker.launchCameraAsync({ quality: 0.8 })
        : await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ["images"],
            quality: 0.8,
          });

    if (result.canceled) return;

    try {
      const persisted = await persistMealPhoto(result.assets[0].uri);
      setPhotoUri(persisted.uri);
      setBase64(persisted.base64);
      await runAnalysis(persisted.uri, persisted.base64);
    } catch {
      setState("error");
      setErrorMessage("No se pudo procesar la foto. Probá de nuevo.");
    }
  }

  function handleRetry() {
    if (photoUri && base64) {
      runAnalysis(photoUri, base64);
    } else {
      setState("picker");
    }
  }

  // Único punto de salida (✕). Desde "picker"/"analyzing" no hay nada que
  // limpiar. Desde "error" se deja la fila pending intacta a propósito — es
  // el punto central de este fix, recuperable después desde el dashboard.
  // Desde "confirm" nunca se había persistido nada (§5: "la IA nunca
  // escribe directo, recién se persiste tras la confirmación") — salvo que
  // esta pantalla haya pasado antes por "pending" (falló, se reintentó, y
  // funcionó); en ese caso sí hay una fila real y también se descarta.
  async function handleClose() {
    if (state === "confirm") {
      if (mealLogId) {
        try {
          await mealLogRepo.delete(mealLogId);
        } catch {
          // no crítico — seguimos con la limpieza de la foto igual
        }
      }
      if (photoUri) {
        try {
          const file = new File(photoUri);
          if (file.exists) file.delete();
        } catch {
          // no crítico, la retención de 14 días (paso 5d) la agarra igual
          // si por algo queda un archivo suelto
        }
      }
    }
    router.back();
  }

  async function handleSave() {
    if (!photoUri) return;
    setSaving(true);
    try {
      const values = {
        date: getLocalDateString(),
        mealType,
        photoUri,
        name: name.trim() || "Comida sin nombre",
        calories,
        proteinG,
        carbsG,
        fatG,
        confidence,
        source: "ai" as const,
        analysisStatus: "complete" as const,
      };

      if (mealLogId) {
        // Venía de un intento fallido — se actualiza la fila pending en vez
        // de crear una duplicada.
        await mealLogRepo.update(mealLogId, values);
      } else {
        await mealLogRepo.create({ ...values, notes: null });
      }
      router.back();
    } catch {
      Alert.alert("Error", "No se pudo guardar el registro. Probá de nuevo.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <Stack.Screen
        options={{ headerShown: false, animation: "slide_from_bottom" }}
      />
      <View className="flex-1 bg-bg-base">
        <View className="flex-row items-center justify-between px-4 pt-16 pb-4">
          <Pressable onPress={handleClose}>
            <Text className="text-text-primary text-2xl">✕</Text>
          </Pressable>
          <Text className="text-text-primary font-sans-semibold">
            {state === "confirm" ? "Confirmar registro" : "Nueva comida"}
          </Text>
          <View style={{ width: 24 }} />
        </View>

        {state === "picker" && (
          <View className="flex-1 items-center justify-center px-8 gap-4">
            <Text className="text-5xl mb-2">📷</Text>
            <BrutalistButton
              label="Tomar foto"
              onPress={() => handlePick("camera")}
            />
            <Pressable
              onPress={() => handlePick("library")}
              className="rounded-pill border border-border-subtle px-6 py-3"
            >
              <Text className="text-text-secondary font-sans-semibold">
                Elegir de la galería
              </Text>
            </Pressable>
          </View>
        )}

        {state === "analyzing" && (
          <View className="flex-1 items-center justify-center gap-4">
            <ActivityIndicator color="#F5C518" size="large" />
            <Text className="text-text-secondary font-sans">Analizando...</Text>
          </View>
        )}

        {state === "error" && (
          <View className="flex-1 items-center justify-center px-8 gap-4">
            <Text className="text-danger font-sans text-center">
              {errorMessage}
            </Text>
            <BrutalistButton label="Reintentar" onPress={handleRetry} />
            <Pressable onPress={() => setState("picker")}>
              <Text className="text-text-secondary font-sans-semibold">
                Elegir otra foto
              </Text>
            </Pressable>
          </View>
        )}

        {state === "confirm" && photoUri && (
          <ScrollView
            className="flex-1 px-4"
            contentContainerStyle={{ paddingBottom: 40 }}
          >
            <Image
              source={{ uri: photoUri }}
              style={{
                width: "100%",
                height: 180,
                borderRadius: 16,
                marginBottom: 16,
              }}
            />

            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Nombre de la comida"
              placeholderTextColor="#9B9BA5"
              className="text-text-primary text-lg font-sans-semibold bg-bg-surface border border-border-subtle rounded-chip px-3 py-2 mb-4"
            />

            <View className="flex-row flex-wrap gap-2 mb-6">
              {(Object.keys(MEAL_TYPE_LABEL) as MealType[]).map((type) => (
                <Pressable
                  key={type}
                  onPress={() => setMealType(type)}
                  className={`rounded-pill border px-3 py-1.5 ${
                    mealType === type
                      ? "bg-accent border-accent"
                      : "border-border-subtle"
                  }`}
                >
                  <Text
                    className={
                      mealType === type
                        ? "text-text-on-accent font-sans-semibold text-xs"
                        : "text-text-secondary font-sans text-xs"
                    }
                  >
                    {MEAL_TYPE_LABEL[type]}
                  </Text>
                </Pressable>
              ))}
            </View>

            <View className="flex-row flex-wrap gap-3 mb-4">
              <MacroStepper
                label="Calorías"
                value={calories}
                unit="kcal"
                step={10}
                onChange={setCalories}
              />
              <MacroStepper
                label="Proteína"
                value={proteinG}
                unit="g"
                step={1}
                onChange={setProteinG}
              />
              <MacroStepper
                label="Carbohidratos"
                value={carbsG}
                unit="g"
                step={1}
                onChange={setCarbsG}
              />
              <MacroStepper
                label="Grasas"
                value={fatG}
                unit="g"
                step={1}
                onChange={setFatG}
              />
            </View>

            {confidence !== null && (
              <View className="items-start mb-6">
                <ConfidenceBadge confidence={confidence} />
              </View>
            )}

            <BrutalistButton
              label={saving ? "Guardando..." : "Guardar"}
              onPress={handleSave}
              disabled={saving}
            />
          </ScrollView>
        )}
      </View>
    </>
  );
}
