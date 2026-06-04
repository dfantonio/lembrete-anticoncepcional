// Tipos para o projeto de lembrete anticoncepcional

export type UserRole = "GF_PILL_TAKER" | "BF_REMINDER";

// Tipos para temas
export type Theme = "light" | "dark";
export type ThemeMode = "light" | "dark" | "system";
export type PillType = "active" | "placebo";

export type ObservationType =
  | "dor_cabeca"
  | "colica"
  | "sangramento"
  | "corrimento"
  | "dor_seio"
  | "dor_costas"
  | "dor_pernas"
  | "espinha"
  | "treino"
  | "sexo_protegido"
  | "sexo_sem_protecao"
  | "alcool" // toggle
  | "estresse"; // escala (níveis)

// Valor por campo de observação:
// - `true` para campos de toggle (marcado)
// - número ordinal para campos de escala (ex.: estresse 1=baixo, 2=médio, 3=alto)
export type ObservationValue = true | number;

export interface UserConfig {
  role: UserRole;
  pushToken?: string;
  platform?: "android" | "ios";
}

export interface DailyLog {
  dateKey: string; // YYYY-MM-DD
  taken: boolean;
  takenTime?: string; // HH:MM
  alertSent: boolean;
  pillType: PillType;
  // Mapa unificado: chave = id do campo, valor = `true` (toggle) ou número (escala).
  // Documentos legados podem vir como ObservationType[] e são normalizados na leitura.
  observations?: Partial<Record<ObservationType, ObservationValue>>;
}

export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  measurementId?: string;
}

// Tipos para navegação
export enum ScreenName {
  RoleSelect = "role-select",
  MainGF = "main-gf",
  MainBF = "main-bf",
  CalendarHistory = "calendar-history",
  Analytics = "analytics",
}

export interface AppState {
  currentScreen: ScreenName;
  userRole?: UserRole;
  userId?: string;
  isLoading: boolean;
}
