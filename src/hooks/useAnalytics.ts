import { eachDayOfInterval, format, parseISO } from "date-fns";
import { useEffect, useMemo, useState } from "react";

import {
  getObservationField,
  SCALE_FIELDS,
} from "@/constants/observations";
import { FirestoreService } from "@/src/services/firestoreService";
import { DailyLog, ObservationType, ObservationValue } from "@/src/types";
import { getPillDateKey } from "@/src/utils/dateUtils";

export interface ObservationCount {
  type: ObservationType;
  count: number;
}

export interface ScaleLevelCount {
  value: number;
  label: string;
  emoji: string;
  count: number;
}

export interface ScaleDistribution {
  id: ObservationType;
  label: string;
  emoji: string;
  levels: ScaleLevelCount[];
  average: number | null;
  total: number;
}

export interface AnalyticsData {
  isLoading: boolean;
  totalDays: number;
  takenCount: number;
  missedCount: number;
  adherencePercent: number;
  currentStreak: number;
  maxStreak: number;
  observationCounts: ObservationCount[];
  scaleDistributions: ScaleDistribution[];
  averageTakenTime: string | null;
  timeDistribution: { morning: number; afternoon: number; evening: number };
  pillTypeCounts: { active: number; placebo: number };
}

const EMPTY_RESULT: AnalyticsData = {
  isLoading: true,
  totalDays: 0,
  takenCount: 0,
  missedCount: 0,
  adherencePercent: 0,
  currentStreak: 0,
  maxStreak: 0,
  observationCounts: [],
  scaleDistributions: [],
  averageTakenTime: null,
  timeDistribution: { morning: 0, afternoon: 0, evening: 0 },
  pillTypeCounts: { active: 0, placebo: 0 },
};

export function useAnalytics(
  startDateKey: string,
  endDateKey: string
): AnalyticsData {
  const [logs, setLogs] = useState<DailyLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setIsLoading(true);
      try {
        const data = await FirestoreService.getLogsByDateRange(
          startDateKey,
          endDateKey
        );
        if (!cancelled) setLogs(data);
      } catch (error) {
        console.error("❌ Erro ao carregar dados de análise:", error);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [startDateKey, endDateKey]);

  return useMemo((): AnalyticsData => {
    if (isLoading) return EMPTY_RESULT;

    const todayKey = getPillDateKey();
    const logMap = new Map<string, DailyLog>(logs.map((l) => [l.dateKey, l]));

    // All days in range
    const allDays = eachDayOfInterval({
      start: parseISO(startDateKey),
      end: parseISO(endDateKey),
    });
    const totalDays = allDays.length;

    const todayTaken = logMap.get(todayKey)?.taken === true;

    // Taken / missed — ignora hoje se ainda não foi tomado
    let takenCount = 0;
    let missedCount = 0;
    for (const day of allDays) {
      const key = format(day, "yyyy-MM-dd");
      if (key > todayKey) continue;
      if (key === todayKey && !todayTaken) continue;
      if (logMap.get(key)?.taken) takenCount++;
      else missedCount++;
    }

    const adherencePercent =
      takenCount + missedCount > 0
        ? Math.round((takenCount / (takenCount + missedCount)) * 100)
        : 0;

    // Streaks — exclui hoje se ainda não tomado
    const pastDays = allDays
      .filter((d) => {
        const key = format(d, "yyyy-MM-dd");
        if (key > todayKey) return false;
        if (key === todayKey && !todayTaken) return false;
        return true;
      })
      .sort((a, b) => b.getTime() - a.getTime());

    let currentStreak = 0;
    for (const day of pastDays) {
      if (logMap.get(format(day, "yyyy-MM-dd"))?.taken) currentStreak++;
      else break;
    }

    let maxStreak = 0;
    let tempStreak = 0;
    for (const day of [...pastDays].reverse()) {
      if (logMap.get(format(day, "yyyy-MM-dd"))?.taken) {
        tempStreak++;
        if (tempStreak > maxStreak) maxStreak = tempStreak;
      } else {
        tempStreak = 0;
      }
    }

    // Observation counts (only days where pill was taken)
    // Toggles -> contagem de presença; Escalas -> coleta de valores numéricos
    const obsMap = new Map<ObservationType, number>();
    const scaleValues = new Map<ObservationType, number[]>();
    for (const log of logs) {
      if (!log.taken || !log.observations) continue;
      for (const [rawId, value] of Object.entries(log.observations) as [
        ObservationType,
        ObservationValue,
      ][]) {
        const field = getObservationField(rawId);
        if (!field) continue; // ignora ids legados/desconhecidos
        if (field.kind === "toggle") {
          if (value === true) obsMap.set(rawId, (obsMap.get(rawId) ?? 0) + 1);
        } else if (field.kind === "scale" && typeof value === "number") {
          const arr = scaleValues.get(rawId) ?? [];
          arr.push(value);
          scaleValues.set(rawId, arr);
        }
      }
    }
    const observationCounts: ObservationCount[] = Array.from(obsMap.entries())
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count);

    // Distribuição por nível para cada campo de escala (ex.: estresse)
    const scaleDistributions: ScaleDistribution[] = SCALE_FIELDS.map(
      (field) => {
        const vals = scaleValues.get(field.id) ?? [];
        const levels: ScaleLevelCount[] = (field.levels ?? []).map((lvl) => ({
          value: lvl.value,
          label: lvl.label,
          emoji: lvl.emoji,
          count: vals.filter((v) => v === lvl.value).length,
        }));
        const average = vals.length
          ? vals.reduce((a, b) => a + b, 0) / vals.length
          : null;
        return {
          id: field.id,
          label: field.label,
          emoji: field.emoji,
          levels,
          average,
          total: vals.length,
        };
      }
    );

    // Time analysis
    const takenLogs = logs.filter((l) => l.taken && l.takenTime);
    let totalMinutes = 0;
    const timeDistribution = { morning: 0, afternoon: 0, evening: 0 };

    for (const log of takenLogs) {
      const [h, m] = log.takenTime!.split(":").map(Number);
      totalMinutes += h * 60 + m;
      if (h < 12) timeDistribution.morning++;
      else if (h < 18) timeDistribution.afternoon++;
      else timeDistribution.evening++;
    }

    let averageTakenTime: string | null = null;
    if (takenLogs.length > 0) {
      const avg = Math.round(totalMinutes / takenLogs.length);
      averageTakenTime = `${String(Math.floor(avg / 60)).padStart(2, "0")}:${String(avg % 60).padStart(2, "0")}`;
    }

    // Pill type counts
    const pillTypeCounts = { active: 0, placebo: 0 };
    for (const log of logs) {
      if (!log.taken) continue;
      if (log.pillType === "placebo") pillTypeCounts.placebo++;
      else pillTypeCounts.active++;
    }

    return {
      isLoading: false,
      totalDays,
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
    };
  }, [isLoading, logs, startDateKey, endDateKey]);
}
