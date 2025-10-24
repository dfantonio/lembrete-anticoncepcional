import React from "react";
import {
  ActionSheetIOS,
  Alert,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { Typography } from "@/constants/theme";
import { useAppTheme } from "@/src/contexts/ThemeContext";
import { PillType } from "@/src/types";

interface SplitButtonProps {
  pillType: PillType;
  onSelect: (type: PillType) => void;
  onPress: () => void;
  disabled?: boolean;
  size?: "small" | "medium" | "large";
}

export function SplitButton({
  pillType,
  onSelect,
  onPress,
  disabled = false,
  size = "medium",
}: SplitButtonProps) {
  const { colors } = useAppTheme();

  const getSizeStyles = () => {
    switch (size) {
      case "small":
        return {
          paddingVertical: 4,
          paddingHorizontal: 8,
          fontSize: 14,
          borderRadius: 16,
        };
      case "large":
        return {
          paddingVertical: 16,
          paddingHorizontal: 32,
          fontSize: 18,
          borderRadius: 25,
        };
      case "medium":
      default:
        return {
          paddingVertical: 12,
          paddingHorizontal: 24,
          fontSize: 16,
          borderRadius: 22,
        };
    }
  };

  const handleDropdownPress = () => {
    if (disabled) return;

    const options = ["Ativo 💊", "Placebo 🟡", "Cancelar"];
    const cancelButtonIndex = 2;

    if (Platform.OS === "ios") {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options,
          cancelButtonIndex,
        },
        (buttonIndex: number) => {
          if (buttonIndex === 0) {
            onSelect("active");
          } else if (buttonIndex === 1) {
            onSelect("placebo");
          }
        }
      );
    } else {
      // Para Android, usar Alert.alert como fallback
      Alert.alert("Selecionar Tipo", "Escolha o tipo de pílula:", [
        { text: "Cancelar", style: "cancel" },
        { text: "Ativo 💊", onPress: () => onSelect("active") },
        { text: "Placebo 🟡", onPress: () => onSelect("placebo") },
      ]);
    }
  };

  const getButtonStyle = () => {
    const sizeStyles = getSizeStyles();
    return [
      styles.button,
      disabled && styles.buttonDisabled,
      {
        paddingVertical: sizeStyles.paddingVertical,
        paddingHorizontal: sizeStyles.paddingHorizontal,
        borderRadius: sizeStyles.borderRadius,
        backgroundColor: colors.action,
        shadowColor: colors.text,
      },
    ];
  };

  const getTextStyle = () => {
    const sizeStyles = getSizeStyles();
    return [
      styles.buttonText,
      disabled && styles.buttonTextDisabled,
      {
        fontSize: sizeStyles.fontSize,
        color: colors.white,
      },
    ];
  };

  const getDropdownStyle = () => {
    const sizeStyles = getSizeStyles();
    return [
      styles.dropdownButton,
      disabled && styles.buttonDisabled,
      {
        paddingVertical: sizeStyles.paddingVertical,
        paddingHorizontal: 12,
        borderRadius: sizeStyles.borderRadius,
        backgroundColor: colors.action,
        shadowColor: colors.text,
      },
    ];
  };

  const getDropdownTextStyle = () => {
    const sizeStyles = getSizeStyles();
    return [
      styles.dropdownText,
      disabled && styles.buttonTextDisabled,
      {
        fontSize: sizeStyles.fontSize,
        color: colors.white,
      },
    ];
  };

  const getPillTypeLabel = () => {
    return pillType === "active" ? "Ativo 💊" : "Placebo 🟡";
  };

  return (
    <View style={styles.container}>
      {/* Botão principal */}
      <TouchableOpacity
        style={[getButtonStyle(), styles.mainButton]}
        onPress={onPress}
        disabled={disabled}
        activeOpacity={0.8}
      >
        <Text style={getTextStyle()}>Registrar {getPillTypeLabel()}</Text>
      </TouchableOpacity>

      {/* Botão dropdown */}
      <TouchableOpacity
        style={getDropdownStyle()}
        onPress={handleDropdownPress}
        disabled={disabled}
        activeOpacity={0.8}
      >
        <Text style={getDropdownTextStyle()}>▼</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
  },
  button: {
    alignItems: "center",
    justifyContent: "center",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonDisabled: {
    opacity: 0.3,
  },
  buttonText: {
    ...Typography.button,
    textAlign: "center",
  },
  buttonTextDisabled: {
    opacity: 0.7,
  },
  mainButton: {
    flex: 1,
    borderTopRightRadius: 0,
    borderBottomRightRadius: 0,
  },
  dropdownButton: {
    alignItems: "center",
    justifyContent: "center",
    borderTopLeftRadius: 0,
    borderBottomLeftRadius: 0,
    borderLeftWidth: 1,
    borderLeftColor: "rgba(255, 255, 255, 0.3)",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  dropdownText: {
    ...Typography.button,
    textAlign: "center",
    fontWeight: "bold",
  },
});
