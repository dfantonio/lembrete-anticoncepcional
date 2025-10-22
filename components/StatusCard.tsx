import { AppColors, Typography } from "@/constants/theme";
import React from "react";
import { StyleSheet, Text, View, ViewStyle } from "react-native";
import { IconSymbol } from "./ui/icon-symbol";

interface StatusCardProps {
  taken: boolean;
  takenTime?: string;
  style?: ViewStyle;
}

export function StatusCard({ taken, takenTime, style }: StatusCardProps) {
  const getStatusColor = () => {
    return taken ? AppColors.success : AppColors.alert;
  };

  const getStatusText = () => {
    return taken ? "Pílula Tomada" : "Pílula Pendente";
  };

  const getStatusIcon = () => {
    return taken ? "checkmark.circle.fill" : "exclamationmark.circle.fill";
  };

  return (
    <View style={[styles.card, style]}>
      <View style={styles.statusContainer}>
        <IconSymbol name={getStatusIcon()} size={32} color={getStatusColor()} />
        <View style={styles.textContainer}>
          <Text style={[styles.statusText, { color: getStatusColor() }]}>
            {getStatusText()}
          </Text>
          {taken && takenTime && (
            <Text style={styles.timeText}>Tomada às {takenTime}</Text>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: AppColors.white,
    borderRadius: 12,
    padding: 20,
    marginVertical: 8,
    shadowColor: AppColors.text,
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
  },
  textContainer: {
    marginLeft: 16,
    flex: 1,
  },
  statusText: {
    ...Typography.h1,
    marginBottom: 4,
  },
  timeText: {
    ...Typography.body,
    color: AppColors.text,
    opacity: 0.7,
  },
});
