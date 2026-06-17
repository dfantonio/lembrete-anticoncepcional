import { eachDayOfInterval, format, parseISO, subMonths } from "date-fns";
import { router } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Calendar } from "react-native-calendars";
import { MarkedDates } from "react-native-calendars/src/types";
import { BarChart } from "react-native-gifted-charts";
import { SafeAreaView } from "react-native-safe-area-context";

import { AppHeader } from "@/components/AppHeader";
import { getObservationField } from "@/constants/observations";
import { getColors, Typography } from "@/constants/theme";
import { useAppTheme } from "@/src/contexts/ThemeContext";
import { useAnalytics } from "@/src/hooks/useAnalytics";
import { formatDateKey, getPillDateKey } from "@/src/utils/dateUtils";

type PeriodPreset = "1M" | "3M" | "6M" | "1A";

const PRESETS: { key: PeriodPreset; label: string; months: number }[] = [
  { key: "1M", label: "1M", months: 1 },
  { key: "3M", label: "3M", months: 3 },
  { key: "6M", label: "6M", months: 6 },
  { key: "1A", label: "1A", months: 12 },
];

function getDateRange(months: number): {
  startDateKey: string;
  endDateKey: string;
} {
  const today = new Date();
  return {
    startDateKey: formatDateKey(subMonths(today, months)),
    endDateKey: getPillDateKey(today),
  };
}

function formatPeriodLabel(startDateKey: string, endDateKey: string): string {
  const fmt = (key: string) => {
    const [y, m, d] = key.split("-");
    return `${d}/${m}/${y}`;
  };
  return `${fmt(startDateKey)} – ${fmt(endDateKey)}`;
}

function buildPeriodMarks(
  start: string | null,
  end: string | null,
  actionColor: string,
  white: string,
): MarkedDates {
  if (!start) return {};

  if (!end) {
    return {
      [start]: {
        startingDay: true,
        endingDay: true,
        color: actionColor,
        textColor: white,
      },
    };
  }

  const marks: MarkedDates = {};
  const days = eachDayOfInterval({
    start: parseISO(start),
    end: parseISO(end),
  });

  for (const day of days) {
    const key = format(day, "yyyy-MM-dd");
    const isStart = key === start;
    const isEnd = key === end;
    marks[key] = {
      startingDay: isStart,
      endingDay: isEnd,
      color: isStart || isEnd ? actionColor : actionColor + "55",
      textColor: white,
    };
  }

  return marks;
}

