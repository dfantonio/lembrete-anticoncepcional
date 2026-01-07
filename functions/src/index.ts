import axios from "axios";
import { format } from "date-fns";
import * as admin from "firebase-admin";
import { onRequest } from "firebase-functions/https";
import * as logger from "firebase-functions/logger";
import { setGlobalOptions } from "firebase-functions/options";
import { onSchedule } from "firebase-functions/scheduler";
import { onDocumentWritten } from "firebase-functions/v2/firestore";

// Initialize Firebase Admin
admin.initializeApp();

setGlobalOptions({ maxInstances: 1 });

// Constants
const APP_ID = "lembrete-anticoncepcional";

/**
 * Envia push notifications via Expo para todos os usuários BF (role: BF_REMINDER).
 */
async function sendPushToAllBfUsers(payload: {
  title: string;
  body: string;
  data?: Record<string, unknown>;
}) {
  const usersRef = admin
    .firestore()
    .collection("artifacts")
    .doc(APP_ID)
    .collection("public")
    .doc("data")
    .collection("users_config");

  const bfQuery = await usersRef.where("role", "==", "BF_REMINDER").get();
  if (bfQuery.empty) {
    logger.warn("⚠️ Usuário BF não encontrado");
    return { attempted: 0, sent: 0 };
  }

  const bfUsers = bfQuery.docs.map((doc) => ({ id: doc.id, data: doc.data() }));
  logger.info(`👤 ${bfUsers.length} usuário(s) BF encontrado(s)`, {
    bfUsers: bfUsers.map((u) => ({ id: u.id, hasToken: !!u.data.pushToken })),
  });

  const notifications = bfUsers
    .filter((u) => !!u.data.pushToken)
    .map((u) => ({
      to: u.data.pushToken,
      title: payload.title,
      body: payload.body,
      sound: "default",
      priority: "high",
      data: payload.data || {},
    }));

  if (notifications.length === 0) {
    logger.warn("⚠️ Nenhum usuário BF com pushToken configurado");
    return { attempted: 0, sent: 0 };
  }

  let sent = 0;
  for (const notification of notifications) {
    try {
      await axios.post("https://exp.host/--/api/v2/push/send", notification, {
        headers: {
          Accept: "application/json",
          "Accept-encoding": "gzip, deflate",
          "Content-Type": "application/json",
        },
      });
      sent++;
    } catch (error) {
      logger.error("❌ Erro ao enviar notificação para BF:", error);
      // Continua tentando para os demais
    }
  }

  logger.info(`✅ Push enviado para BF: ${sent}/${notifications.length}`);
  return { attempted: notifications.length, sent };
}

/**
 * Trigger: quando a pílula é registrada (taken muda para true), notifica o BF.
 * Garante 1x por dia via flag `takenNotified`.
 */
export const notifyBfOnPillTaken = onDocumentWritten(
  `artifacts/${APP_ID}/public/data/daily_log/{dateKey}`,
  async (event) => {
    const change = event.data;
    if (!change) {
      return;
    }

    const afterSnap = change.after;
    if (!afterSnap.exists) {
      return;
    }

    const after = afterSnap.data();
    const before = change.before.exists ? change.before.data() : null;

    const wasTaken = before?.taken === true;
    const isTaken = after?.taken === true;

    if (!isTaken || wasTaken) {
      return;
    }

    // Dedupe (reprocessamentos / atualizações posteriores)
    if (after?.takenNotified === true) {
      logger.info(
        "⏭️ Notificação de 'pílula registrada' já enviada (takenNotified=true)"
      );
      return;
    }

    const dateKey = after?.dateKey || event.params?.dateKey;
    const takenTime = after?.takenTime;

    logger.info("✅ Pílula registrada, enviando push para BF", {
      dateKey,
      takenTime,
    });

    const result = await sendPushToAllBfUsers({
      title: "✅ Pílula registrada",
      body: "",
      data: { type: "pill_taken", date: dateKey },
    });

    // Marcar flag de dedupe mesmo se envio falhar parcialmente (evita spam)
    try {
      await afterSnap.ref.update({
        takenNotified: true,
        takenNotifiedAt: admin.firestore.FieldValue.serverTimestamp(),
        takenNotifiedResult: result,
      });
    } catch (error) {
      logger.error("❌ Erro ao atualizar takenNotified no daily_log:", error);
    }
  }
);

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
  const today = format(
    new Date(
      new Date().toLocaleString("en-US", { timeZone: "America/Sao_Paulo" })
    ),
    "yyyy-MM-dd"
  );
  logger.info(
    `📅 Verificando data: ${today}`,
    new Date(),
    new Date().toLocaleString("en-US", { timeZone: "America/Sao_Paulo" })
  );

  // 2. Buscar daily_log do dia
  const dailyLogRef = admin
    .firestore()
    .collection("artifacts")
    .doc(APP_ID)
    .collection("public")
    .doc("data")
    .collection("daily_log")
    .doc(today);

  let dailyLogDoc = await dailyLogRef.get();

  if (!dailyLogDoc.exists) {
    logger.info(
      "📝 Documento daily_log não encontrado. Criando automaticamente..."
    );

    // Criar documento com estado inicial
    await dailyLogRef.set({
      dateKey: today,
      taken: false,
      alertSent: false,
    });

    logger.info("✅ Documento daily_log criado automaticamente");

    // Buscar o documento novamente após criação
    dailyLogDoc = await dailyLogRef.get();
  }

  const dailyLog = dailyLogDoc.data();
  logger.info("📊 Status da pílula:", dailyLog);

  // 3. Verificar se deve enviar alerta
  if (dailyLog?.taken === false && dailyLog?.alertSent === false) {
    logger.info("🚨 Pílula não tomada! Enviando alerta para BF...");

    const sendResult = await sendPushToAllBfUsers({
      title: "🚨 ALERTA: Pílula não tomada!",
      body: `A pílula anticoncepcional não foi confirmada hoje. Verifique com a Sasa!`,
      data: { date: today, type: "pill_reminder" },
    });

    // 6. Marcar alertSent como true
    await dailyLogRef.update({
      alertSent: true,
      alertSentAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    logger.info("✅ Alerta marcado como enviado");

    return {
      action: "notification_sent",
      message: `${sendResult.sent} notificação(ões) enviada(s) com sucesso`,
      sendResult,
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
