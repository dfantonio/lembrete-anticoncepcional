import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AppHeader } from "@/components/AppHeader";
import { PrimaryButton } from "@/components/PrimaryButton";
import { StatusCard } from "@/components/StatusCard";
import { AppColors, Typography } from "@/constants/theme";
import { AuthService } from "@/src/services/authService";
import { FirestoreService } from "@/src/services/firestoreService";
import { NotificationService } from "@/src/services/notificationService";
import { DailyLog, ScreenName } from "@/src/types";

export default function MainGFScreen() {
  const [dailyLog, setDailyLog] = useState<DailyLog | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    initializeScreen();
  }, []);

  const initializeScreen = async () => {
    try {
      // Verificar autenticação
      const userId = AuthService.getCurrentUserId();
      if (!userId) {
        router.replace(`/${ScreenName.RoleSelect}`);
        return;
      }

      // Solicitar permissões de notificação
      await NotificationService.requestPermissions();

      // Agendar notificação diária para 20:00
      await NotificationService.scheduleDaily20hNotification();

      // Observar mudanças no log diário
      const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
      const unsubscribe = FirestoreService.watchDailyLog(today, (log) => {
        setDailyLog(log);
      });

      return unsubscribe;
    } catch (error) {
      console.error("❌ Erro na inicialização da tela GF:", error);
    }
  };

  const handlePillTaken = async () => {
    try {
      setIsLoading(true);

      const userId = AuthService.getCurrentUserId();
      if (!userId) {
        throw new Error("Usuário não autenticado");
      }

      const now = new Date();
      const dateKey = now.toISOString().split("T")[0]; // YYYY-MM-DD
      const timeString = now.toTimeString().split(" ")[0].substring(0, 5); // HH:MM

      const newLog: DailyLog = {
        dateKey,
        taken: true,
        takenTime: timeString,
        alertSent: false,
      };

      // Salvar no Firestore
      await FirestoreService.saveDailyLog(dateKey, newLog);

      // Cancelar notificação local (já foi tomada)
      await NotificationService.cancelAllNotifications();

      Alert.alert("Pílula Registrada! ✅", `Tomada às ${timeString}`, [
        { text: "OK" },
      ]);
    } catch (error) {
      console.error("❌ Erro ao registrar pílula:", error);
      Alert.alert(
        "Erro",
        "Não foi possível registrar a pílula. Tente novamente.",
        [{ text: "OK" }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  const navigateToHistory = () => {
    router.push(`/${ScreenName.CalendarHistory}`);
  };

  const getStatusText = () => {
    if (!dailyLog) return "Aguardando...";
    return dailyLog.taken ? "Pílula Tomada" : "Pílula Pendente";
  };

  const getStatusColor = () => {
    if (!dailyLog) return AppColors.text;
    return dailyLog.taken ? AppColors.success : AppColors.alert;
  };

  return (
    <SafeAreaView style={styles.container}>
      <AppHeader title="Lembrete Diário" />

      <View style={styles.content}>
        {/* Status do dia */}
        <View style={styles.statusSection}>
          <Text style={styles.statusTitle}>Status de Hoje</Text>
          <StatusCard
            taken={dailyLog?.taken || false}
            takenTime={dailyLog?.takenTime}
          />
        </View>

        {/* Botão de ação */}
        <View style={styles.actionSection}>
          {!dailyLog?.taken ? (
            <PrimaryButton
              title="Registrar Pílula Tomada"
              onPress={handlePillTaken}
              disabled={isLoading}
              style={styles.actionButton}
            />
          ) : (
            <View style={styles.completedContainer}>
              <Text style={styles.completedText}>
                ✅ Pílula já registrada hoje!
              </Text>
              <Text style={styles.completedTime}>
                Tomada às {dailyLog.takenTime}
              </Text>
            </View>
          )}
        </View>

        {/* Botão de histórico */}
        <View style={styles.historySection}>
          <PrimaryButton
            title="Ver Histórico"
            onPress={navigateToHistory}
            style={styles.historyButton}
          />
        </View>

        {/* Informações */}
        <View style={styles.infoSection}>
          <Text style={styles.infoText}>
            💡 Você receberá um lembrete às 20:00 todos os dias.
          </Text>
          <Text style={styles.infoText}>
            📱 O seu amor 💖 será notificado às 22:00 se você não registrar a
            pílula.
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
    marginBottom: 32,
  },
  statusTitle: {
    ...Typography.h2,
    color: AppColors.text,
    marginBottom: 16,
    textAlign: "center",
  },
  actionSection: {
    marginBottom: 32,
  },
  actionButton: {
    minHeight: 60,
  },
  completedContainer: {
    backgroundColor: AppColors.white,
    padding: 24,
    borderRadius: 12,
    alignItems: "center",
    shadowColor: AppColors.text,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  completedText: {
    ...Typography.status,
    color: AppColors.success,
    marginBottom: 8,
  },
  completedTime: {
    ...Typography.body,
    color: AppColors.text,
    opacity: 0.7,
  },
  historySection: {
    marginBottom: 32,
  },
  historyButton: {
    minHeight: 50,
    backgroundColor: AppColors.text,
  },
  infoSection: {
    marginTop: "auto",
  },
  infoText: {
    ...Typography.caption,
    color: AppColors.text,
    textAlign: "center",
    marginBottom: 8,
    opacity: 0.6,
  },
});
