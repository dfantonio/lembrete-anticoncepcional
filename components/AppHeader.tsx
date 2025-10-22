import { Typography } from "@/constants/theme";
import { useAppTheme } from "@/src/contexts/ThemeContext";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { ThemeToggle } from "./ThemeToggle";

interface AppHeaderProps {
  title: string;
  showBack?: boolean;
  onBack?: () => void;
  showThemeToggle?: boolean;
}

export function AppHeader({
  title,
  showBack = false,
  onBack,
  showThemeToggle = false,
}: AppHeaderProps) {
  const { colors } = useAppTheme();

  return (
    <View style={[styles.header, { backgroundColor: colors.surface }]}>
      {showBack ? (
        <TouchableOpacity
          style={styles.backButton}
          onPress={onBack}
          activeOpacity={0.7}
        >
          <MaterialIcons name="chevron-left" size={24} color={colors.text} />
        </TouchableOpacity>
      ) : (
        <View style={styles.placeholder} />
      )}

      <Text style={[styles.title, { color: colors.text }]}>{title}</Text>

      {showThemeToggle ? (
        <ThemeToggle size="small" />
      ) : (
        <View style={styles.placeholder} />
      )}
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
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
  },
  title: {
    ...Typography.h2,
    textAlign: "center",
    flex: 1,
  },
  placeholder: {
    width: 40, // Same width as back button to center title
  },
});