export default function AnalyticsScreen() {
  const { colors } = useAppTheme();
  const [period, setPeriod] = useState<PeriodPreset>("3M");
  const [isCustom, setIsCustom] = useState(false);
  const [customStart, setCustomStart] = useState<string | null>(null);
  const [customEnd, setCustomEnd] = useState<string | null>(null);

  // Date picker modal state
  const [showPicker, setShowPicker] = useState(false);
  const [pickingStep, setPickingStep] = useState<"start" | "end">("start");
  const [tempStart, setTempStart] = useState<string | null>(null);
  const [tempEnd, setTempEnd] = useState<string | null>(null);

  const selectedPreset = PRESETS.find((p) => p.key === period)!;
  const { startDateKey, endDateKey } = useMemo(() => {
    if (isCustom && customStart && customEnd) {
      return { startDateKey: customStart, endDateKey: customEnd };
    }
    return getDateRange(selectedPreset.months);
  }, [isCustom, customStart, customEnd, selectedPreset.months]);

  const todayKey = getPillDateKey();

  const openPicker = () => {
    setTempStart(isCustom ? customStart : null);
    setTempEnd(isCustom ? customEnd : null);
    setPickingStep(isCustom && customStart ? "end" : "start");
    setShowPicker(true);
  };

  const handlePickerDayPress = (day: { dateString: string }) => {
    const key = day.dateString;
    if (pickingStep === "start") {
      setTempStart(key);
      setTempEnd(null);
      setPickingStep("end");
    } else {
      if (key < tempStart!) {
        setTempStart(key);
        setTempEnd(null);
        setPickingStep("end");
      } else {
        setTempEnd(key);
      }
    }
  };

  const confirmCustomRange = () => {
    if (!tempStart || !tempEnd) return;
    setCustomStart(tempStart);
    setCustomEnd(tempEnd);
    setIsCustom(true);
    setShowPicker(false);
  };

  const selectPreset = (key: PeriodPreset) => {
    setPeriod(key);
    setIsCustom(false);
  };

  const {
    isLoading,
    takenCount,
    missedCount,
    adherencePercent,
    currentStreak,
    maxStreak,
    observationCounts,
    scaleDistributions,
    averageTakenTime,
    timeDistribution,
    pillTypeCounts,
  } = useAnalytics(startDateKey, endDateKey);

  const BAR_WIDTH = 27;
  const BAR_SPACING = 8;

  const chartData = useMemo(() => {
    return observationCounts.map((obs) => {
      const emoji = getObservationField(obs.type)?.emoji ?? "•";
      return {
        value: obs.count,
        label: emoji,
        frontColor: colors.action,
        topLabelComponent: () => (
          <Text
            style={{
              color: colors.textSecondary,
              fontSize: 11,
              marginBottom: 2,
            }}
          >
            {obs.count}
          </Text>
        ),
      };
    });
  }, [observationCounts, colors]);

  const hasTaken = takenCount > 0;
  const hasObservations = observationCounts.length > 0;

  const cardStyle = [
    styles.card,
    { backgroundColor: colors.surface, shadowColor: colors.text },
  ];

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.base }]}
      contentContainerStyle={styles.content}
    >
      <AppHeader
        title="Análises"
        showBack
        onBack={() => router.back()}
        showThemeToggle
      />

      {/* Period selector */}
      <View style={styles.periodSection}>
        <View style={styles.periodRow}>
          {PRESETS.map((p) => (
            <TouchableOpacity
              key={p.key}
              onPress={() => selectPreset(p.key)}
              style={[
                styles.periodButton,
                {
                  backgroundColor:
                    !isCustom && period === p.key
                      ? colors.action
                      : colors.surface,
                  borderColor: colors.border,
                },
              ]}
            >
              <Text
                style={[
                  styles.periodButtonText,
                  {
                    color:
                      !isCustom && period === p.key
                        ? colors.white
                        : colors.text,
                  },
                ]}
              >
                {p.label}
              </Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity
            onPress={openPicker}
            style={[
              styles.periodButton,
              {
                backgroundColor: isCustom ? colors.action : colors.surface,
                borderColor: colors.border,
              },
            ]}
          >
            <Text
              style={[
                styles.periodButtonText,
                { color: isCustom ? colors.white : colors.text },
              ]}
            >
              ✎
            </Text>
          </TouchableOpacity>
        </View>
        <Text style={[styles.periodLabel, { color: colors.textSecondary }]}>
          {formatPeriodLabel(startDateKey, endDateKey)}
        </Text>
      </View>

      {/* Custom date range picker modal */}
      <Modal
        visible={showPicker}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowPicker(false)}
      >
        <SafeAreaView
          style={[styles.pickerContainer, { backgroundColor: colors.base }]}
        >
          <View style={styles.pickerHeader}>
            <Text style={[styles.pickerTitle, { color: colors.text }]}>
              Período personalizado
            </Text>
            <TouchableOpacity onPress={() => setShowPicker(false)}>
              <Text
                style={[styles.pickerClose, { color: colors.textSecondary }]}
              >
                ✕
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={[styles.pickerStep, { color: colors.action }]}>
            {pickingStep === "start"
              ? "Selecione a data de início"
              : tempEnd
                ? `${formatPeriodLabel(tempStart!, tempEnd)}`
                : `Início: ${formatPeriodLabel(tempStart!, tempStart!)} — Selecione o fim`}
          </Text>

          <Calendar
            markingType="period"
            markedDates={buildPeriodMarks(
              tempStart,
              tempEnd,
              colors.action,
              colors.white,
            )}
            maxDate={todayKey}
            onDayPress={handlePickerDayPress}
            theme={{
              backgroundColor: colors.base,
              calendarBackground: colors.base,
              textSectionTitleColor: colors.text,
              dayTextColor: colors.text,
              textDisabledColor: colors.textSecondary,
              monthTextColor: colors.text,
              arrowColor: colors.action,
              todayTextColor: colors.action,
            }}
          />

          <View style={styles.pickerFooter}>
            <TouchableOpacity
              onPress={confirmCustomRange}
              disabled={!tempStart || !tempEnd}
              style={[
                styles.pickerConfirm,
                {
                  backgroundColor:
                    tempStart && tempEnd ? colors.action : colors.border,
                },
              ]}
            >
              <Text style={[styles.pickerConfirmText, { color: colors.white }]}>
                Confirmar
              </Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.action} />
          <Text style={[styles.loadingText, { color: colors.text }]}>
            Carregando análises...
          </Text>
        </View>
      ) : (
        <>
          {/* Adherence card */}
          <View style={cardStyle}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>
              Adesão
            </Text>

            <View style={styles.adherenceRow}>
              <Text style={[styles.adherencePercent, { color: colors.action }]}>
                {adherencePercent}%
              </Text>
              <View style={styles.adherenceDetails}>
                <Text
                  style={[styles.adherenceDetail, { color: colors.success }]}
                >
                  {takenCount} tomadas
                </Text>
                <Text style={[styles.adherenceDetail, { color: colors.alert }]}>
                  {missedCount} perdidas
                </Text>
                <Text
                  style={[
                    styles.adherenceDetail,
                    { color: colors.textSecondary },
                  ]}
                >
                  {takenCount + missedCount} dias no período
                </Text>
              </View>
            </View>

            <View
              style={[styles.divider, { backgroundColor: colors.border }]}
            />

            <View style={styles.streakRow}>
              <View style={styles.streakItem}>
                <Text style={[styles.streakNumber, { color: colors.text }]}>
                  {currentStreak}
                </Text>
                <Text
                  style={[styles.streakLabel, { color: colors.textSecondary }]}
                >
                  Sequência atual
                </Text>
              </View>
              <View
                style={[
                  styles.streakDivider,
                  { backgroundColor: colors.border },
                ]}
              />
              <View style={styles.streakItem}>
                <Text style={[styles.streakNumber, { color: colors.text }]}>
                  {maxStreak}
                </Text>
                <Text
                  style={[styles.streakLabel, { color: colors.textSecondary }]}
                >
                  Maior sequência
                </Text>
              </View>
            </View>
          </View>

          {/* Observations chart */}
          {hasObservations && (
            <View style={cardStyle}>
              <Text style={[styles.cardTitle, { color: colors.text }]}>
                Sintomas e Observações
              </Text>
              <Text
                style={[styles.cardSubtitle, { color: colors.textSecondary }]}
              >
                Ocorrências no período
              </Text>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.chartScroll}
              >
                <BarChart
                  data={chartData}
                  width={(BAR_WIDTH + BAR_SPACING) * chartData.length + 40}
                  height={160}
                  noOfSections={3}
                  barBorderRadius={4}
                  hideRules
                  xAxisThickness={0}
                  yAxisThickness={0}
                  yAxisTextStyle={{
                    color: colors.textSecondary,
                    fontSize: 11,
                  }}
                  xAxisLabelsHeight={20}
                  xAxisLabelTextStyle={{ fontSize: 14 }}
                  barWidth={BAR_WIDTH}
                  spacing={BAR_SPACING}
                  isAnimated
                />
              </ScrollView>

              {/* Legend */}
              <View style={styles.legendContainer}>
                {observationCounts.map((obs) => {
                  const field = getObservationField(obs.type);
                  return (
                    <View key={obs.type} style={styles.legendItem}>
                      <Text style={styles.legendEmoji}>{field?.emoji}</Text>
                      <Text style={[styles.legendText, { color: colors.text }]}>
                        {field?.label ?? obs.type} — {obs.count}x
                      </Text>
                    </View>
                  );
                })}
              </View>
            </View>
          )}

          {/* Scale distributions (ex.: estresse) */}
          {scaleDistributions
            .filter((dist) => dist.total > 0)
            .map((dist) => (
              <View key={dist.id} style={cardStyle}>
                <Text style={[styles.cardTitle, { color: colors.text }]}>
                  {dist.emoji} {dist.label}
                </Text>
                <Text
                  style={[styles.cardSubtitle, { color: colors.textSecondary }]}
                >
                  {dist.average != null
                    ? `Média: ${dist.average.toFixed(1)} de ${
                        dist.levels.length
                      }`
                    : "Sem dados"}
                </Text>

                <View style={styles.legendContainer}>
                  {dist.levels.map((level) => {
                    const pct =
                      dist.total > 0
                        ? Math.round((level.count / dist.total) * 100)
                        : 0;
                    return (
                      <View key={level.value} style={styles.legendItem}>
                        <Text style={styles.legendEmoji}>{level.emoji}</Text>
                        <Text
                          style={[styles.legendText, { color: colors.text }]}
                        >
                          {level.label} — {level.count}x ({pct}%)
                        </Text>
                      </View>
                    );
                  })}
                </View>
              </View>
            ))}

          {/* Average time card */}
          {hasTaken && averageTakenTime && (
            <View style={cardStyle}>
              <Text style={[styles.cardTitle, { color: colors.text }]}>
                Horário de Ingestão
              </Text>

              <View style={styles.avgTimeRow}>
                <Text style={[styles.avgTime, { color: colors.action }]}>
                  {averageTakenTime}
                </Text>
                <Text
                  style={[styles.avgTimeLabel, { color: colors.textSecondary }]}
                >
                  horário médio
                </Text>
              </View>

              <View style={styles.timeDistRow}>
                <TimeBlock
                  emoji="☀️"
                  label="Manhã"
                  count={timeDistribution.morning}
                  total={takenCount}
                  colors={colors}
                />
                <TimeBlock
                  emoji="🌤️"
                  label="Tarde"
                  count={timeDistribution.afternoon}
                  total={takenCount}
                  colors={colors}
                />
                <TimeBlock
                  emoji="🌙"
                  label="Noite"
                  count={timeDistribution.evening}
                  total={takenCount}
                  colors={colors}
                />
              </View>
            </View>
          )}

          {/* Pill type card */}
          {hasTaken && (
            <View style={cardStyle}>
              <Text style={[styles.cardTitle, { color: colors.text }]}>
                Tipo de Pílula
              </Text>
              <View style={styles.pillTypeRow}>
                <PillTypeBlock
                  emoji="💊"
                  label="Ativo"
                  count={pillTypeCounts.active}
                  color={colors.success}
                  colors={colors}
                />
                <View
                  style={[
                    styles.streakDivider,
                    { backgroundColor: colors.border },
                  ]}
                />
                <PillTypeBlock
                  emoji="🟡"
                  label="Placebo"
                  count={pillTypeCounts.placebo}
                  color={colors.placebo}
                  colors={colors}
                />
              </View>
            </View>
          )}

          {!hasTaken && (
            <View
              style={[
                styles.emptyCard,
                { backgroundColor: colors.surface, shadowColor: colors.text },
              ]}
            >
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                Nenhum registro encontrado neste período
              </Text>
            </View>
          )}
        </>
      )}
    </ScrollView>
  );
}

