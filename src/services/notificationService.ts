import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { formatDateKey } from "../utils/dateUtils";
import { AuthService } from "./authService";
import { FirestoreService } from "./firestoreService";

// Configurar como as notificações são tratadas
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export class NotificationService {
  /**
   * Solicita permissões para notificações
   */
  static async requestPermissions(): Promise<boolean> {
    try {
      const { status: existingStatus } =
        await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== "granted") {
        console.log("❌ Permissão de notificação negada");
        return false;
      }

      console.log("✅ Permissão de notificação concedida");
      return true;
    } catch (error) {
      console.error("❌ Erro ao solicitar permissões:", error);
      return false;
    }
  }

  /**
   * Agenda notificações semanais individuais para 21:00 (GF)
   * Verifica se a pílula já foi tomada hoje antes de agendar
   */
  static async scheduleWeeklyNotifications(): Promise<void> {
    try {
      // Cancelar notificações antigas
      await Notifications.cancelAllScheduledNotificationsAsync();

      // Verificar se a pílula já foi tomada hoje
      const today = formatDateKey();
      const todayLog = await FirestoreService.getDailyLog(today);
      const pillTakenToday = todayLog?.taken || false;

      let initialIndex = 0;

      // Se for hoje e a pílula já foi tomada, pular
      if (pillTakenToday) {
        console.log(
          `⏭️ Pílula já tomada hoje (${today}), notificação não agendada`
        );
        initialIndex = 1;
      }

      // Agendar para os próximos 7 dias
      for (let i = initialIndex; i < 7; i++) {
        const date = new Date();
        date.setDate(date.getDate() + i);
        date.setHours(21, 0, 0, 0);

        const dateKey = formatDateKey(date);

        // Verificar se a data não é no passado
        if (date.getTime() <= Date.now()) {
          console.log(`⏭️ Pulando data no passado: ${dateKey}`);
          continue;
        }

        await Notifications.scheduleNotificationAsync({
          identifier: `pill-reminder-${dateKey}`,
          content: {
            title: "💊 Lembrete da Pílula",
            body: "Hora de tomar sua pílula anticoncepcional!",
            sound: true,
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DATE,
            date: date,
          },
        });
      }

      console.log("✅ Notificações semanais agendadas (7 dias)");
    } catch (error) {
      console.error("❌ Erro ao agendar notificações semanais:", error);
      throw error;
    }
  }

  /**
   * Cancela apenas a notificação de hoje
   */
  static async cancelTodayNotification(dateKey?: string): Promise<void> {
    try {
      const targetDateKey = dateKey || formatDateKey();
      const notificationId = `pill-reminder-${targetDateKey}`;

      await Notifications.cancelScheduledNotificationAsync(notificationId);
      console.log(`✅ Notificação cancelada (${targetDateKey})`);
    } catch (error) {
      console.error("❌ Erro ao cancelar notificação de hoje:", error);
      throw error;
    }
  }

  /**
   * Cancela todas as notificações agendadas
   */
  static async cancelAllNotifications(): Promise<void> {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      console.log("✅ Todas as notificações canceladas");
    } catch (error) {
      console.error("❌ Erro ao cancelar notificações:", error);
      throw error;
    }
  }

  /**
   * Registra para push notifications e salva token (para BF)
   */
  static async registerForPushNotifications(): Promise<string | null> {
    try {
      // Solicitar permissões primeiro
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        return null;
      }

      return await this.getPushToken();
    } catch (error) {
      console.error("❌ Erro ao registrar para push notifications:", error);
      return null;
    }
  }

  /**
   * Obtém o push token do Expo (para BF)
   */
  static async getPushToken(): Promise<string | null> {
    try {
      if (Platform.OS === "web") {
        console.log("❌ Push notifications não suportadas na web");
        return null;
      }

      const token = await Notifications.getExpoPushTokenAsync({
        projectId: "d5aa500e-4157-4f25-908c-8c7bf12a406d",
      });

      console.log("✅ Push token obtido:", token.data);
      return token.data;
    } catch (error) {
      console.error("❌ Erro ao obter push token:", error);
      return null;
    }
  }

  /**
   * Salva o push token no Firestore (para BF)
   */
  static async savePushTokenToFirestore(): Promise<void> {
    try {
      const userId = AuthService.getCurrentUserId();
      if (!userId) {
        throw new Error("Usuário não autenticado");
      }

      const pushToken = await this.getPushToken();
      if (!pushToken) {
        throw new Error("Não foi possível obter push token");
      }

      await FirestoreService.updatePushToken(userId, pushToken);
      console.log("✅ Push token salvo no Firestore");
    } catch (error) {
      console.error("❌ Erro ao salvar push token:", error);
      throw error;
    }
  }

  /**
   * Envia notificação de teste
   */
  static async sendTestNotification(): Promise<void> {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "🧪 Teste",
          body: "Esta é uma notificação de teste!",
          sound: true,
        },
        trigger: { seconds: 2 } as any,
      });
      console.log("✅ Notificação de teste enviada");
    } catch (error) {
      console.error("❌ Erro ao enviar notificação de teste:", error);
      throw error;
    }
  }

  /**
   * Configura listener para notificações recebidas
   */
  static addNotificationListener(
    callback: (notification: Notifications.Notification) => void
  ) {
    return Notifications.addNotificationReceivedListener(callback);
  }

  /**
   * Configura listener para interações com notificações
   */
  static addNotificationResponseListener(
    callback: (response: Notifications.NotificationResponse) => void
  ) {
    return Notifications.addNotificationResponseReceivedListener(callback);
  }
}
