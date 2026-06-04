import { ObservationType, ObservationValue } from "@/src/types";

export type ObservationKind = "toggle" | "scale";

export interface ObservationLevel {
  value: number; // ordinal (1, 2, 3...) — maior número = nível mais intenso
  label: string;
  emoji: string;
}

export interface ObservationField {
  id: ObservationType;
  label: string;
  emoji: string;
  kind: ObservationKind;
  required?: boolean; // obrigatório no registro do dia (fluxo principal da GF)
  levels?: ObservationLevel[]; // presente quando kind === "scale"
}

/**
 * Fonte de verdade dos campos de observação.
 * Adicionar um campo novo = uma entrada aqui:
 * - toggle: não exige mudança em nenhum outro lugar;
 * - scale: a renderização de níveis já é genérica;
 * - required: marca o campo como obrigatório no fluxo principal.
 */
export const OBSERVATION_FIELDS: ObservationField[] = [
  { id: "colica", label: "Cólica", emoji: "🤕", kind: "toggle" },
  { id: "sangramento", label: "Sangramento", emoji: "🩸", kind: "toggle" },
  { id: "corrimento", label: "Corrimento", emoji: "💧", kind: "toggle" },
  { id: "dor_seio", label: "Dor no Seio", emoji: "🫀", kind: "toggle" },
  { id: "dor_costas", label: "Dor nas Costas", emoji: "🦴", kind: "toggle" },
  { id: "dor_pernas", label: "Dor nas Pernas", emoji: "🦵", kind: "toggle" },
  { id: "dor_cabeca", label: "Dor de Cabeça", emoji: "🤯", kind: "toggle" },
  { id: "espinha", label: "Espinha", emoji: "🔴", kind: "toggle" },
  { id: "treino", label: "Treino", emoji: "🏋️‍♀️", kind: "toggle" },
  { id: "sexo_protegido", label: "Protegido", emoji: "🛡️", kind: "toggle" },
  {
    id: "sexo_sem_protecao",
    label: "Sem Proteção",
    emoji: "🍆💦",
    kind: "toggle",
  },
  { id: "alcool", label: "Bebida Alcoólica", emoji: "🍷", kind: "toggle" },
  {
    id: "estresse",
    label: "Estresse",
    emoji: "😖",
    kind: "scale",
    required: true,
    levels: [
      { value: 1, label: "Baixo", emoji: "😌" },
      { value: 2, label: "Médio", emoji: "😟" },
      { value: 3, label: "Alto", emoji: "😫" },
    ],
  },
];

export const OBSERVATION_FIELDS_BY_ID: Record<string, ObservationField> =
  OBSERVATION_FIELDS.reduce(
    (acc, field) => {
      acc[field.id] = field;
      return acc;
    },
    {} as Record<string, ObservationField>
  );

export const TOGGLE_FIELDS: ObservationField[] = OBSERVATION_FIELDS.filter(
  (f) => f.kind === "toggle"
);

export const SCALE_FIELDS: ObservationField[] = OBSERVATION_FIELDS.filter(
  (f) => f.kind === "scale"
);

export const REQUIRED_FIELDS: ObservationField[] = OBSERVATION_FIELDS.filter(
  (f) => f.required
);

export function getObservationField(id: string): ObservationField | undefined {
  return OBSERVATION_FIELDS_BY_ID[id];
}

/**
 * Retorna a definição de nível de um campo de escala para um valor armazenado.
 */
export function getLevel(
  field: ObservationField | undefined,
  value: ObservationValue | undefined
): ObservationLevel | undefined {
  if (!field?.levels || typeof value !== "number") return undefined;
  return field.levels.find((l) => l.value === value);
}
