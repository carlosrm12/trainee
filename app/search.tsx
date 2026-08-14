import {
  SearchResult,
  useGlobalSearch,
} from "@/features/search/useGlobalSearch";
import { useRouter } from "expo-router";
import { useEffect, useRef } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";

const GROUP_LABEL: Record<SearchResult["kind"], string> = {
  exercise: "Ejercicios",
  routine: "Rutinas",
  session: "Historial",
};

const GROUP_ICON: Record<SearchResult["kind"], string> = {
  exercise: "🏋️",
  routine: "📋",
  session: "🕓",
};

const GROUP_ORDER: SearchResult["kind"][] = ["exercise", "routine", "session"];

export default function SearchScreen() {
  const router = useRouter();
  const { query, setQuery, results, loading, hasMinLength } = useGlobalSearch();
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    // Al abrir la pantalla el teclado ya debe estar arriba — es lo único
    // que el usuario quiere hacer al tocar la barra de búsqueda en Home.
    const timeout = setTimeout(() => inputRef.current?.focus(), 150);
    return () => clearTimeout(timeout);
  }, []);

  function handleResultPress(result: SearchResult) {
    if (result.kind === "exercise") {
      router.push(`/history/exercise/${result.id}`);
    } else if (result.kind === "routine") {
      router.push(`/routines/${result.id}/edit`);
    } else {
      router.push(`/history/${result.id}`);
    }
  }

  const grouped = GROUP_ORDER.map((kind) => ({
    kind,
    items: results.filter((r) => r.kind === kind),
  })).filter((group) => group.items.length > 0);

  return (
    <View className="flex-1 bg-bg-base px-4 pt-16">
      <View className="flex-row items-center gap-3 mb-6">
        <View className="flex-1 flex-row items-center bg-bg-surface border border-border-subtle rounded-chip px-4">
          <Text className="text-text-secondary mr-2">🔍</Text>
          <TextInput
            ref={inputRef}
            value={query}
            onChangeText={setQuery}
            placeholder="Buscar ejercicio, rutina o historial..."
            placeholderTextColor="#9B9BA5"
            className="flex-1 py-3 text-text-primary font-sans"
            autoCorrect={false}
            returnKeyType="search"
          />
        </View>
        <Pressable onPress={() => router.back()}>
          <Text className="text-accent font-sans-semibold">Cancelar</Text>
        </Pressable>
      </View>

      {loading && (
        <View className="items-center mt-10">
          <ActivityIndicator color="#F5C518" />
        </View>
      )}

      {!loading && !hasMinLength && (
        <Text className="text-text-secondary font-sans text-center mt-10">
          Escribe al menos 2 letras para buscar.
        </Text>
      )}

      {!loading && hasMinLength && results.length === 0 && (
        <Text className="text-text-secondary font-sans text-center mt-10">
          Sin resultados para &quot;{query.trim()}&quot;.
        </Text>
      )}

      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: 60 }}
      >
        {grouped.map((group) => (
          <View key={group.kind} className="mb-6">
            <Text className="text-text-secondary text-sm font-sans-semibold mb-2 uppercase tracking-wide">
              {GROUP_LABEL[group.kind]}
            </Text>
            {group.items.map((item) => (
              <Pressable
                key={`${item.kind}-${item.id}`}
                onPress={() => handleResultPress(item)}
                className="flex-row items-center rounded-card border border-border-subtle bg-bg-surface px-4 py-3 mb-2"
              >
                <Text className="text-lg mr-3">{GROUP_ICON[item.kind]}</Text>
                <View className="flex-1">
                  <Text className="text-text-primary font-sans-semibold">
                    {item.title}
                  </Text>
                  <Text className="text-text-secondary text-xs font-sans mt-0.5">
                    {item.subtitle}
                  </Text>
                </View>
              </Pressable>
            ))}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}
