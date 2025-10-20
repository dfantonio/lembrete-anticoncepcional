import { AppColors, Typography } from "@/constants/theme";
import React from "react";
import {
  Animated,
  StyleSheet,
  Text,
  TextStyle,
  TouchableOpacity,
  ViewStyle,
} from "react-native";

interface ButtonProps {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  variant?: "primary" | "outlined";
  size?: "small" | "medium" | "large";
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export function Button({
  title,
  onPress,
  disabled = false,
  variant = "primary",
  size = "medium",
  style,
  textStyle,
}: ButtonProps) {
  const scaleValue = new Animated.Value(1);

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

  const handlePressIn = () => {
    Animated.spring(scaleValue, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleValue, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  const getButtonStyle = () => {
    const sizeStyles = getSizeStyles();

    if (variant === "outlined") {
      return [
        styles.buttonOutlined,
        disabled && styles.buttonOutlinedDisabled,
        {
          paddingVertical: sizeStyles.paddingVertical,
          paddingHorizontal: sizeStyles.paddingHorizontal,
          borderRadius: sizeStyles.borderRadius,
        },
        style,
      ];
    }
    return [
      styles.button,
      disabled && styles.buttonDisabled,
      {
        paddingVertical: sizeStyles.paddingVertical,
        paddingHorizontal: sizeStyles.paddingHorizontal,
        borderRadius: sizeStyles.borderRadius,
      },
      style,
    ];
  };

  const getTextStyle = () => {
    const sizeStyles = getSizeStyles();

    if (variant === "outlined") {
      return [
        styles.buttonTextOutlined,
        disabled && styles.buttonTextOutlinedDisabled,
        {
          fontSize: sizeStyles.fontSize,
        },
        textStyle,
      ];
    }
    return [
      styles.buttonText,
      disabled && styles.buttonTextDisabled,
      {
        fontSize: sizeStyles.fontSize,
      },
      textStyle,
    ];
  };

  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity
        style={getButtonStyle()}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
        activeOpacity={0.8}
      >
        <Text style={getTextStyle()}>{title}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  // Estilos Primary (padrão)
  button: {
    backgroundColor: AppColors.action,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 25, // Pill-shaped
    alignItems: "center",
    justifyContent: "center",
    shadowColor: AppColors.text,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonDisabled: {
    backgroundColor: AppColors.text,
    opacity: 0.3,
  },
  buttonText: {
    ...Typography.button,
    color: AppColors.white,
    textAlign: "center",
  },
  buttonTextDisabled: {
    color: AppColors.white,
    opacity: 0.7,
  },

  // Estilos Outlined
  buttonOutlined: {
    backgroundColor: "transparent",
    borderWidth: 2,
    borderColor: AppColors.action,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 25, // Pill-shaped
    alignItems: "center",
    justifyContent: "center",
  },
  buttonOutlinedDisabled: {
    borderColor: AppColors.text,
    opacity: 0.3,
  },
  buttonTextOutlined: {
    ...Typography.button,
    color: AppColors.action,
    textAlign: "center",
  },
  buttonTextOutlinedDisabled: {
    color: AppColors.text,
    opacity: 0.5,
  },
});
