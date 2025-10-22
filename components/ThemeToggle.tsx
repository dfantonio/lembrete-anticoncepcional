import { Typography } from "@/constants/theme";
import { useAppTheme } from "@/src/contexts/ThemeContext";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import React from "react";
import { StyleSheet, Text, TouchableOpacity } from "react-native";

interface ThemeToggleProps {
  size?: "small" | "medium" | "large";
}

export function ThemeToggle({ size = "medium" }: ThemeToggleProps) {
  const { themeMode, setThemeMode, colors } = useAppTheme();

  const getIcon = () => {
    switch (themeMode) {
      case "light":
        return "light-mode";
      case "dark":
        return "dark-mode";
      case "system":
        return "brightness-auto";
      default:
        return "brightness-auto";
    }
  };

  const getLabel = () => {
    switch (themeMode) {
      case "light":
        return "Claro";
      case "dark":
        return "Escuro";
      case "system":
        return "Auto";
      default:
        return "Auto";
    }
  };

  const handlePress = () => {
    // Cicla entre: light -> dark -> system -> light
    switch (themeMode) {
      case "light":
        setThemeMode("dark");
        break;
      case "dark":
        setThemeMode("system");
        break;
      case "system":
        setThemeMode("light");
        break;
      default:
        setThemeMode("light");
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case "small":
        return {
          padding: 8,
          iconSize: 16,
          fontSize: 12,
        };
      case "large":
        return {
          padding: 16,
          iconSize: 24,
          fontSize: 16,
        };
      case "medium":
      default:
        return {
          padding: 12,
          iconSize: 20,
          fontSize: 14,
        };
    }
  };

  const sizeStyles = getSizeStyles();

  return (
    <TouchableOpacity
      style={[
        styles.container,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          padding: sizeStyles.padding,
        },
      ]}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <MaterialIcons
        name={getIcon()}
        size={sizeStyles.iconSize}
        color={colors.action}
      />
      <Text
        style={[
          styles.label,
          {
            color: colors.text,
            fontSize: sizeStyles.fontSize,
          },
        ]}
      >
        {getLabel()}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 20,
    borderWidth: 1,
    gap: 6,
  },
  label: {
    ...Typography.caption,
    fontWeight: "600",
  },
});
