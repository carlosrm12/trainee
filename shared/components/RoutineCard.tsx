import { Text, View } from "react-native";
import { colors, radius } from "../theme/tokens";
import { BrutalistButton } from "./BrutalistButton";

type RoutineCardProps = {
  name: string;
  meta: string;
  onPress: () => void;
  featured?: boolean;
};

export function RoutineCard({
  name,
  meta,
  onPress,
  featured = false,
}: RoutineCardProps) {
  return (
    <View
      style={{
        borderRadius: featured ? radius.cardLg : radius.card,
        borderWidth: 1,
        borderColor: colors.borderSubtle,
        backgroundColor: featured ? colors.bgSurfaceAlt : colors.bgSurface,
        padding: 16,
        marginBottom: 12,
      }}
    >
      <Text
        style={{
          color: colors.textPrimary,
          fontFamily: "Inter_600SemiBold",
          fontSize: featured ? 20 : 16,
        }}
      >
        {name}
      </Text>
      <Text style={{ color: colors.textSecondary, fontSize: 13, marginTop: 4 }}>
        {meta}
      </Text>
      <View style={{ marginTop: 12 }}>
        <BrutalistButton label="Empezar" onPress={onPress} fullWidth={false} />
      </View>
    </View>
  );
}
