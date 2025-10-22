import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";

import { AppHeader } from "@/components/AppHeader";
import { Button } from "@/components/Button";
import { ObservationsSelector } from "@/components/ObservationsSelector";
import { StatusCard } from "@/components/StatusCard";
import { AppColors, Typography } from "@/constants/theme";
import { AuthService } from "@/src/services/authService";
import { FirestoreService } from "@/src/services/firestoreService";
import { NotificationService } from "@/src/services/notificationService";
import { DailyLog, ObservationType, ScreenName } from "@/src/types";

export default function MainGFScreen() {
  const [dailyLog, setDailyLog] = useState<DailyLog | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedObservations, setSelectedObservations] = useState<
    ObservationType[]
  >([]);

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

      // Agendar notificações semanais para 20:00
      await NotificationService.scheduleWeeklyNotifications();

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
        observations: selectedObservations,
      };

      // Salvar no Firestore
      await FirestoreService.saveDailyLog(dateKey, newLog);

      // Cancelar notificação de hoje (já foi tomada)
      await NotificationService.cancelTodayNotification();

      Alert.alert("Pílula Registrada! ✅", `Tomada às ${timeString}`, [
        { text: "OK" },
      ]);

      // Limpar observações selecionadas após salvar
      setSelectedObservations([]);
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

  const handleToggleObservation = (observation: ObservationType) => {
    setSelectedObservations((prev) =>
      prev.includes(observation)
        ? prev.filter((obs) => obs !== observation)
        : [...prev, observation]
    );
  };

  return (
    <View style={styles.container}>
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

        {/* Seleção de observações */}
        {!dailyLog?.taken && (
          <View style={styles.observationsSection}>
            <ObservationsSelector
              selectedObservations={selectedObservations}
              onToggleObservation={handleToggleObservation}
            />
          </View>
        )}

        {/* Botão de ação */}
        <View style={styles.actionSection}>
          {!dailyLog?.taken ? (
            <Button
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
          <Button
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
  observationsSection: {
    marginBottom: 24,
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
