import { router } from "expo-router";
import React, { useState } from "react";
import { Alert, Image, StyleSheet, Text, View } from "react-native";

import { Button } from "@/components/Button";
import { AppColors, Typography } from "@/constants/theme";
import { AuthService } from "@/src/services/authService";
import { FirestoreService } from "@/src/services/firestoreService";
import { ScreenName, UserRole } from "@/src/types";

export default function RoleSelectScreen() {
  const [isLoading, setIsLoading] = useState(false);

  const handleRoleSelection = async (role: UserRole) => {
    try {
      setIsLoading(true);

      const userId = AuthService.getCurrentUserId();
      if (!userId) {
        throw new Error("Usuário não autenticado");
      }

      // Salvar role no Firestore
      await FirestoreService.saveUserConfig(userId, {
        role,
        platform: "android", // TODO: detectar plataforma real
      });

      console.log("✅ Role salvo:", role);

      // Redirecionar para tela apropriada
      if (role === "GF_PILL_TAKER") {
        router.replace(`/${ScreenName.MainGF}`);
      } else {
        router.replace(`/${ScreenName.MainBF}`);
      }
    } catch (error) {
      console.error("❌ Erro ao salvar role:", error);
      Alert.alert(
        "Erro",
        "Não foi possível salvar sua escolha. Tente novamente.",
        [{ text: "OK" }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* Logo */}
        <View style={styles.logoContainer}>
          <Image
            source={require("@/assets/logo/logo.png")}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        {/* Título */}
        <Text style={styles.title}>Bem-vinda!</Text>
        <Text style={styles.subtitle}>
          Para começar, escolha seu papel no aplicativo:
        </Text>

        {/* Botões de seleção */}
        <View style={styles.buttonsContainer}>
          <Button
            title="Eu sou a Sasa 💊"
            onPress={() => handleRoleSelection("GF_PILL_TAKER")}
            disabled={isLoading}
            style={styles.roleButton}
          />

          <Button
            title="Eu sou o Tonho 📱"
            onPress={() => handleRoleSelection("BF_REMINDER")}
            disabled={isLoading}
            style={styles.secondaryButton}
          />
        </View>

        {/* Texto explicativo */}
        <Text style={styles.explanation}>
          A Sasa receberá lembretes diários às 20h.{"\n"}O Tonho será notificado
          às 22h se a pílula não for registrada.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.base,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingVertical: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  logoContainer: {
    marginBottom: 40,
    alignItems: "center",
  },
  logo: {
    width: 120,
    height: 120,
  },
  title: {
    ...Typography.h1,
    color: AppColors.text,
    textAlign: "center",
    marginBottom: 16,
  },
  subtitle: {
    ...Typography.body,
    color: AppColors.text,
    textAlign: "center",
    marginBottom: 48,
    opacity: 0.8,
  },
  buttonsContainer: {
    width: "100%",
    marginBottom: 32,
  },
  roleButton: {
    marginBottom: 16,
    minHeight: 56,
  },
  secondaryButton: {
    backgroundColor: AppColors.text,
  },
  explanation: {
    ...Typography.caption,
    color: AppColors.text,
    textAlign: "center",
    opacity: 0.6,
    lineHeight: 20,
  },
});
