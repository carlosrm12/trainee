import { Text, View } from "react-native";
import { colors } from "../theme/tokens";

type Stat = {
  value: string;
  label: string;
};

type StatRowProps = {
  stats: Stat[];
};

export function StatRow({ stats }: StatRowProps) {
  return (
    <View style={{ flexDirection: "row" }}>
      {stats.map((stat, i) => (
        <View
          key={i}
          style={{
            flex: 1,
            alignItems: "center",
            borderLeftWidth: i === 0 ? 0 : 1,
            borderLeftColor: colors.borderSubtle,
          }}
        >
          <Text
            style={{
              color: colors.textPrimary,
              fontFamily: "Inter_700Bold",
              fontSize: 18,
            }}
          >
            {stat.value}
          </Text>
          <Text
            style={{ color: colors.textSecondary, fontSize: 11, marginTop: 2 }}
          >
            {stat.label}
          </Text>
        </View>
      ))}
    </View>
  );
}
