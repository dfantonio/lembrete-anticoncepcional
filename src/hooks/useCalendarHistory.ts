import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { FirestoreService } from "@/src/services/firestoreService";
import { DailyLog } from "@/src/types";
import { getPillDateKey } from "@/src/utils/dateUtils";

type VisibleMonth = { year: number; month: number }; // month: 1-12

type MenstruationInfo = {
  daysRemaining: number | null;
  message: string;
  hasData: boolean;
};

type Colors = {
  alert: string;
  action: string;
  placebo: string;
  success: string;
  text: string;
  textSecondary: string;
  surface: string;
  white: string;
};

const pad2 = (n: number) => String(n).padStart(2, "0");
const getMonthKey = (year: number, month: number) => `${year}-${pad2(month)}`;

const getAdjacentMonth = (year: number, month: number, delta: number) => {
  const d = new Date(year, month - 1 + delta, 1);
  return { year: d.getFullYear(), month: d.getMonth() + 1 };
};

const getMonthRange = (year: number, month: number) => {
  const startDateKey = `${year}-${pad2(month)}-01`;
  const lastDay = new Date(year, month, 0).getDate(); // month é 1-12 aqui
  const endDateKey = `${year}-${pad2(month)}-${pad2(lastDay)}`;
  return { startDateKey, endDateKey, lastDay };
};

