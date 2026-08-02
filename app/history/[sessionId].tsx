import { useLocalSearchParams } from "expo-router";
import { Text, View } from "react-native";

export default function SessionDetailScreen() {
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();

  return (
    <View className="flex-1 items-center justify-center bg-bg-base px-6">
      <Text className="text-text-primary text-lg text-center">
        Detalle de la sesión — lo construimos en el Paso 6b.
      </Text>
      <Text className="text-text-secondary text-sm mt-2">{sessionId}</Text>
    </View>
  );
}
