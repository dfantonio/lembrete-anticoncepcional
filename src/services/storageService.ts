import { PillType, ThemeMode } from "@/src/types";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Chaves de armazenamento
const STORAGE_KEYS = {
  LAST_PILL_TYPE: "@last_pill_type",
  THEME_MODE: "@theme_mode",
} as const;

export class StorageService {
  /**
   * Métodos genéricos para AsyncStorage
   */
  private static async getItem<T>(key: string): Promise<T | null> {
    try {
      const value = await AsyncStorage.getItem(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error(`❌ Erro ao ler item ${key}:`, error);
      return null;
    }
  }

  private static async setItem<T>(key: string, value: T): Promise<void> {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`❌ Erro ao salvar item ${key}:`, error);
      throw error;
    }
  }

  private static async removeItem(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error(`❌ Erro ao remover item ${key}:`, error);
      throw error;
    }
  }

  /**
   * Métodos específicos para tipo de pílula
   */
  static async getLastPillType(): Promise<PillType> {
    try {
      const pillType = await this.getItem<PillType>(
        STORAGE_KEYS.LAST_PILL_TYPE
      );
      return pillType || "active"; // Valor padrão
    } catch (error) {
      console.error("❌ Erro ao obter último tipo de pílula:", error);
      return "active";
    }
  }

  static async setLastPillType(pillType: PillType): Promise<void> {
    try {
      await this.setItem(STORAGE_KEYS.LAST_PILL_TYPE, pillType);
      console.log("✅ Último tipo de pílula salvo:", pillType);
    } catch (error) {
      console.error("❌ Erro ao salvar último tipo de pílula:", error);
      throw error;
    }
  }

  /**
   * Métodos específicos para tema (migrados do ThemeContext)
   */
  static async getThemeMode(): Promise<ThemeMode> {
    try {
      const themeMode = await this.getItem<ThemeMode>(STORAGE_KEYS.THEME_MODE);
      return themeMode || "system"; // Valor padrão
    } catch (error) {
      console.error("❌ Erro ao obter modo de tema:", error);
      return "system";
    }
  }

  static async setThemeMode(themeMode: ThemeMode): Promise<void> {
    try {
      await this.setItem(STORAGE_KEYS.THEME_MODE, themeMode);
      console.log("✅ Modo de tema salvo:", themeMode);
    } catch (error) {
      console.error("❌ Erro ao salvar modo de tema:", error);
      throw error;
    }
  }
}