export function useCalendarHistory(options: {
  colors: Colors;
  prefetchAdjacentMonths?: boolean;
}) {
  const { colors, prefetchAdjacentMonths = true } = options;

  const [logsByDateKey, setLogsByDateKey] = useState<Record<string, DailyLog>>(
    {}
  );
  const [loadedMonths, setLoadedMonths] = useState<Record<string, boolean>>({});
  const [loadingMonths, setLoadingMonths] = useState<Record<string, boolean>>(
    {}
  );

  const loadedMonthsRef = useRef<Record<string, boolean>>({});
  const loadingMonthsRef = useRef<Record<string, boolean>>({});

  const [visibleMonth, setVisibleMonth] = useState<VisibleMonth>(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() + 1 };
  });

  const [isInitialLoading, setIsInitialLoading] = useState(true);

  const dailyLogs = useMemo(
    () => Object.values(logsByDateKey),
    [logsByDateKey]
  );

  useEffect(() => {
    loadedMonthsRef.current = loadedMonths;
  }, [loadedMonths]);

  useEffect(() => {
    loadingMonthsRef.current = loadingMonths;
  }, [loadingMonths]);

  const loadMonth = useCallback(
    async (year: number, month: number, opts?: { force?: boolean }) => {
      const monthKey = getMonthKey(year, month);
      const force = opts?.force ?? false;

      if (!force && loadedMonthsRef.current[monthKey]) return;
      if (loadingMonthsRef.current[monthKey]) return;

      try {
        setLoadingMonths((prev) => ({ ...prev, [monthKey]: true }));
        const { startDateKey, endDateKey } = getMonthRange(year, month);
        const logs = await FirestoreService.getLogsByDateRange(
          startDateKey,
          endDateKey
        );

        const monthPrefix = `${monthKey}-`; // YYYY-MM-
        setLogsByDateKey((prev) => {
          const next = { ...prev };
          if (force) {
            for (const k of Object.keys(next)) {
              if (k.startsWith(monthPrefix)) delete next[k];
            }
          }
          for (const log of logs) next[log.dateKey] = log;
          return next;
        });

        setLoadedMonths((prev) => ({ ...prev, [monthKey]: true }));
      } catch (error) {
        console.error("❌ Erro ao carregar mês do histórico:", error);
      } finally {
        setLoadingMonths((prev) => {
          const next = { ...prev };
          delete next[monthKey];
          return next;
        });
      }
    },
    []
  );

  useEffect(() => {
    const loadInitial = async () => {
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth() + 1;

      await loadMonth(year, month);
      setIsInitialLoading(false);

      if (prefetchAdjacentMonths) {
        const prev = getAdjacentMonth(year, month, -1);
        const next = getAdjacentMonth(year, month, 1);
        void loadMonth(prev.year, prev.month);
        void loadMonth(next.year, next.month);
      }
    };

    void loadInitial();
  }, [loadMonth, prefetchAdjacentMonths]);

  const isVisibleMonthLoading =
    !!loadingMonths[getMonthKey(visibleMonth.year, visibleMonth.month)];

  const onMonthChange = useCallback(
    (m: { year: number; month: number }) => {
      setVisibleMonth({ year: m.year, month: m.month });
      void loadMonth(m.year, m.month);

      if (prefetchAdjacentMonths) {
        const prev = getAdjacentMonth(m.year, m.month, -1);
        const next = getAdjacentMonth(m.year, m.month, 1);
        void loadMonth(prev.year, prev.month);
        void loadMonth(next.year, next.month);
      }
    },
    [loadMonth, prefetchAdjacentMonths]
  );

  const refreshMonthForDateKey = useCallback(
    (dateKey: string) => {
      const [y, m] = dateKey.split("-").map((v) => Number(v));
      if (!Number.isNaN(y) && !Number.isNaN(m)) {
        void loadMonth(y, m, { force: true });
      }
    },
    [loadMonth]
  );

  const getDailyLogForDate = useCallback(
    async (dateKey: string): Promise<DailyLog | null> => {
      const monthKey = dateKey.slice(0, 7); // YYYY-MM
      if (loadedMonthsRef.current[monthKey]) {
        return logsByDateKey[dateKey] ?? null;
      }

      const log = await FirestoreService.getDailyLog(dateKey);
      if (log) {
        setLogsByDateKey((prev) => ({ ...prev, [dateKey]: log }));
      }
      return log ?? null;
    },
    [logsByDateKey]
  );

  const markedDates = useMemo(() => {
    const marked: Record<string, any> = {};

    // Regra: dia sem doc = vermelho (dias anteriores a hoje; hoje/futuro neutro)
    const monthKey = getMonthKey(visibleMonth.year, visibleMonth.month);
    const { startDateKey, endDateKey, lastDay } = getMonthRange(
      visibleMonth.year,
      visibleMonth.month
    );
    const todayKey = getPillDateKey();

    for (let day = 1; day <= lastDay; day++) {
      const dateKey = `${monthKey}-${pad2(day)}`;
      if (dateKey >= todayKey) continue;

      marked[dateKey] = {
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

    dailyLogs
      .filter((log) => log.dateKey >= startDateKey && log.dateKey <= endDateKey)
      .forEach((log) => {
        if (log.taken) {
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

    // Destacar dia atual (borda) — sem pintar de "perdido" se não houver doc
    if (marked[todayKey]) {
      marked[todayKey].customStyles.container.borderColor = colors.action;
      marked[todayKey].customStyles.container.borderWidth = 2;
    } else {
      marked[todayKey] = {
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
  }, [colors, dailyLogs, visibleMonth.month, visibleMonth.year]);

  const menstruationInfo: MenstruationInfo = useMemo(() => {
    if (dailyLogs.length === 0) {
      return {
        daysRemaining: null,
        message: "Nenhum histórico encontrado",
        hasData: false,
      };
    }

    const sortedLogs = [...dailyLogs].sort(
      (a, b) => new Date(b.dateKey).getTime() - new Date(a.dateKey).getTime()
    );

    const lastPlaceboIndex = sortedLogs.findIndex(
      (log) => log.taken && log.pillType === "placebo"
    );

    if (lastPlaceboIndex === -1) {
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

    const lastPlaceboDate = new Date(sortedLogs[lastPlaceboIndex].dateKey);
    const today = new Date();
    const daysSincePlacebo = Math.floor(
      (today.getTime() - lastPlaceboDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    const cyclePosition = daysSincePlacebo % 28; // 4 placebo + 24 ativos

    if (cyclePosition < 4) {
      return { daysRemaining: 0, message: "Período de placebo", hasData: true };
    }

    const activeDaysRemaining = 28 - cyclePosition;
    return {
      daysRemaining: activeDaysRemaining,
      message: `${activeDaysRemaining} dias até menstruar`,
      hasData: true,
    };
  }, [dailyLogs]);

  return {
    isInitialLoading,
    visibleMonth,
    isVisibleMonthLoading,
    markedDates,
    menstruationInfo,
    onMonthChange,
    getDailyLogForDate,
    refreshMonthForDateKey,
  };
}
