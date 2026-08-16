import { useProfileStats } from "@/features/profile/useProfileStats";
import { useSettings } from "@/features/profile/useSettings";
import { SettingsRow } from "@/shared/components/SettingsRow";
import { StatRow } from "@/shared/components/StatRow";
import { segmentedToggleStyle } from "@/shared/utils/segmentedToggleStyle";
import { File, Paths } from "expo-file-system";
import * as ImagePicker from "expo-image-picker";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  Switch,
  Text,
  View,
} from "react-native";

const AVATAR_FILENAME = "avatar.jpg";

async function persistAvatar(pickedUri: string): Promise<string> {
  const source = new File(pickedUri);
  const dest = new File(Paths.document, AVATAR_FILENAME);
  if (dest.exists) {
    dest.delete();
  }
  await source.copy(dest);
  return `${dest.uri}?v=${Date.now()}`;
}

export default function ProfileScreen() {
  const router = useRouter();
  const {
    loading: statsLoading,
    totalSessions,
    streakDays,
    reload,
  } = useProfileStats();
  const {
    loading: settingsLoading,
    weightUnit,
    setWeightUnit,
    soundEnabled,
    setSoundEnabled,
    vibrationEnabled,
    setVibrationEnabled,
    notificationsEnabled,
    setNotificationsEnabled,
    avatarUri,
    setAvatarUri,
  } = useSettings();

  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload]),
  );

  async function handlePickAvatar() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(
        "Permiso necesario",
        "Necesitamos acceso a tus fotos para poner un avatar.",
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (result.canceled) return;

    const persistedUri = await persistAvatar(result.assets[0].uri);
    await setAvatarUri(persistedUri);
  }

  if (statsLoading || settingsLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-bg-base">
        <ActivityIndicator color="#F5C518" />
      </View>
    );
  }

  return (
    <ScrollView
      className="flex-1 bg-bg-base px-6 pt-16"
      contentContainerStyle={{ paddingBottom: 100 }}
    >
      <View className="flex-row items-center justify-between mb-6">
        <Text className="text-text-primary text-2xl font-sans-bold">
          Perfil
        </Text>
        <Pressable onPress={() => router.back()}>
          <Text className="text-accent font-sans-semibold">Cerrar</Text>
        </Pressable>
      </View>

      <View className="items-center mb-6">
        <Pressable onPress={handlePickAvatar}>
          {avatarUri ? (
            <Image
              source={{ uri: avatarUri }}
              style={{ width: 88, height: 88, borderRadius: 44 }}
            />
          ) : (
            <View
              className="items-center justify-center bg-bg-surface border border-border-subtle"
              style={{ width: 88, height: 88, borderRadius: 44 }}
            >
              <Text className="text-text-secondary text-3xl">🏋️</Text>
            </View>
          )}
          <View className="absolute -bottom-1 -right-1 bg-accent rounded-full w-7 h-7 items-center justify-center border-2 border-bg-base">
            <Text className="text-text-on-accent text-xs">✎</Text>
          </View>
        </Pressable>
      </View>

      <Text className="text-text-primary text-2xl font-sans-bold mb-1 text-center">
        Carlos
      </Text>
      <Text className="text-text-secondary font-sans mb-8 text-center">
        Tu progreso
      </Text>

      <View className="rounded-card border border-border-subtle bg-bg-surface p-4 mb-10">
        <StatRow
          items={[
            { icon: "🔥", value: String(streakDays), label: "racha (días)" },
            { value: String(totalSessions), label: "sesiones totales" },
          ]}
        />
      </View>

      <Text className="text-text-primary font-sans-semibold mb-3">Ajustes</Text>

      <Text className="text-text-secondary text-sm font-sans mb-2">
        Unidad de peso
      </Text>
      <View className="flex-row gap-2 mb-6">
        <Pressable
          onPress={() => setWeightUnit("kg")}
          style={segmentedToggleStyle(weightUnit === "kg")}
        >
          <Text
            className={
              weightUnit === "kg"
                ? "text-text-on-accent font-sans-semibold"
                : "text-text-secondary font-sans"
            }
          >
            Kilogramos (kg)
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setWeightUnit("lb")}
          style={segmentedToggleStyle(weightUnit === "lb")}
        >
          <Text
            className={
              weightUnit === "lb"
                ? "text-text-on-accent font-sans-semibold"
                : "text-text-secondary font-sans"
            }
          >
            Libras (lb)
          </Text>
        </Pressable>
      </View>

      <View className="rounded-card border border-border-subtle bg-bg-surface">
        <SettingsRow
          label="Notificaciones"
          description="Avisa cuando termina el descanso, aunque tengas la app cerrada."
          control={
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              trackColor={{ false: "#2A2A32", true: "#F5C518" }}
              thumbColor="#FFFFFF"
            />
          }
        />
        <SettingsRow
          label="Sonido del timer"
          description="Reproduce un sonido al terminar el descanso."
          control={
            <Switch
              value={soundEnabled}
              onValueChange={setSoundEnabled}
              trackColor={{ false: "#2A2A32", true: "#F5C518" }}
              thumbColor="#FFFFFF"
            />
          }
        />
        <SettingsRow
          label="Vibración del timer"
          description="Vibra al terminar el descanso con la app abierta."
          isLast
          control={
            <Switch
              value={vibrationEnabled}
              onValueChange={setVibrationEnabled}
              trackColor={{ false: "#2A2A32", true: "#F5C518" }}
              thumbColor="#FFFFFF"
            />
          }
        />
      </View>
    </ScrollView>
  );
}
