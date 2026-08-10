import { Text, View } from "react-native";
import Svg, { Circle } from "react-native-svg";

type RestTimerRingProps = {
  remaining: number;
  total: number;
  size?: number;
};

export function RestTimerRing({
  remaining,
  total,
  size = 220,
}: RestTimerRingProps) {
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const isFinished = remaining <= 0;
  const progress = isFinished ? 1 : total > 0 ? remaining / total : 0;
  const strokeDashoffset = circumference * (1 - progress);
  const ringColor = isFinished ? "#FFFFFF" : "#F5C518";

  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;
  const label = `${minutes}:${seconds.toString().padStart(2, "0")}`;

  return (
    <View
      style={{
        width: size,
        height: size,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Svg width={size} height={size}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#2A2A32"
          strokeWidth={strokeWidth}
          fill="none"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={ringColor}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          rotation="-90"
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>
      <View style={{ position: "absolute" }}>
        <Text className="text-text-primary text-4xl font-sans-bold">
          {label}
        </Text>
      </View>
    </View>
  );
}
