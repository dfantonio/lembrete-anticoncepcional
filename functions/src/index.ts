import axios from "axios";
import { format } from "date-fns";
import * as admin from "firebase-admin";
import { onRequest } from "firebase-functions/https";
import * as logger from "firebase-functions/logger";
import { setGlobalOptions } from "firebase-functions/options";
import { onSchedule } from "firebase-functions/scheduler";

// Initialize Firebase Admin
admin.initializeApp();

setGlobalOptions({ maxInstances: 1 });

// Constants
const APP_ID = "lembrete-anticoncepcional";

/**
 * Função agendada que executa diariamente às 22:00 (horário de Brasília)
 * Verifica se a pílula foi tomada e envia notificação para o BF se necessário
 */
export const dailyPillReminder = onSchedule(
  {
    schedule: "0 22 * * *", // Cron: 22:00 todos os dias
    timeZone: "America/Sao_Paulo",
  },
  async (event) => {
    logger.info("🕙 Executando verificação diária às 22:00");

    try {
      await checkAndSendPillReminder();
      logger.info("✅ Verificação diária concluída com sucesso");
    } catch (error) {
      logger.error("❌ Erro na verificação diária:", error);
      throw error;
    }
  }
);

/**
 * Função HTTP de teste que executa a mesma lógica da função agendada
 * Pode ser chamada a qualquer momento para testar o fluxo
 */
export const testPillReminder = onRequest(async (req, res) => {
  logger.info("🧪 Executando teste da função de lembrete");

  try {
    const result = await checkAndSendPillReminder();

    res.status(200).json({
      success: true,
      message: "Teste executado com sucesso",
      data: result,
    });
  } catch (error) {
    logger.error("❌ Erro no teste:", error);

    res.status(500).json({
      success: false,
      message: "Erro no teste",
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

/**
 * Lógica principal compartilhada entre as funções agendada e de teste
 */
async function checkAndSendPillReminder() {
  // 1. Obter data atual (YYYY-MM-DD)
  const today = format(new Date(), "yyyy-MM-dd");
  logger.info(`📅 Verificando data: ${today}`);

  // 2. Buscar daily_log do dia
  const dailyLogRef = admin
    .firestore()
    .collection("artifacts")
    .doc(APP_ID)
    .collection("public")
    .doc("data")
    .collection("daily_log")
    .doc(today);

  const dailyLogDoc = await dailyLogRef.get();

  if (!dailyLogDoc.exists) {
    logger.info("❌ Documento daily_log não encontrado para hoje");
    return {
      action: "no_document",
      message: "Documento daily_log não encontrado para hoje",
    };
  }

  const dailyLog = dailyLogDoc.data();
  logger.info("📊 Status da pílula:", dailyLog);

  // 3. Verificar se deve enviar alerta
  if (dailyLog?.taken === false && dailyLog?.alertSent === false) {
    logger.info("🚨 Pílula não tomada! Enviando alerta para BF...");

    // 4. Buscar usuário BF (role: "BF_REMINDER")
    const usersRef = admin
      .firestore()
      .collection("artifacts")
      .doc(APP_ID)
      .collection("public")
      .doc("data")
      .collection("users_config");

    const bfQuery = await usersRef.where("role", "==", "BF_REMINDER").get();

    if (bfQuery.empty) {
      logger.error("❌ Usuário BF não encontrado");
      throw new Error("Usuário BF não encontrado");
    }

    const bfUsers = bfQuery.docs.map((doc) => ({
      id: doc.id,
      data: doc.data(),
    }));
    logger.info(`👤 ${bfUsers.length} usuário(s) BF encontrado(s):`, bfUsers);

    // 5. Enviar notificação para todos os usuários BF
    const notifications = [];
    const validUsers = [];

    for (const bfUser of bfUsers) {
      if (!bfUser.data.pushToken) {
        logger.warn(
          `⚠️ Usuário BF ${bfUser.id} não tem push token configurado`
        );
        continue;
      }

      const notification = {
        to: bfUser.data.pushToken,
        title: "🚨 ALERTA: Pílula não tomada!",
        body: `A pílula anticoncepcional não foi confirmada hoje. Verifique com a Sasa!`,
        sound: "default",
        priority: "high",
        data: {
          date: today,
          type: "pill_reminder",
        },
      };

      notifications.push(notification);
      validUsers.push({
        userId: bfUser.id,
        platform: bfUser.data.platform,
      });
    }

    if (notifications.length === 0) {
      logger.error("❌ Nenhum usuário BF válido com push token encontrado");
      throw new Error("Nenhum usuário BF válido com push token encontrado");
    }

    // Enviar todas as notificações
    const responses = [];
    for (const notification of notifications) {
      try {
        const response = await axios.post(
          "https://exp.host/--/api/v2/push/send",
          notification,
          {
            headers: {
              Accept: "application/json",
              "Accept-encoding": "gzip, deflate",
              "Content-Type": "application/json",
            },
          }
        );
        responses.push(response.data);
        logger.info("✅ Notificação enviada para um usuário BF");
      } catch (error) {
        logger.error(
          "❌ Erro ao enviar notificação para um usuário BF:",
          error
        );
        // Continue enviando para outros usuários mesmo se um falhar
      }
    }

    logger.info(
      `✅ ${responses.length} notificação(ões) enviada(s) com sucesso`
    );

    // 6. Marcar alertSent como true
    await dailyLogRef.update({
      alertSent: true,
      alertSentAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    logger.info("✅ Alerta marcado como enviado");

    return {
      action: "notification_sent",
      message: `${responses.length} notificação(ões) enviada(s) com sucesso`,
      notifications: responses,
      bfUsers: validUsers,
    };
  } else {
    const reason = dailyLog?.taken
      ? "pílula já foi tomada"
      : "alerta já foi enviado";
    logger.info(`✅ ${reason}`);

    return {
      action: "no_action_needed",
      message: `Nenhuma ação necessária: ${reason}`,
      dailyLog: {
        taken: dailyLog?.taken,
        alertSent: dailyLog?.alertSent,
      },
    };
  }
}
