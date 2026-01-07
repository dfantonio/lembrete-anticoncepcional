import { router } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, View } from "react-native";

import { AppHeader } from "@/components/AppHeader";
import { Button } from "@/components/Button";
import { ObservationsSelector } from "@/components/ObservationsSelector";
import { SplitButton } from "@/components/SplitButton";
import { StatusCard } from "@/components/StatusCard";
import { Typography } from "@/constants/theme";
import { useAppTheme } from "@/src/contexts/ThemeContext";
import { AuthService } from "@/src/services/authService";
import { FirestoreService } from "@/src/services/firestoreService";
import { NotificationService } from "@/src/services/notificationService";
import { StorageService } from "@/src/services/storageService";
import { DailyLog, ObservationType, PillType, ScreenName } from "@/src/types";
import { formatTimeString, getPillDateKey } from "@/src/utils/dateUtils";

export default function MainGFScreen() {
  const { colors } = useAppTheme();
  const [dailyLog, setDailyLog] = useState<DailyLog | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedObservations, setSelectedObservations] = useState<
    ObservationType[]
  >([]);
  const [selectedPillType, setSelectedPillType] = useState<PillType>("active");

  const initializeScreen = useCallback(async () => {
    try {
      // Verificar autenticação
      const userId = AuthService.getCurrentUserId();
      if (!userId) {
        router.replace(`/${ScreenName.RoleSelect}`);
        return;
      }

      // Carregar último tipo de pílula selecionado
      const lastPillType = await StorageService.getLastPillType();
      setSelectedPillType(lastPillType);

      // Solicitar permissões de notificação
      await NotificationService.requestPermissions();

      await NotificationService.scheduleWeeklyNotifications();

      // Observar mudanças no log diário
      const today = getPillDateKey(); // YYYY-MM-DD com virada às 03:00
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
      const dateKey = getPillDateKey(now); // YYYY-MM-DD com virada às 03:00
      console.log("dateKey", dateKey);
      const timeString = formatTimeString(now); // HH:MM no timezone local

      const newLog: DailyLog = {
        dateKey,
        taken: true,
        takenTime: timeString,
        alertSent: false,
        pillType: selectedPillType,
        observations: selectedObservations,
      };

      // Salvar no Firestore
      await FirestoreService.saveDailyLog(dateKey, newLog);

      // Salvar última escolha de tipo de pílula
      await StorageService.setLastPillType(selectedPillType);

      // Cancelar notificação de hoje (já foi tomada)
      // Usa o mesmo dateKey salvo para não cancelar o lembrete do "dia novo"
      // quando estiver registrando o dia anterior de madrugada.
      await NotificationService.cancelTodayNotification(dateKey);

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

  const handlePillTypeChange = (pillType: PillType) => {
    setSelectedPillType(pillType);
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
              <SplitButton
                pillType={selectedPillType}
                onSelect={handlePillTypeChange}
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
