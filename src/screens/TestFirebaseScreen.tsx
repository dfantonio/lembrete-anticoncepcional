import * as Clipboard from "expo-clipboard";
import React, { useEffect, useState } from "react";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { AuthService } from "../services/authService";
import { FirestoreService } from "../services/firestoreService";
import { NotificationService } from "../services/notificationService";

export default function TestFirebaseScreen() {
  const [isLoading, setIsLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<string[]>([]);

  const addResult = (result: string) => {
    setTestResults((prev) => [
      ...prev,
      `${new Date().toLocaleTimeString()}: ${result}`,
    ]);
  };

  useEffect(() => {
    // Testar autenticação ao carregar
    testAuthentication();
  }, []);

  const testAuthentication = async () => {
    setIsLoading(true);
    try {
      const id = await AuthService.signInAnonymously();
      setUserId(id);
      addResult(`✅ Autenticação: ${id.substring(0, 8)}...`);
    } catch (error) {
      addResult(`❌ Erro na autenticação: ${error}`);
    }
    setIsLoading(false);
  };

  const testFirestore = async () => {
    if (!userId) {
      addResult("❌ Usuário não autenticado");
      return;
    }

    setIsLoading(true);
    try {
      // Testar salvamento de configuração
      await FirestoreService.saveUserConfig(userId, {
        role: "GF_PILL_TAKER",
        platform: "ios",
      });
      addResult("✅ Configuração salva no Firestore");

      // Testar leitura de configuração
      const config = await FirestoreService.getUserConfig(userId);
      addResult(`✅ Configuração lida: ${config?.role}`);

      // Testar salvamento de log diário
      const today = new Date().toISOString().split("T")[0];
      await FirestoreService.saveDailyLog(today, {
        dateKey: today,
        taken: false,
        alertSent: false,
      });
      addResult("✅ Log diário salvo");
    } catch (error) {
      addResult(`❌ Erro no Firestore: ${error}`);
    }
    setIsLoading(false);
  };

  const testNotifications = async () => {
    setIsLoading(true);
    try {
      // Solicitar permissões
      const hasPermission = await NotificationService.requestPermissions();
      if (!hasPermission) {
        addResult("❌ Permissão de notificação negada");
        return;
      }

      // Enviar notificação de teste
      await NotificationService.sendTestNotification();
      addResult("✅ Notificação de teste enviada");

      // Tentar obter push token
      const pushToken = await NotificationService.getPushToken();
      if (pushToken) {
        addResult(`✅ Push token: ${pushToken.substring(0, 20)}...`);
      } else {
        addResult("⚠️ Push token não disponível (normal no Expo Go)");
      }
    } catch (error) {
      addResult(`❌ Erro nas notificações: ${error}`);
    }
    setIsLoading(false);
  };

  const clearResults = () => {
    setTestResults([]);
  };

  // Na tela de teste, adicione um botão para obter o token:
  const getPushToken = async () => {
    try {
      const token = await NotificationService.getPushToken();
      if (token) {
        console.log("Push Token:", token);
        // Copie este token para usar no teste
        Alert.alert("Push Token", token);
        // Copy to clipboard
        Clipboard.setStringAsync(token);
      }
    } catch (error) {
      console.error("Erro:", error);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🧪 Teste Firebase</Text>

      <View style={styles.statusContainer}>
        <Text style={styles.statusText}>
          Status: {isLoading ? "Carregando..." : "Pronto"}
        </Text>
        {userId && (
          <Text style={styles.userIdText}>
            User ID: {userId.substring(0, 12)}...
          </Text>
        )}
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, styles.primaryButton]}
          onPress={testAuthentication}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>🔐 Testar Auth</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.secondaryButton]}
          onPress={testFirestore}
          disabled={isLoading || !userId}
        >
          <Text style={styles.buttonText}>🗄️ Testar Firestore</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.tertiaryButton]}
          onPress={testNotifications}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>🔔 Testar Notificações</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.tertiaryButton]}
          onPress={getPushToken}
        >
          <Text style={styles.buttonText}>Obter Push Token</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.clearButton]}
          onPress={clearResults}
        >
          <Text style={styles.buttonText}>🗑️ Limpar</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.resultsContainer}>
        <Text style={styles.resultsTitle}>Resultados dos Testes:</Text>
        {testResults.map((result, index) => (
          <Text key={index} style={styles.resultText}>
            {result}
          </Text>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#f5f5f5",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
    color: "#333",
  },
  statusContainer: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  userIdText: {
    fontSize: 14,
    color: "#666",
    marginTop: 5,
  },
  buttonContainer: {
    gap: 10,
    marginBottom: 20,
  },
  button: {
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
  },
  primaryButton: {
    backgroundColor: "#007AFF",
  },
  secondaryButton: {
    backgroundColor: "#34C759",
  },
  tertiaryButton: {
    backgroundColor: "#FF9500",
  },
  clearButton: {
    backgroundColor: "#FF3B30",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  resultsContainer: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#333",
  },
  resultText: {
    fontSize: 14,
    marginBottom: 5,
    color: "#666",
    fontFamily: "monospace",
  },
});
