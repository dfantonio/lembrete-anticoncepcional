// Tipos para o projeto de lembrete anticoncepcional

export type UserRole = "GF_PILL_TAKER" | "BF_REMINDER";

// Tipos para temas
export type Theme = "light" | "dark";
export type ThemeMode = "light" | "dark" | "system";

export type ObservationType =
  | "colica"
  | "sangramento"
  | "corrimento"
  | "dor_seio"
  | "dor_costas"
  | "dor_pernas"
  | "espinha"
  | "sexo_protegido"
  | "sexo_sem_protecao";

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
  observations?: ObservationType[];
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
}

export interface AppState {
  currentScreen: ScreenName;
  userRole?: UserRole;
  userId?: string;
  isLoading: boolean;
}
