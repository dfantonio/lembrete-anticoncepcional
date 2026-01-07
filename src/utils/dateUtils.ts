import { format, isBefore, parseISO, startOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";

/**
 * Formata uma data para o formato YYYY-MM-DD.
 * Se nenhuma data for fornecida, usa a data atual
 */
export const formatDateKey = (date?: Date): string => {
  const targetDate = date || new Date();
  return format(targetDate, "yyyy-MM-dd");
};

/**
 * Retorna o "dia da pílula" (YYYY-MM-DD) com virada às 03:00.
 * Regra: se a hora local for < cutoffHour (padrão 3), considera o dia anterior.
 *
 * Ex.: 00:30 de 2026-01-07 -> retorna 2026-01-06
 */
export const getPillDateKey = (date?: Date, cutoffHour: number = 3): string => {
  const targetDate = date || new Date();

  // Proteção para valores inválidos
  const safeCutoff = Number.isFinite(cutoffHour) ? cutoffHour : 3;

  if (targetDate.getHours() < safeCutoff) {
    const adjusted = new Date(targetDate);
    adjusted.setDate(adjusted.getDate() - 1);
    return format(adjusted, "yyyy-MM-dd");
  }

  return format(targetDate, "yyyy-MM-dd");
};

/**
 * Formata uma data para o formato HH:MM.
 * Se nenhuma data for fornecida, usa a hora atual
 */
export const formatTimeString = (date?: Date): string => {
  const targetDate = date || new Date();
  return format(targetDate, "HH:mm");
};

/**
 * Formata uma data para exibição em português
 * Ex: "segunda-feira, 15 de janeiro de 2024"
 */
export const formatDateForDisplay = (dateKey?: string | null): string => {
  if (!dateKey) {
    return "";
  }

  const date = parseDateKey(dateKey);
  return format(date, "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR });
};

/**
 * Verifica se uma data é anterior ao dia atual
 */
export const isPastDate = (dateKey?: string | null): boolean => {
  if (!dateKey) {
    return false;
  }

  const date = parseDateKey(dateKey);
  const today = startOfDay(new Date());
  return isBefore(date, today);
};

/**
 * Converte uma string YYYY-MM-DD para um objeto Date
 */
export const parseDateKey = (dateKey: string): Date => {
  return parseISO(dateKey);
};
