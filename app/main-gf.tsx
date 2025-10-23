import { router } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, View } from "react-native";

import { AppHeader } from "@/components/AppHeader";
import { Button } from "@/components/Button";
import { ObservationsSelector } from "@/components/ObservationsSelector";
import { StatusCard } from "@/components/StatusCard";
import { Typography } from "@/constants/theme";
import { useAppTheme } from "@/src/contexts/ThemeContext";
import { AuthService } from "@/src/services/authService";
import { FirestoreService } from "@/src/services/firestoreService";
import { NotificationService } from "@/src/services/notificationService";
import { DailyLog, ObservationType, ScreenName } from "@/src/types";

export default function MainGFScreen() {
  const { colors } = useAppTheme();
  const [dailyLog, setDailyLog] = useState<DailyLog | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedObservations, setSelectedObservations] = useState<
    ObservationType[]
  >([]);

  const initializeScreen = useCallback(async () => {
    try {
      // Verificar autenticação
      const userId = AuthService.getCurrentUserId();
      if (!userId) {
        router.replace(`/${ScreenName.RoleSelect}`);
        return;
      }

      // Solicitar permissões de notificação
      await NotificationService.requestPermissions();

      await NotificationService.scheduleWeeklyNotifications();

      // Observar mudanças no log diário
      const today = getLocalDateString(new Date()); // YYYY-MM-DD no timezone local
      const unsubscribe = FirestoreService.watchDailyLog(today, (log) => {
        setDailyLog(log);
      });

      return unsubscribe;
    } catch (error) {
      console.error("❌ Erro na inicialização da tela GF:", error);
    }
  }, []);

  useEffect(() => {
    initializeScreen();
  }, [initializeScreen]);

  const handlePillTaken = async () => {
    try {
      setIsLoading(true);

      const userId = AuthService.getCurrentUserId();
      if (!userId) {
        throw new Error("Usuário não autenticado");
      }

      const now = new Date();
      const dateKey = getLocalDateString(now); // YYYY-MM-DD no timezone local
      const timeString = getLocalTimeString(now); // HH:MM no timezone local

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
    <ScrollView
      style={[styles.container, { backgroundColor: colors.base }]}
      contentContainerStyle={styles.contentContainer}
    >
      <AppHeader title="Lembrete Diário" showThemeToggle />

      <View style={styles.content}>
        <View style={styles.upperSection}>
          {/* Status do dia */}
          <View style={styles.statusSection}>
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
        </View>

        <View style={styles.lowerSection}>
          {/* Botão de ação */}
          <View style={styles.actionSection}>
            {!dailyLog?.taken && (
              <Button
                title="Registrar Pílula Tomada"
                onPress={handlePillTaken}
                disabled={isLoading}
                size="large"
              />
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
            <Text style={[styles.infoText, { color: colors.text }]}>
              💡 Você receberá um lembrete às 21:00 todos os dias.
            </Text>
            <Text style={[styles.infoText, { color: colors.text }]}>
              📱 O seu amor 💖 será notificado às 22:00 se você não registrar a
              pílula.
            </Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

// Função utilitária para obter a data no timezone local
const getLocalDateString = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

// Função utilitária para obter a hora no timezone local
const getLocalTimeString = (date: Date): string => {
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 8,
    justifyContent: "space-between",
  },

  upperSection: {},
  lowerSection: {},

  statusSection: {
    marginBottom: 16,
  },
  statusTitle: {
    ...Typography.h2,
    marginBottom: 16,
    textAlign: "center",
  },
  observationsSection: {
    marginBottom: 24,
  },
  actionSection: {
    marginBottom: 32,
  },
  completedContainer: {
    padding: 24,
    borderRadius: 12,
    alignItems: "center",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  completedText: {
    ...Typography.h1,
    marginBottom: 8,
  },
  completedTime: {
    ...Typography.body,
    opacity: 0.7,
  },
  historySection: {
    marginBottom: 32,
  },
  historyButton: {
    backgroundColor: "#333333", // Keep as fallback
  },
  infoSection: {
    marginTop: "auto",
  },
  infoText: {
    ...Typography.caption,
    textAlign: "center",
    marginBottom: 8,
    opacity: 0.6,
  },
});
