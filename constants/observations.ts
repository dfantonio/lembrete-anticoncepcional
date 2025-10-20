import { ObservationType } from "@/src/types";

export const OBSERVATION_LABELS: Record<ObservationType, string> = {
  colica: "Cólica",
  sangramento: "Sangramento",
  corrimento: "Corrimento",
  dor_seio: "Dor no Seio",
  dor_costas: "Dor nas Costas",
  dor_pernas: "Dor nas Pernas",
  espinha: "Espinha",
};

export const OBSERVATION_EMOJIS: Record<ObservationType, string> = {
  colica: "🤕",
  sangramento: "🩸",
  corrimento: "💧",
  dor_seio: "🫀",
  dor_costas: "🦴",
  dor_pernas: "🦵",
  espinha: "🔴",
};
