import { Typography } from "@/constants/theme";
import { useAppTheme } from "@/src/contexts/ThemeContext";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import React from "react";
import { StyleSheet, Text, View, ViewStyle } from "react-native";

interface StatusCardProps {
  taken: boolean;
  takenTime?: string;
  style?: ViewStyle;
}

export function StatusCard({ taken, takenTime, style }: StatusCardProps) {
  const { colors } = useAppTheme();

  const getStatusColor = () => {
    return taken ? colors.success : colors.alert;
  };

  const getStatusText = () => {
    return taken ? "Pílula Tomada" : "Pílula Pendente";
  };

  const getStatusIcon = () => {
    return taken ? "check-circle" : "error";
  };

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.surface, shadowColor: colors.text },
        style,
      ]}
    >
      <View style={styles.statusContainer}>
        <MaterialIcons
          name={getStatusIcon()}
          size={32}
          color={getStatusColor()}
        />
        <View style={styles.textContainer}>
          <Text style={[styles.statusText, { color: getStatusColor() }]}>
            {getStatusText()}
          </Text>
          {taken && takenTime && (
            <Text style={[styles.timeText, { color: colors.textSecondary }]}>
              Tomada às {takenTime}
            </Text>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  textContainer: {
    marginLeft: 16,
    // flex: 1,
  },
  statusText: {
    ...Typography.h1,
  },
  timeText: {
    ...Typography.body,
    opacity: 0.7,
  },
});
