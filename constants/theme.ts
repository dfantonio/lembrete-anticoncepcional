/**
 * Paleta de cores da identidade visual do aplicativo
 * Foco feminino: calma, conforto e confiabilidade
 */

import { Theme } from "@/src/types";
import { Platform } from "react-native";

// Paleta de cores Light Theme (original)
export const LightColors = {
  // Cores principais
  base: "#F5F5F5", // Branco Suave (Base)
  surface: "#FFFFFF", // Branco Puro (Cards)
  action: "#FFB6C1", // Rosa Pêssego (Ação)
  text: "#333333", // Cinza Carvão (Texto)
  textSecondary: "#666666", // Cinza Médio (Texto Secundário)
  success: "#4CAF50", // Verde Menta (Sucesso)
  alert: "#C67171", // Malva Escuro (Alerta)
  border: "#E0E0E0", // Cinza Claro (Bordas)
  white: "#FFFFFF", // Branco Puro
};

// Paleta de cores Dark Theme
export const DarkColors = {
  // Cores principais
  base: "#1A1A1A", // Preto Suave (Base)
  surface: "#2D2D2D", // Cinza Escuro (Cards)
  action: "#FF8FA3", // Rosa Escuro
  text: "#F5F5F5", // Texto Principal Claro
  textSecondary: "#B0B0B0", // Texto Secundário
  success: "#66BB6A", // Verde Menta Mais Vibrante
  alert: "#E57373", // Malva Mais Vibrante
  border: "#404040", // Bordas Sutis
  white: "#FFFFFF", // Branco Puro (para ícones)
};

// Função para obter cores baseada no tema
export function getColors(theme: Theme) {
  return theme === "light" ? LightColors : DarkColors;
}

// Compatibilidade - mantém AppColors para referências existentes
export const AppColors = LightColors;

// Cores do sistema (mantidas para compatibilidade)
const tintColorLight = LightColors.action;
const tintColorDark = "#fff";

export const Colors = {
  light: {
    text: LightColors.text,
    background: LightColors.base,
    tint: tintColorLight,
    icon: LightColors.text,
    tabIconDefault: LightColors.text,
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: DarkColors.text,
    background: DarkColors.base,
    tint: tintColorDark,
    icon: DarkColors.text,
    tabIconDefault: DarkColors.text,
    tabIconSelected: tintColorDark,
  },
};

// Tipografia seguindo a identidade visual
export const Typography = {
  h1: {
    fontSize: 32,
    fontWeight: "700" as const,
    lineHeight: 40,
  },
  h2: {
    fontSize: 28,
    fontWeight: "600" as const,
    lineHeight: 36,
  },
  body: {
    fontSize: 16,
    fontWeight: "400" as const,
    lineHeight: 24,
  },
  button: {
    fontSize: 18,
    fontWeight: "600" as const,
    lineHeight: 24,
  },
  caption: {
    fontSize: 14,
    fontWeight: "400" as const,
    lineHeight: 20,
  },
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: "system-ui",
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: "ui-serif",
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: "ui-rounded",
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: "ui-monospace",
  },
  default: {
    sans: "normal",
    serif: "serif",
    rounded: "normal",
    mono: "monospace",
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded:
      "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
