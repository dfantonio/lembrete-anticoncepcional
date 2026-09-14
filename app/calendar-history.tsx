import { router } from "expo-router";
import React, { useState } from "react";
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
import { useCalendarHistory } from "@/src/hooks/useCalendarHistory";
import { DailyLog } from "@/src/types";

export default function CalendarHistoryScreen() {
  const { colors, theme } = useAppTheme();
  const {
    isInitialLoading,
    isVisibleMonthLoading,
    markedDates,
    menstruationInfo,
    onMonthChange,
    getDailyLogForDate,
    refreshMonthForDateKey,
  } = useCalendarHistory({ colors });

  const [modalVisible, setModalVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedDailyLog, setSelectedDailyLog] = useState<DailyLog | null>(
    null
  );

  const handleDayPress = async (day: { dateString: string }) => {
    const dateKey = day.dateString;
    setSelectedDate(dateKey);

    try {
      const log = await getDailyLogForDate(dateKey);
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
    if (selectedDate) refreshMonthForDateKey(selectedDate);
    handleModalClose();
  };

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

  if (isInitialLoading) {
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
          {!!isVisibleMonthLoading && (
            <View style={styles.monthLoadingRow}>
              <ActivityIndicator size="small" color={colors.action} />
              <Text style={[styles.monthLoadingText, { color: colors.text }]}>
                Carregando mês...
              </Text>
            </View>
          )}
          <Calendar
            key={`calendar-${theme}`} // Força re-render quando tema muda
            style={styles.calendar}
            theme={calendarTheme}
            markedDates={markedDates}
            markingType="custom"
            hideExtraDays
            showWeekNumbers={false}
            disableMonthChange={false}
            hideArrows={false}
            enableSwipeMonths
            onDayPress={handleDayPress}
            onMonthChange={onMonthChange}
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
    ...Typography.h1,
    textAlign: "center",
    marginBottom: 8,
  },
  menstruationCard: {
    alignItems: "center",
  },
  menstruationNumber: {
    ...Typography.h1,
    marginBottom: 8,
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
  monthLoadingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingTop: 12,
    paddingBottom: 4,
  },
  monthLoadingText: {
    ...Typography.body,
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
