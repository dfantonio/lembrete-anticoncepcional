import { router } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";

import { useAppTheme } from "@/src/contexts/ThemeContext";
import { AuthService } from "@/src/services/authService";
import { FirestoreService } from "@/src/services/firestoreService";
import { ScreenName } from "@/src/types";

export default function Index() {
  const { colors } = useAppTheme();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function initializeApp() {
      try {
        console.log("🔄 Inicializando aplicação...");

        // 1. Autenticação anônima
        const userId = await AuthService.signInAnonymously();
        console.log("✅ Usuário autenticado:", userId);

        // 2. Buscar configuração do usuário
        const userConfig = await FirestoreService.getUserConfig(userId);

        if (userConfig?.role) {
          // Usuário já tem role definido, redirecionar para tela apropriada
          if (userConfig.role === "GF_PILL_TAKER") {
            router.replace(`/${ScreenName.MainGF}`);
          } else if (userConfig.role === "BF_REMINDER") {
            router.replace(`/${ScreenName.MainBF}`);
          }
        } else {
          // Usuário não tem role, ir para seleção de papel
          router.replace(`/${ScreenName.RoleSelect}`);
        }
      } catch (error) {
        console.error("❌ Erro na inicialização:", error);
        // Em caso de erro, vai para tela de seleção de papel
        router.replace(`/${ScreenName.RoleSelect}`);
      } finally {
        setIsLoading(false);
      }
    }

    initializeApp();
  }, []);

  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: colors.base,
        }}
      >
        <ActivityIndicator size="large" color={colors.action} />
      </View>
    );
  }

  // Este componente não renderiza nada visível, apenas gerencia a navegação inicial
  return null;
}
