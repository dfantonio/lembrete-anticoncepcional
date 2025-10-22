import { AppColors, Typography } from "@/constants/theme";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface AppHeaderProps {
  title: string;
  showBack?: boolean;
  onBack?: () => void;
}

export function AppHeader({ title, showBack = false, onBack }: AppHeaderProps) {
  return (
    <View style={styles.header}>
      {showBack && (
        <TouchableOpacity
          style={styles.backButton}
          onPress={onBack}
          activeOpacity={0.7}
        >
          <MaterialIcons name="chevron-left" size={24} color={AppColors.text} />
        </TouchableOpacity>
      )}
      <Text style={styles.title}>{title}</Text>
      {showBack && <View style={styles.placeholder} />}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: AppColors.white,
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
  },
  title: {
    ...Typography.h2,
    color: AppColors.text,
    textAlign: "center",
    flex: 1,
  },
  placeholder: {
    width: 40, // Same width as back button to center title
  },
});
