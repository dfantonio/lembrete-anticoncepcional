import { ObservationType } from "@/src/types";

export const OBSERVATION_LABELS: Record<ObservationType, string> = {
  colica: "Cólica",
  sangramento: "Sangramento",
  corrimento: "Corrimento",
  dor_seio: "Dor no Seio",
  dor_costas: "Dor nas Costas",
  dor_pernas: "Dor nas Pernas",
  dor_cabeca: "Dor de Cabeça",
  espinha: "Espinha",
  treino: "Treino",
  sexo_protegido: "Protegido",
  sexo_sem_protecao: "Sem Proteção",
};

export const OBSERVATION_EMOJIS: Record<ObservationType, string> = {
  colica: "🤕",
  sangramento: "🩸",
  corrimento: "💧",
  dor_seio: "🫀",
  dor_costas: "🦴",
  dor_pernas: "🦵",
  dor_cabeca: "🤯",
  espinha: "🔴",
  treino: "🏋️‍♀️",
  sexo_protegido: "🛡️",
  sexo_sem_protecao: "🍆💦",
};
