// Tipos para o projeto de lembrete anticoncepcional

export type UserRole = "GF_PILL_TAKER" | "BF_REMINDER";

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
export type ScreenName = "RoleSelect" | "MainGF" | "MainBF" | "CalendarHistory";

export interface AppState {
  currentScreen: ScreenName;
  userRole?: UserRole;
  userId?: string;
  isLoading: boolean;
}
