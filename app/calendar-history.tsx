import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Calendar } from "react-native-calendars";

import { AppHeader } from "@/components/AppHeader";
import { DayDetailsModal } from "@/components/DayDetailsModal";
import { Typography } from "@/constants/theme";
import { useAppTheme } from "@/src/contexts/ThemeContext";
import { FirestoreService } from "@/src/services/firestoreService";
import { DailyLog } from "@/src/types";
import { formatDateKey } from "@/src/utils/dateUtils";

export default function CalendarHistoryScreen() {
  const { colors, theme } = useAppTheme();
  const [dailyLogs, setDailyLogs] = useState<DailyLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedDailyLog, setSelectedDailyLog] = useState<DailyLog | null>(
    null
  );

  useEffect(() => {
    loadHistoryData();
  }, []);

  const loadHistoryData = async () => {
    try {
      setIsLoading(true);
      const logs = await FirestoreService.getRecentLogs(30);
      setDailyLogs(logs);
    } catch (error) {
      console.error("❌ Erro ao carregar histórico:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDayPress = async (day: any) => {
    const dateKey = day.dateString;
    setSelectedDate(dateKey);

    try {
      const log = await FirestoreService.getDailyLog(dateKey);
      setSelectedDailyLog(log);
      setModalVisible(true);
    } catch (error) {
      console.error("❌ Erro ao carregar dados do dia:", error);
    }
  };

  const handleModalClose = () => {
    setModalVisible(false);
    setSelectedDate(null);
    setSelectedDailyLog(null);
  };

  const handleDataChanged = () => {
    loadHistoryData();
    handleModalClose();
  };

  const getMarkedDates = () => {
    const marked: { [key: string]: any } = {};

    dailyLogs.forEach((log) => {
      if (log.taken) {
        // Determinar cor baseada no tipo de pílula
        const pillColor =
          log.pillType === "placebo" ? colors.placebo : colors.success;

        marked[log.dateKey] = {
          marked: true,
          dotColor: pillColor,
          customStyles: {
            container: {
              backgroundColor: pillColor,
              borderRadius: 16,
            },
            text: {
              color: colors.white,
              fontWeight: "bold",
            },
          },
        };
      } else {
        marked[log.dateKey] = {
          marked: true,
          dotColor: colors.alert,
          customStyles: {
            container: {
              backgroundColor: colors.alert,
              borderRadius: 16,
            },
            text: {
              color: colors.white,
              fontWeight: "bold",
            },
          },
        };
      }
    });

    // Destacar dia atual
    const today = formatDateKey();
    if (marked[today]) {
      marked[today].customStyles.container.borderColor = colors.action;
      marked[today].customStyles.container.borderWidth = 2;
    } else {
      marked[today] = {
        customStyles: {
          container: {
            borderColor: colors.action,
            borderWidth: 2,
            borderRadius: 16,
          },
        },
      };
    }

    return marked;
  };

  const calculateDaysToMenstruation = () => {
    if (dailyLogs.length === 0) {
      return {
        daysRemaining: null,
        message: "Nenhum histórico encontrado",
        hasData: false,
      };
    }

    // Ordenar logs por data (mais recente primeiro)
    const sortedLogs = [...dailyLogs].sort(
      (a, b) => new Date(b.dateKey).getTime() - new Date(a.dateKey).getTime()
    );

    // Buscar último placebo registrado
    const lastPlaceboIndex = sortedLogs.findIndex(
      (log) => log.taken && log.pillType === "placebo"
    );

    if (lastPlaceboIndex === -1) {
      // Se não há placebo registrado, assumir que está no início do ciclo
      // Contar dias ativos tomados
      const activeDays = sortedLogs.filter(
        (log) => log.taken && log.pillType === "active"
      ).length;

      const daysRemaining = Math.max(0, 24 - activeDays);

      return {
        daysRemaining,
        message:
          daysRemaining > 0
            ? `${daysRemaining} dias de ativos restantes`
            : "Próximo placebo em breve",
        hasData: true,
      };
    }

    // Calcular dias desde o último placebo
    const lastPlaceboDate = new Date(sortedLogs[lastPlaceboIndex].dateKey);
    const today = new Date();
    const daysSincePlacebo = Math.floor(
      (today.getTime() - lastPlaceboDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Ciclo: 4 dias placebo + 24 dias ativos = 28 dias total
    const cyclePosition = daysSincePlacebo % 28;

    if (cyclePosition < 4) {
      // Ainda nos dias de placebo
      return {
        daysRemaining: 0,
        message: "Período de placebo",
        hasData: true,
      };
    } else if (cyclePosition < 28) {
      // Nos dias ativos
      const activeDaysRemaining = 28 - cyclePosition;
      return {
        daysRemaining: activeDaysRemaining,
        message: `${activeDaysRemaining} dias até menstruar`,
        hasData: true,
      };
    } else {
      // Ciclo completo, próximo placebo
      return {
        daysRemaining: 0,
        message: "Próximo placebo em breve",
        hasData: true,
      };
    }
  };

  const menstruationInfo = calculateDaysToMenstruation();

  const calendarTheme = {
    backgroundColor: colors.surface,
    calendarBackground: colors.surface,
    textSectionTitleColor: colors.text,
    selectedDayBackgroundColor: colors.action,
    selectedDayTextColor: colors.white,
    todayTextColor: colors.action,
    dayTextColor: colors.text,
    textDisabledColor: colors.textSecondary,
    dotColor: colors.action,
    selectedDotColor: colors.white,
    arrowColor: colors.action,
    monthTextColor: colors.text,
    indicatorColor: colors.action,
    textDayFontWeight: "400" as const,
    textMonthFontWeight: "600" as const,
    textDayHeaderFontWeight: "600" as const,
    textDayFontSize: 16,
    textMonthFontSize: 18,
    textDayHeaderFontSize: 14,
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.base }]}>
        <AppHeader
          title="Histórico"
          showBack
          onBack={() => router.back()}
          showThemeToggle
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.action} />
          <Text style={[styles.loadingText, { color: colors.text }]}>
            Carregando histórico...
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.base }]}>
      <AppHeader
        title="Histórico"
        showBack
        onBack={() => router.back()}
        showThemeToggle
      />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Estatísticas */}
        <View
          style={[
            styles.statsContainer,
            { backgroundColor: colors.surface, shadowColor: colors.text },
          ]}
        >
          <Text style={[styles.statsTitle, { color: colors.text }]}>
            Ciclo Atual
          </Text>
          <View style={styles.menstruationCard}>
            <Text style={[styles.menstruationNumber, { color: colors.action }]}>
              {menstruationInfo.daysRemaining !== null
                ? menstruationInfo.daysRemaining
                : "?"}
            </Text>
            <Text style={[styles.menstruationLabel, { color: colors.text }]}>
              {menstruationInfo.message}
            </Text>
            {!menstruationInfo.hasData && (
              <Text
                style={[
                  styles.menstruationSubtext,
                  { color: colors.textSecondary },
                ]}
              >
                Registre alguns dias para ver o progresso do seu ciclo
              </Text>
            )}
          </View>
        </View>

        {/* Calendário */}
        <View
          style={[
            styles.calendarContainer,
            { backgroundColor: colors.surface, shadowColor: colors.text },
          ]}
        >
          <Calendar
            key={`calendar-${theme}`} // Força re-render quando tema muda
            style={styles.calendar}
            theme={calendarTheme}
            markedDates={getMarkedDates()}
            markingType="custom"
            hideExtraDays
            showWeekNumbers={false}
            disableMonthChange
            hideArrows={false}
            onDayPress={handleDayPress}
            renderHeader={(date) => {
              const month = date.toString("MMMM yyyy");
              return (
                <Text style={[styles.calendarHeader, { color: colors.text }]}>
                  {month.charAt(0).toUpperCase() + month.slice(1)}
                </Text>
              );
            }}
          />
        </View>

        {/* Legenda */}
        <View
          style={[
            styles.legendContainer,
            { backgroundColor: colors.surface, shadowColor: colors.text },
          ]}
        >
          <Text style={[styles.legendTitle, { color: colors.text }]}>
            Legenda
          </Text>
          <View style={styles.legendItems}>
            <View style={styles.legendItem}>
              <View
                style={[styles.legendDot, { backgroundColor: colors.success }]}
              />
              <Text style={[styles.legendText, { color: colors.text }]}>
                Ativo tomado
              </Text>
            </View>
            <View style={styles.legendItem}>
              <View
                style={[styles.legendDot, { backgroundColor: colors.placebo }]}
              />
              <Text style={[styles.legendText, { color: colors.text }]}>
                Placebo tomado
              </Text>
            </View>
            <View style={styles.legendItem}>
              <View
                style={[styles.legendDot, { backgroundColor: colors.alert }]}
              />
              <Text style={[styles.legendText, { color: colors.text }]}>
                Pílula perdida
              </Text>
            </View>
            <View style={styles.legendItem}>
              <View
                style={[
                  styles.legendDot,
                  {
                    backgroundColor: "transparent",
                    borderColor: colors.action,
                    borderWidth: 2,
                  },
                ]}
              />
              <Text style={[styles.legendText, { color: colors.text }]}>
                Dia atual
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Modal de detalhes */}
      <DayDetailsModal
        visible={modalVisible}
        onClose={handleModalClose}
        dailyLog={selectedDailyLog}
        dateKey={selectedDate}
        onDataChanged={handleDataChanged}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  statsContainer: {
    padding: 20,
    borderRadius: 12,
    marginVertical: 16,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  statsTitle: {
    ...Typography.h2,
    textAlign: "center",
    marginBottom: 16,
  },
  menstruationCard: {
    alignItems: "center",
    paddingVertical: 8,
  },
  menstruationNumber: {
    ...Typography.h1,
    marginBottom: 8,
    fontSize: 48,
  },
  menstruationLabel: {
    ...Typography.h2,
    textAlign: "center",
    marginBottom: 4,
  },
  menstruationSubtext: {
    ...Typography.caption,
    textAlign: "center",
    opacity: 0.7,
    marginTop: 8,
  },
  calendarContainer: {
    borderRadius: 12,
    marginBottom: 16,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  calendar: {
    borderRadius: 12,
  },
  calendarHeader: {
    ...Typography.h2,
    textAlign: "center",
    marginVertical: 16,
  },
  legendContainer: {
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  legendTitle: {
    ...Typography.h2,
    marginBottom: 16,
  },
  legendItems: {
    gap: 12,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  legendDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 12,
  },
  legendText: {
    ...Typography.body,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  loadingText: {
    ...Typography.body,
    marginTop: 16,
    textAlign: "center",
  },
});
