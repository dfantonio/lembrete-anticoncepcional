import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  setDoc,
  Timestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { COLLECTIONS, db } from "../config/firebase";
import { DailyLog, UserConfig, UserRole } from "../types";

export class FirestoreService {
  /**
   * Salva ou atualiza a configuração do usuário
   */
  static async saveUserConfig(
    userId: string,
    config: UserConfig
  ): Promise<void> {
    try {
      const userRef = doc(db, COLLECTIONS.USERS_CONFIG, userId);
      await setDoc(userRef, {
        ...config,
        updatedAt: Timestamp.now(),
      });
      console.log("✅ Configuração do usuário salva:", userId, config);
    } catch (error) {
      console.error("❌ Erro ao salvar configuração do usuário:", error);
      throw error;
    }
  }

  /**
   * Obtém a configuração do usuário
   */
  static async getUserConfig(userId: string): Promise<UserConfig | null> {
    try {
      const userRef = doc(db, COLLECTIONS.USERS_CONFIG, userId);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const data = userSnap.data();
        return {
          role: data.role,
          pushToken: data.pushToken,
          platform: data.platform,
        };
      }
      return null;
    } catch (error) {
      console.error("❌ Erro ao obter configuração do usuário:", error);
      throw error;
    }
  }

  /**
   * Observa mudanças na configuração do usuário em tempo real
   */
  static watchUserConfig(
    userId: string,
    callback: (config: UserConfig | null) => void
  ) {
    const userRef = doc(db, COLLECTIONS.USERS_CONFIG, userId);
    return onSnapshot(userRef, (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        callback({
          role: data.role,
          pushToken: data.pushToken,
          platform: data.platform,
        });
      } else {
        callback(null);
      }
    });
  }

  /**
   * Salva o log diário (status da pílula)
   */
  static async saveDailyLog(dateKey: string, log: DailyLog): Promise<void> {
    try {
      const logRef = doc(db, COLLECTIONS.DAILY_LOG, dateKey);
      await setDoc(logRef, {
        ...log,
        updatedAt: Timestamp.now(),
      });
      console.log("✅ Log diário salvo:", dateKey, log);
    } catch (error) {
      console.error("❌ Erro ao salvar log diário:", error);
      throw error;
    }
  }

  /**
   * Obtém o log diário
   */
  static async getDailyLog(dateKey: string): Promise<DailyLog | null> {
    try {
      const logRef = doc(db, COLLECTIONS.DAILY_LOG, dateKey);
      const logSnap = await getDoc(logRef);

      if (logSnap.exists()) {
        const data = logSnap.data();

        return {
          dateKey: data.dateKey,
          taken: data.taken,
          takenTime: data.takenTime,
          alertSent: data.alertSent,
          pillType: data.pillType,
          observations: data.observations,
        };
      }
      return null;
    } catch (error) {
      console.error("❌ Erro ao obter log diário:", error);
      throw error;
    }
  }

  /**
   * Observa mudanças no log diário em tempo real
   */
  static watchDailyLog(
    dateKey: string,
    callback: (log: DailyLog | null) => void
  ) {
    const logRef = doc(db, COLLECTIONS.DAILY_LOG, dateKey);
    return onSnapshot(logRef, (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        callback({
          dateKey: data.dateKey,
          taken: data.taken,
          takenTime: data.takenTime,
          alertSent: data.alertSent,
          pillType: data.pillType,
        });
      } else {
        callback(null);
      }
    });
  }

  /**
   * Obtém logs dos últimos N dias para o histórico
   */
  static async getRecentLogs(days: number = 30): Promise<DailyLog[]> {
    try {
      const today = new Date();
      const endDateKey = today.toISOString().split("T")[0]; // YYYY-MM-DD

      const startDate = new Date(today);
      startDate.setDate(startDate.getDate() - Math.max(0, days - 1));
      const startDateKey = startDate.toISOString().split("T")[0]; // YYYY-MM-DD

      const logs = await this.getLogsByDateRange(startDateKey, endDateKey);

      // Manter compatibilidade: mais recente primeiro
      return [...logs].sort((a, b) => b.dateKey.localeCompare(a.dateKey));
    } catch (error) {
      console.error("❌ Erro ao obter logs recentes:", error);
      throw error;
    }
  }

  /**
   * Obtém logs em um intervalo de datas (inclusive).
   * Observação: como `dateKey` é string no formato YYYY-MM-DD, a comparação lexicográfica funciona.
   */
  static async getLogsByDateRange(
    startDateKey: string,
    endDateKey: string
  ): Promise<DailyLog[]> {
    try {
      const logsRef = collection(db, COLLECTIONS.DAILY_LOG);
      const q = query(
        logsRef,
        where("dateKey", ">=", startDateKey),
        where("dateKey", "<=", endDateKey)
      );

      const querySnapshot = await getDocs(q);
      const logs: DailyLog[] = querySnapshot.docs.map((docSnap) => {
        const data = docSnap.data();
        return {
          dateKey: data.dateKey,
          taken: data.taken,
          takenTime: data.takenTime,
          alertSent: data.alertSent,
          pillType: data.pillType,
          observations: data.observations,
        } as DailyLog;
      });

      // Ordem previsível (mais antigo -> mais recente); quem chamar pode reordenar se quiser
      return logs.sort((a, b) => a.dateKey.localeCompare(b.dateKey));
    } catch (error) {
      console.error("❌ Erro ao obter logs por intervalo de datas:", error);
      throw error;
    }
  }

  /**
   * Busca usuário com role específico (para encontrar o BF)
   */
  static async getUserByRole(role: UserRole): Promise<UserConfig | null> {
    try {
      const usersRef = collection(db, COLLECTIONS.USERS_CONFIG);
      const q = query(usersRef, where("role", "==", role));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0];
        const data = doc.data();
        return {
          role: data.role,
          pushToken: data.pushToken,
          platform: data.platform,
        };
      }
      return null;
    } catch (error) {
      console.error("❌ Erro ao buscar usuário por role:", error);
      throw error;
    }
  }

  /**
   * Atualiza apenas o pushToken do usuário
   */
  static async updatePushToken(
    userId: string,
    pushToken: string
  ): Promise<void> {
    try {
      const userRef = doc(db, COLLECTIONS.USERS_CONFIG, userId);
      await updateDoc(userRef, {
        pushToken,
        updatedAt: Timestamp.now(),
      });
      console.log("✅ Push token atualizado:", userId);
    } catch (error) {
      console.error("❌ Erro ao atualizar push token:", error);
      throw error;
    }
  }

  /**
   * Exclui um log diário
   */
  static async deleteDailyLog(dateKey: string): Promise<void> {
    try {
      const logRef = doc(db, COLLECTIONS.DAILY_LOG, dateKey);
      await deleteDoc(logRef);
      console.log("✅ Log diário excluído:", dateKey);
    } catch (error) {
      console.error("❌ Erro ao excluir log diário:", error);
      throw error;
    }
  }
}
