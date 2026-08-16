import { useExerciseCatalog } from "@/features/exercises/useExerciseCatalog";
import { AppHeader } from "@/shared/components/AppHeader";
import {
  MUSCLE_GROUPS,
  getMuscleGroupLabel,
} from "@/shared/constants/muscleGroups";
import { WEIGHT_INPUT_MODES } from "@/shared/constants/weightInputModes";
import { WEIGHT_UNITS } from "@/shared/constants/weightUnits";
import { useAppHeaderState } from "@/shared/hooks/useAppHeaderState";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";

export default function ExerciseCatalogScreen() {
  const router = useRouter();
  const {
    loading,
    exercises,
    search,
    setSearch,
    muscleGroupFilter,
    setMuscleGroupFilter,
    updateExercise,
    deleteExercise,
    reload,
  } = useExerciseCatalog();

  const [editingId, setEditingId] = useState<string | null>(null);
  const { avatarUri, hasReminderPending } = useAppHeaderState();

  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload]),
  );

  function confirmDelete(id: string, name: string) {
    Alert.alert("Borrar ejercicio", `¿Borrar "${name}" del catálogo?`, [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Borrar",
        style: "destructive",
        onPress: () => deleteExercise(id),
      },
    ]);
  }

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-bg-base">
        <ActivityIndicator color="#F5C518" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-bg-base px-4 pt-16">
      <AppHeader
        title="Ejercicios"
        avatarUri={avatarUri}
        hasReminderPending={hasReminderPending}
        rightExtra={
          <Pressable onPress={() => router.push("/exercises/new")}>
            <Text className="text-accent font-sans-semibold">+ Nuevo</Text>
          </Pressable>
        }
      />

      <TextInput
        value={search}
        onChangeText={setSearch}
        placeholder="Buscar ejercicio..."
        placeholderTextColor="#9B9BA5"
        className="bg-bg-surface border border-border-subtle rounded-chip px-4 py-3 text-text-primary mb-4"
      />

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ height: 60, flexGrow: 0 }}
        contentContainerStyle={{
          height: 60,
          alignItems: "center",
          gap: 8,
          paddingRight: 16,
        }}
      >
        <Pressable
          onPress={() => setMuscleGroupFilter("all")}
          style={{
            height: 36,
            justifyContent: "center",
            paddingHorizontal: 16,
            borderRadius: 24,
            borderWidth: 1,
            backgroundColor:
              muscleGroupFilter === "all" ? "#F5C518" : "#1A1A20",
            borderColor: muscleGroupFilter === "all" ? "#F5C518" : "#2A2A32",
          }}
        >
          <Text
            className={
              muscleGroupFilter === "all"
                ? "text-text-on-accent font-sans-semibold"
                : "text-text-secondary font-sans"
            }
          >
            Todos
          </Text>
        </Pressable>
        {MUSCLE_GROUPS.map((g) => (
          <Pressable
            key={g.value}
            onPress={() => setMuscleGroupFilter(g.value)}
            style={{
              height: 36,
              justifyContent: "center",
              paddingHorizontal: 16,
              borderRadius: 24,
              borderWidth: 1,
              backgroundColor:
                muscleGroupFilter === g.value ? "#F5C518" : "#1A1A20",
              borderColor:
                muscleGroupFilter === g.value ? "#F5C518" : "#2A2A32",
            }}
          >
            <Text
              className={
                muscleGroupFilter === g.value
                  ? "text-text-on-accent font-sans-semibold"
                  : "text-text-secondary font-sans"
              }
            >
              {g.label}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {exercises.length === 0 && (
          <Text className="text-text-secondary font-sans">
            No hay ejercicios con ese filtro.
          </Text>
        )}

        {exercises.map((ex) => (
          <View
            key={ex.id}
            className="rounded-card border border-border-subtle bg-bg-surface p-4 mb-3"
          >
            <View className="flex-row items-center justify-between">
              <Text className="text-text-primary font-sans-semibold flex-1">
                {ex.name}
              </Text>
              {ex.isCustom && (
                <Text className="text-text-secondary text-xs font-sans">
                  custom
                </Text>
              )}
            </View>
            <Text className="text-text-secondary text-sm font-sans mt-1">
              {getMuscleGroupLabel(ex.muscleGroup)} ·{" "}
              {ex.weightInputMode === "per_side"
                ? "peso por lado"
                : "peso total"}{" "}
              · {ex.inputUnit}
            </Text>

            <View className="flex-row gap-3 mt-3">
              <Pressable
                onPress={() => setEditingId(editingId === ex.id ? null : ex.id)}
                className="rounded-pill bg-bg-surface-alt border border-border-subtle px-4 py-2"
              >
                <Text className="text-text-primary font-sans-semibold">
                  {editingId === ex.id ? "Cerrar" : "Editar"}
                </Text>
              </Pressable>
              {ex.isCustom && (
                <Pressable
                  onPress={() => confirmDelete(ex.id, ex.name)}
                  className="rounded-pill bg-bg-surface-alt border border-danger px-4 py-2"
                >
                  <Text className="text-danger font-sans-semibold">Borrar</Text>
                </Pressable>
              )}
            </View>

            {editingId === ex.id && (
              <View className="mt-4 pt-4 border-t border-border-subtle">
                <Text className="text-text-secondary text-sm font-sans mb-2">
                  Modo de peso
                </Text>
                <View className="flex-row flex-wrap gap-2">
                  {WEIGHT_INPUT_MODES.map((m) => (
                    <Pressable
                      key={m.value}
                      onPress={() =>
                        updateExercise(ex.id, { weightInputMode: m.value })
                      }
                      style={{
                        paddingHorizontal: 16,
                        paddingVertical: 10,
                        borderRadius: 24,
                        borderWidth: 1,
                        backgroundColor:
                          ex.weightInputMode === m.value
                            ? "#F5C518"
                            : "#1A1A20",
                        borderColor:
                          ex.weightInputMode === m.value
                            ? "#F5C518"
                            : "#2A2A32",
                      }}
                    >
                      <Text
                        className={
                          ex.weightInputMode === m.value
                            ? "text-text-on-accent font-sans-semibold"
                            : "text-text-secondary font-sans"
                        }
                      >
                        {m.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>
                <Text className="text-text-secondary text-sm font-sans mb-2 mt-4">
                  Unidad
                </Text>
                <View className="flex-row flex-wrap gap-2">
                  {WEIGHT_UNITS.map((u) => (
                    <Pressable
                      key={u.value}
                      onPress={() =>
                        updateExercise(ex.id, { inputUnit: u.value })
                      }
                      style={{
                        paddingHorizontal: 16,
                        paddingVertical: 10,
                        borderRadius: 24,
                        borderWidth: 1,
                        backgroundColor:
                          ex.inputUnit === u.value ? "#F5C518" : "#1A1A20",
                        borderColor:
                          ex.inputUnit === u.value ? "#F5C518" : "#2A2A32",
                      }}
                    >
                      <Text
                        className={
                          ex.inputUnit === u.value
                            ? "text-text-on-accent font-sans-semibold"
                            : "text-text-secondary font-sans"
                        }
                      >
                        {u.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            )}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}
