/**
 * Paleta de cores da identidade visual do aplicativo
 * Foco feminino: calma, conforto e confiabilidade
 */

import { Platform } from "react-native";

// Paleta de cores da identidade visual
export const AppColors = {
  // Cores principais
  base: "#F5F5F5", // Branco Suave (Base)
  action: "#FFB6C1", // Rosa Pêssego (Ação)
  text: "#333333", // Cinza Carvão (Texto)
  success: "#8FEF9F", // Verde Menta (Sucesso)
  alert: "#C67171", // Malva Escuro (Alerta)
  white: "#FFFFFF", // Branco Puro (Cards)
};

// Cores do sistema (mantidas para compatibilidade)
const tintColorLight = AppColors.action;
const tintColorDark = "#fff";

export const Colors = {
  light: {
    text: AppColors.text,
    background: AppColors.base,
    tint: tintColorLight,
    icon: AppColors.text,
    tabIconDefault: AppColors.text,
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: AppColors.text,
    background: AppColors.base,
    tint: tintColorDark,
    icon: AppColors.text,
    tabIconDefault: AppColors.text,
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
  status: {
    fontSize: 40,
    fontWeight: "600" as const,
    lineHeight: 48,
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