function TimeBlock({
  emoji,
  label,
  count,
  total,
  colors,
}: {
  emoji: string;
  label: string;
  count: number;
  total: number;
  colors: ReturnType<typeof getColors>;
}) {
  const percent = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <View style={styles.timeBlock}>
      <Text style={styles.timeBlockEmoji}>{emoji}</Text>
      <Text style={[styles.timeBlockCount, { color: colors.text }]}>
        {count}
      </Text>
      <Text style={[styles.timeBlockLabel, { color: colors.textSecondary }]}>
        {label}
      </Text>
      <Text style={[styles.timeBlockPercent, { color: colors.textSecondary }]}>
        {percent}%
      </Text>
    </View>
  );
}

function PillTypeBlock({
  emoji,
  label,
  count,
  color,
  colors,
}: {
  emoji: string;
  label: string;
  count: number;
  color: string;
  colors: ReturnType<typeof getColors>;
}) {
  return (
    <View style={styles.pillTypeBlock}>
      <Text style={styles.pillTypeEmoji}>{emoji}</Text>
      <Text style={[styles.pillTypeCount, { color }]}>{count}</Text>
      <Text style={[styles.pillTypeLabel, { color: colors.textSecondary }]}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 20, paddingBottom: 40 },

  periodSection: { marginVertical: 16 },
  periodRow: { flexDirection: "row", gap: 8, marginBottom: 8 },
  periodButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center",
  },
  periodButtonText: {
    fontSize: 14,
    fontWeight: "600" as const,
    lineHeight: 20,
  },
  periodLabel: {
    ...Typography.caption,
    textAlign: "center",
  },

  loadingContainer: {
    paddingVertical: 60,
    alignItems: "center",
  },
  loadingText: {
    ...Typography.body,
    marginTop: 12,
  },

  card: {
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  cardTitle: {
    ...Typography.h2,
    fontSize: 20,
    marginBottom: 4,
  },
  cardSubtitle: {
    ...Typography.caption,
    marginBottom: 16,
  },

  adherenceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginTop: 8,
    marginBottom: 16,
  },
  adherencePercent: {
    fontSize: 52,
    fontWeight: "700" as const,
    lineHeight: 60,
  },
  adherenceDetails: { gap: 2 },
  adherenceDetail: { ...Typography.body },

  divider: { height: 1, marginBottom: 16 },

  streakRow: { flexDirection: "row" },
  streakItem: { flex: 1, alignItems: "center" },
  streakDivider: { width: 1 },
  streakNumber: {
    fontSize: 28,
    fontWeight: "700" as const,
    lineHeight: 36,
  },
  streakLabel: {
    ...Typography.caption,
    marginTop: 4,
    textAlign: "center",
  },

  chartScroll: { marginHorizontal: -4 },
  legendContainer: { marginTop: 12, gap: 6 },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 8 },
  legendEmoji: { fontSize: 16, lineHeight: 24 },
  legendText: { ...Typography.caption },

  avgTimeRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 8,
    marginTop: 8,
    marginBottom: 16,
  },
  avgTime: {
    fontSize: 40,
    fontWeight: "700" as const,
    lineHeight: 48,
  },
  avgTimeLabel: { ...Typography.body },

  timeDistRow: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  timeBlock: { alignItems: "center", gap: 4 },
  timeBlockEmoji: { fontSize: 24 },
  timeBlockCount: {
    fontSize: 22,
    fontWeight: "600" as const,
    lineHeight: 28,
  },
  timeBlockLabel: { ...Typography.caption },
  timeBlockPercent: { ...Typography.caption },

  pillTypeRow: {
    flexDirection: "row",
    marginTop: 12,
  },
  pillTypeBlock: { flex: 1, alignItems: "center", gap: 4 },
  pillTypeEmoji: { fontSize: 28 },
  pillTypeCount: {
    fontSize: 32,
    fontWeight: "700" as const,
    lineHeight: 40,
  },
  pillTypeLabel: { ...Typography.caption },

  pickerContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  pickerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
  },
  pickerTitle: {
    ...Typography.h2,
    fontSize: 20,
  },
  pickerClose: {
    fontSize: 20,
    padding: 4,
  },
  pickerStep: {
    ...Typography.body,
    textAlign: "center",
    marginBottom: 12,
    fontWeight: "600" as const,
  },
  pickerFooter: {
    padding: 20,
  },
  pickerConfirm: {
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
  },
  pickerConfirmText: {
    ...Typography.button,
  },

  emptyCard: {
    borderRadius: 12,
    padding: 40,
    marginBottom: 16,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
    alignItems: "center",
  },
  emptyText: {
    ...Typography.body,
    textAlign: "center",
  },
});
