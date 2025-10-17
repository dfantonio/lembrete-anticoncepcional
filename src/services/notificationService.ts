import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
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
   * Agenda notificação local diária para 20:00 (GF)
   */
  static async scheduleDaily20hNotification(): Promise<void> {
    try {
      // Cancelar notificações anteriores
      await Notifications.cancelAllScheduledNotificationsAsync();

      // Agendar nova notificação para 20:00
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "💊 Lembrete da Pílula",
          body: "Hora de tomar sua pílula anticoncepcional!",
          sound: true,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour: 20,
          minute: 0,
        },
      });

      console.log("✅ Notificação diária agendada para 20:00");
    } catch (error) {
      console.error("❌ Erro ao agendar notificação:", error);
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
