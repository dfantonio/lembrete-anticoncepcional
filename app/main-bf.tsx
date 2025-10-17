import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AppHeader } from "@/components/AppHeader";
import { PrimaryButton } from "@/components/PrimaryButton";
import { StatusCard } from "@/components/StatusCard";
import { AppColors, Typography } from "@/constants/theme";
import { AuthService } from "@/src/services/authService";
import { FirestoreService } from "@/src/services/firestoreService";
import { NotificationService } from "@/src/services/notificationService";
import { DailyLog } from "@/src/types";

export default function MainBFScreen() {
  const [dailyLog, setDailyLog] = useState<DailyLog | null>(null);

  useEffect(() => {
    initializeScreen();
  }, []);

  const initializeScreen = async () => {
    try {
      // Verificar autenticação
      const userId = AuthService.getCurrentUserId();
      if (!userId) {
        router.replace("/role-select");
        return;
      }

      // Registrar para push notifications e salvar token
      const pushToken =
        await NotificationService.registerForPushNotifications();
      if (pushToken) {
        await NotificationService.savePushTokenToFirestore();
        console.log("✅ Push token registrado e salvo");
      }

      // Observar mudanças no log diário
      const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
      const unsubscribe = FirestoreService.watchDailyLog(today, (log) => {
        setDailyLog(log);
      });

      return unsubscribe;
    } catch (error) {
      console.error("❌ Erro na inicialização da tela BF:", error);
    }
  };

  const navigateToHistory = () => {
    router.push("/calendar-history");
  };

  const getStatusMessage = () => {
    if (!dailyLog) {
      return "Aguardando informações...";
    }

    if (dailyLog.taken) {
      return `✅ Pílula tomada às ${dailyLog.takenTime}`;
    } else {
      return "⚠️ Pílula ainda não foi registrada hoje";
    }
  };

  const getStatusColor = () => {
    if (!dailyLog) return AppColors.text;
    return dailyLog.taken ? AppColors.success : AppColors.alert;
  };

  return (
    <SafeAreaView style={styles.container}>
      <AppHeader title="Acompanhamento" />

      <View style={styles.content}>
        {/* Status do dia */}
        <View style={styles.statusSection}>
          <Text style={styles.statusTitle}>Status de Hoje</Text>
          <StatusCard
            taken={dailyLog?.taken || false}
            takenTime={dailyLog?.takenTime}
          />
        </View>

        {/* Mensagem de status */}
        <View style={styles.messageSection}>
          <Text style={[styles.statusMessage, { color: getStatusColor() }]}>
            {getStatusMessage()}
          </Text>
        </View>

        {/* Informações sobre notificações */}
        <View style={styles.notificationInfo}>
          <Text style={styles.infoTitle}>📱 Notificações Automáticas</Text>
          <Text style={styles.infoText}>
            Você receberá uma notificação às 22:00 se a pílula não for
            registrada até lá.
          </Text>
          <Text style={styles.infoText}>
            Esta notificação funcionará mesmo com o app fechado.
          </Text>
        </View>

        {/* Botão de histórico */}
        <View style={styles.historySection}>
          <PrimaryButton
            title="Ver Histórico"
            onPress={navigateToHistory}
            style={styles.historyButton}
          />
        </View>

        {/* Informações adicionais */}
        <View style={styles.additionalInfo}>
          <Text style={styles.additionalInfoText}>
            💡 Este app funciona em tempo real - você verá as atualizações
            instantaneamente.
          </Text>
          <Text style={styles.additionalInfoText}>
            🔔 Certifique-se de que as notificações estão habilitadas para este
            app.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.base,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  statusSection: {
    marginBottom: 24,
  },
  statusTitle: {
    ...Typography.h2,
    color: AppColors.text,
    marginBottom: 16,
    textAlign: "center",
  },
  messageSection: {
    marginBottom: 32,
    alignItems: "center",
  },
  statusMessage: {
    ...Typography.body,
    textAlign: "center",
    fontWeight: "600",
  },
  notificationInfo: {
    backgroundColor: AppColors.white,
    padding: 20,
    borderRadius: 12,
    marginBottom: 32,
    shadowColor: AppColors.text,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  infoTitle: {
    ...Typography.h2,
    color: AppColors.text,
    marginBottom: 12,
  },
  infoText: {
    ...Typography.body,
    color: AppColors.text,
    marginBottom: 8,
    opacity: 0.8,
  },
  historySection: {
    marginBottom: 32,
  },
  historyButton: {
    minHeight: 50,
    backgroundColor: AppColors.text,
  },
  additionalInfo: {
    marginTop: "auto",
  },
  additionalInfoText: {
    ...Typography.caption,
    color: AppColors.text,
    textAlign: "center",
    marginBottom: 8,
    opacity: 0.6,
  },
});
