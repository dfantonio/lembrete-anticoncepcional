import { getColors } from "@/constants/theme";
import { StorageService } from "@/src/services/storageService";
import { Theme, ThemeMode } from "@/src/types";
import React, { createContext, useContext, useEffect, useState } from "react";
import { useColorScheme } from "react-native";

interface ThemeContextType {
  theme: Theme;
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  colors: ReturnType<typeof getColors>;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemColorScheme = useColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>("system");
  const [isLoading, setIsLoading] = useState(true);

  // Determina o tema atual baseado no modo selecionado
  const theme: Theme =
    themeMode === "system"
      ? systemColorScheme === "dark"
        ? "dark"
        : "light"
      : themeMode;

  const colors = getColors(theme);

  // Carrega preferência salva ao inicializar
  useEffect(() => {
    loadThemePreference();
  }, []);

  // Observa mudanças no sistema quando em modo 'system'
  useEffect(() => {
    if (themeMode === "system") {
      // O tema será automaticamente atualizado quando systemColorScheme mudar
    }
  }, [systemColorScheme, themeMode]);

  const loadThemePreference = async () => {
    try {
      const savedThemeMode = await StorageService.getThemeMode();
      setThemeModeState(savedThemeMode);
    } catch (error) {
      console.error("❌ Erro ao carregar preferência de tema:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const setThemeMode = async (mode: ThemeMode) => {
    try {
      setThemeModeState(mode);
      await StorageService.setThemeMode(mode);
    } catch (error) {
      console.error("❌ Erro ao salvar preferência de tema:", error);
    }
  };

  const value: ThemeContextType = {
    theme,
    themeMode,
    setThemeMode,
    colors,
  };

  // Mostra loading enquanto carrega preferência
  if (isLoading) {
    return null; // Ou um componente de loading se necessário
  }

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useAppTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useAppTheme deve ser usado dentro de um ThemeProvider");
  }
  return context;
}
