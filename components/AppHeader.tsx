import { AppColors, Typography } from "@/constants/theme";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { IconSymbol } from "./ui/icon-symbol";

interface AppHeaderProps {
  title: string;
  showBack?: boolean;
  onBack?: () => void;
}

export function AppHeader({ title, showBack = false, onBack }: AppHeaderProps) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        {showBack && (
          <TouchableOpacity
            style={styles.backButton}
            onPress={onBack}
            activeOpacity={0.7}
          >
            <IconSymbol name="chevron.left" size={24} color={AppColors.text} />
          </TouchableOpacity>
        )}
        <Text style={styles.title}>{title}</Text>
        {showBack && <View style={styles.placeholder} />}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: AppColors.white,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: AppColors.white,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.base,
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
