import { eachDayOfInterval, format, parseISO } from "date-fns";
import { useEffect, useMemo, useState } from "react";

import { OBSERVATION_EMOJIS } from "@/constants/observations";
import { FirestoreService } from "@/src/services/firestoreService";
import { DailyLog, ObservationType } from "@/src/types";
import { getPillDateKey } from "@/src/utils/dateUtils";

export interface ObservationCount {
  type: ObservationType;
  count: number;
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
    const obsMap = new Map<ObservationType, number>();
    for (const log of logs) {
      if (!log.taken || !log.observations) continue;
      for (const obs of log.observations) {
        // Ignora valores legados/inválidos que não existem nos mapas de observação
        if (!(obs in OBSERVATION_EMOJIS)) continue;
        obsMap.set(obs, (obsMap.get(obs) ?? 0) + 1);
      }
    }
    const observationCounts: ObservationCount[] = Array.from(obsMap.entries())
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count);

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
      averageTakenTime,
      timeDistribution,
      pillTypeCounts,
    };
  }, [isLoading, logs, startDateKey, endDateKey]);
}
