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
import { SafeAreaView } from "react-native-safe-area-context";

import { AppHeader } from "@/components/AppHeader";
import { DayDetailsModal } from "@/components/DayDetailsModal";
import { AppColors, Typography } from "@/constants/theme";
import { FirestoreService } from "@/src/services/firestoreService";
import { DailyLog } from "@/src/types";

export default function CalendarHistoryScreen() {
  const [dailyLogs, setDailyLogs] = useState<DailyLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>("");
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
    setSelectedDate("");
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
        marked[log.dateKey] = {
          marked: true,
          dotColor: AppColors.success,
          customStyles: {
            container: {
              backgroundColor: AppColors.success,
              borderRadius: 16,
            },
            text: {
              color: AppColors.white,
              fontWeight: "bold",
            },
          },
        };
      } else {
        marked[log.dateKey] = {
          marked: true,
          dotColor: AppColors.alert,
          customStyles: {
            container: {
              backgroundColor: AppColors.alert,
              borderRadius: 16,
            },
            text: {
              color: AppColors.white,
              fontWeight: "bold",
            },
          },
        };
      }
    });

    // Destacar dia atual
    const today = new Date().toISOString().split("T")[0];
    if (marked[today]) {
      marked[today].customStyles.container.borderColor = AppColors.action;
      marked[today].customStyles.container.borderWidth = 2;
    } else {
      marked[today] = {
        customStyles: {
          container: {
            borderColor: AppColors.action,
            borderWidth: 2,
            borderRadius: 16,
          },
        },
      };
    }

    return marked;
  };

  const getStatistics = () => {
    const total = dailyLogs.length;
    const taken = dailyLogs.filter((log) => log.taken).length;
    const missed = total - taken;
    const percentage = total > 0 ? Math.round((taken / total) * 100) : 0;

    return { total, taken, missed, percentage };
  };

  const stats = getStatistics();

  const calendarTheme = {
    backgroundColor: AppColors.white,
    calendarBackground: AppColors.white,
    textSectionTitleColor: AppColors.text,
    selectedDayBackgroundColor: AppColors.action,
    selectedDayTextColor: AppColors.white,
    todayTextColor: AppColors.action,
    dayTextColor: AppColors.text,
    textDisabledColor: "#d9e1e8",
    dotColor: AppColors.action,
    selectedDotColor: AppColors.white,
    arrowColor: AppColors.action,
    monthTextColor: AppColors.text,
    indicatorColor: AppColors.action,
    textDayFontWeight: "400" as const,
    textMonthFontWeight: "600" as const,
    textDayHeaderFontWeight: "600" as const,
    textDayFontSize: 16,
    textMonthFontSize: 18,
    textDayHeaderFontSize: 14,
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <AppHeader title="Histórico" showBack onBack={() => router.back()} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={AppColors.action} />
          <Text style={styles.loadingText}>Carregando histórico...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <AppHeader title="Histórico" showBack onBack={() => router.back()} />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Estatísticas */}
        <View style={styles.statsContainer}>
          <Text style={styles.statsTitle}>Últimos 30 dias</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{stats.taken}</Text>
              <Text style={styles.statLabel}>Tomadas</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={[styles.statNumber, { color: AppColors.alert }]}>
                {stats.missed}
              </Text>
              <Text style={styles.statLabel}>Perdidas</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={[styles.statNumber, { color: AppColors.action }]}>
                {stats.percentage}%
              </Text>
              <Text style={styles.statLabel}>Taxa de Sucesso</Text>
            </View>
          </View>
        </View>

        {/* Calendário */}
        <View style={styles.calendarContainer}>
          <Calendar
            style={styles.calendar}
            theme={calendarTheme}
            markedDates={getMarkedDates()}
            markingType="custom"
            hideExtraDays
            firstDay={1} // Segunda-feira
            showWeekNumbers={false}
            disableMonthChange
            hideArrows={false}
            onDayPress={handleDayPress}
            renderHeader={(date) => {
              const month = date.toString("MMMM yyyy");
              return (
                <Text style={styles.calendarHeader}>
                  {month.charAt(0).toUpperCase() + month.slice(1)}
                </Text>
              );
            }}
          />
        </View>

        {/* Legenda */}
        <View style={styles.legendContainer}>
          <Text style={styles.legendTitle}>Legenda</Text>
          <View style={styles.legendItems}>
            <View style={styles.legendItem}>
              <View
                style={[
                  styles.legendDot,
                  { backgroundColor: AppColors.success },
                ]}
              />
              <Text style={styles.legendText}>Pílula tomada</Text>
            </View>
            <View style={styles.legendItem}>
              <View
                style={[styles.legendDot, { backgroundColor: AppColors.alert }]}
              />
              <Text style={styles.legendText}>Pílula perdida</Text>
            </View>
            <View style={styles.legendItem}>
              <View
                style={[
                  styles.legendDot,
                  {
                    backgroundColor: "transparent",
                    borderColor: AppColors.action,
                    borderWidth: 2,
                  },
                ]}
              />
              <Text style={styles.legendText}>Dia atual</Text>
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
  },
  statsContainer: {
    backgroundColor: AppColors.white,
    padding: 20,
    borderRadius: 12,
    marginVertical: 16,
    shadowColor: AppColors.text,
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
    color: AppColors.text,
    textAlign: "center",
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  statCard: {
    alignItems: "center",
  },
  statNumber: {
    ...Typography.status,
    color: AppColors.success,
    marginBottom: 4,
  },
  statLabel: {
    ...Typography.caption,
    color: AppColors.text,
    opacity: 0.7,
  },
  calendarContainer: {
    backgroundColor: AppColors.white,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: AppColors.text,
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
    color: AppColors.text,
    textAlign: "center",
    marginVertical: 16,
  },
  legendContainer: {
    backgroundColor: AppColors.white,
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: AppColors.text,
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
    color: AppColors.text,
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
    color: AppColors.text,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  loadingText: {
    ...Typography.body,
    color: AppColors.text,
    marginTop: 16,
    textAlign: "center",
  },
});
