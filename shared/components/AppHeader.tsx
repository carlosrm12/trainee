import { useRouter } from "expo-router";
import { Bell, Settings } from "lucide-react-native";
import type { ReactNode } from "react";
import { Image, Pressable, Text, View } from "react-native";

interface AppHeaderProps {
  title: string;
  avatarUri: string | null;
  hasReminderPending: boolean;
  onSettingsPress?: () => void;
  // Slot para elementos propios de una sola pantalla (ej. StreakBadge en Home,
  // "+ Nuevo" en Ejercicios) sin tener que agregar un prop nuevo por caso.
  rightExtra?: ReactNode;
}

const AVATAR_SIZE = 32;

export function AppHeader({
  title,
  avatarUri,
  hasReminderPending,
  onSettingsPress,
  rightExtra,
}: AppHeaderProps) {
  const router = useRouter();

  return (
    <View className="flex-row items-center justify-between mb-4">
      <Text className="text-text-primary text-2xl font-sans-bold flex-1 pr-3">
        {title}
      </Text>
      <View className="flex-row items-center gap-3">
        {rightExtra}

        {onSettingsPress && (
          <Pressable onPress={onSettingsPress}>
            <Settings color="#9B9BA5" size={22} />
          </Pressable>
        )}

        <Pressable onPress={() => router.push("/reminders")}>
          <View>
            <Bell color="#9B9BA5" size={22} />
            {hasReminderPending && (
              <View className="absolute -top-0.5 -right-0.5 bg-danger rounded-full w-2.5 h-2.5" />
            )}
          </View>
        </Pressable>

        <Pressable onPress={() => router.push("/profile")}>
          {avatarUri ? (
            <Image
              source={{ uri: avatarUri }}
              style={{
                width: AVATAR_SIZE,
                height: AVATAR_SIZE,
                borderRadius: AVATAR_SIZE / 2,
              }}
            />
          ) : (
            <View
              className="items-center justify-center bg-bg-surface border border-border-subtle"
              style={{
                width: AVATAR_SIZE,
                height: AVATAR_SIZE,
                borderRadius: AVATAR_SIZE / 2,
              }}
            >
              <Text className="text-text-secondary text-xs">🏋️</Text>
            </View>
          )}
        </Pressable>
      </View>
    </View>
  );
}
