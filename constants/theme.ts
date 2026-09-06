import { Platform, ViewStyle, TextStyle } from "react-native";

export function createBoxShadow(
  color: string,
  offsetX: number,
  offsetY: number,
  opacity: number,
  radius: number,
  elevation: number = 4
): ViewStyle {
  if (Platform.OS === "web") {
    return {
      boxShadow: `${offsetX}px ${offsetY}px ${radius}px rgba(${hexToRgb(color)}, ${opacity})`,
    } as ViewStyle;
  }
  return {
    shadowColor: color,
    shadowOffset: { width: offsetX, height: offsetY },
    shadowOpacity: opacity,
    shadowRadius: radius,
    elevation: elevation,
  };
}

export function createTextShadow(
  color: string,
  offsetX: number,
  offsetY: number,
  radius: number
): TextStyle {
  if (Platform.OS === "web") {
    return {
      textShadow: `${offsetX}px ${offsetY}px ${radius}px ${color}`,
    } as TextStyle;
  }
  return {
    textShadowColor: color,
    textShadowOffset: { width: offsetX, height: offsetY },
    textShadowRadius: radius,
  };
}

function hexToRgb(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (result) {
    return `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`;
  }
  if (hex.startsWith("rgba")) {
    const match = hex.match(/rgba?\(([^)]+)\)/);
    if (match) {
      const parts = match[1].split(",").map(s => s.trim());
      return `${parts[0]}, ${parts[1]}, ${parts[2]}`;
    }
  }
  return "0, 0, 0";
}

export const NeonColors = {
  green: "#00FF87",
  purple: "#A020F0",
  blue: "#0099FF",
  pink: "#FF1493",
  gold: "#FFD700",
  orange: "#FF6B35",
  red: "#FF3366",
  cyan: "#00E5FF",
  yellow: "#FFEB3B",
};

export const WheelTierColors = {
  bronze: {
    primary: "#CD7F32",
    secondary: "#B87333",
    gradient: ["#CD7F32", "#8B4513"] as const,
  },
  silver: {
    primary: "#C0C0C0",
    secondary: "#A8A8A8",
    gradient: ["#C0C0C0", "#808080"] as const,
  },
  gold: {
    primary: "#FFD700",
    secondary: "#FFA500",
    gradient: ["#FFD700", "#FF8C00"] as const,
  },
};

export const PremiumColors = {
  platinum: "#E5E4E2",
  platinumLight: "#F5F5F5",
  platinumGlow: "rgba(229, 228, 226, 0.6)",
  platinumShimmer: "rgba(255, 255, 255, 0.9)",
  royalGold: "#D4AF37",
  deepGold: "#B8860B",
  richGold: "#C9A227",
  antiqueGold: "#CFB53B",
  champagne: "#F7E7CE",
  champagneGlow: "rgba(247, 231, 206, 0.5)",
  roseGold: "#B76E79",
  roseGoldGlow: "rgba(183, 110, 121, 0.4)",
  diamond: "#B9F2FF",
  diamondGlow: "rgba(185, 242, 255, 0.4)",
  diamondCore: "#E8F9FF",
  luxuryPurple: "#6B21A8",
  deepViolet: "#4C1D95",
  imperialPurple: "#3D0C5C",
  royalBlue: "#1E3A8A",
  sapphire: "#0F52BA",
  emerald: "#047857",
  emeraldGlow: "rgba(4, 120, 87, 0.4)",
  ruby: "#9F1239",
  rubyGlow: "rgba(159, 18, 57, 0.4)",
  obsidian: "#0A0A0F",
  obsidianDeep: "#050508",
  velvet: "#1A0A2E",
  velvetDeep: "#0D0518",
  onyx: "#0F0F14",
  midnight: "#0E0619",
};

export const GlassColors = {
  darkGlass: "rgba(0, 0, 0, 0.4)",
  lightGlass: "rgba(255, 255, 255, 0.1)",
  cardGlass: "rgba(255, 255, 255, 0.05)",
  borderGlass: "rgba(255, 255, 255, 0.1)",
  purpleGlass: "rgba(75, 0, 130, 0.6)",
  darkPurpleGlass: "rgba(30, 10, 60, 0.8)",
  premiumGlass: "rgba(139, 92, 246, 0.15)",
  luxuryGlass: "rgba(212, 175, 55, 0.08)",
  diamondGlass: "rgba(185, 242, 255, 0.1)",
  frostedPremium: "rgba(255, 255, 255, 0.03)",
  innerGlow: "rgba(255, 255, 255, 0.08)",
};

export const PremiumBorderColors = [
  "#D4AF37", // Royal Gold
  "#8B5CF6", // Purple
  "#FFE5A0", // Light Gold
  "#A855F7", // Violet
  "#D4AF37", // Royal Gold
  "#6366F1", // Indigo
  "#F5E6B3", // Champagne
  "#9333EA", // Deep Purple
] as const;

export const GradientColors = {
  phase1: [NeonColors.green, NeonColors.purple] as const,
  phase2: [NeonColors.purple, NeonColors.blue] as const,
  phase3: [NeonColors.blue, NeonColors.pink] as const,
  full: [NeonColors.green, NeonColors.purple, NeonColors.blue, NeonColors.pink] as const,
  darkPurple: ["#1a0533", "#2d1b4e", "#1a0533"] as const,
  casinoBackground: ["#0A0514", "#12082A", "#1E0D42", "#12082A", "#0A0514"] as const,
  premiumCard: ["rgba(139, 92, 246, 0.5)", "rgba(79, 70, 229, 0.35)", "rgba(139, 92, 246, 0.5)"] as const,
  luxuryGold: ["#D4AF37", "#F5E6B3", "#D4AF37"] as const,
  platinumShine: ["#E5E4E2", "#FFFFFF", "#E5E4E2"] as const,
  diamondShine: ["#B9F2FF", "#FFFFFF", "#B9F2FF"] as const,
  royalPurple: ["#4C1D95", "#6B21A8", "#7C3AED", "#6B21A8", "#4C1D95"] as const,
  premiumSidebar: ["rgba(15, 5, 30, 0.98)", "rgba(25, 10, 50, 0.95)", "rgba(15, 5, 30, 0.98)"] as const,
  eliteBackground: ["#050208", "#0A0514", "#150A28", "#1A0D35", "#150A28", "#0A0514", "#050208"] as const,
  ultraEliteBackground: ["#020105", "#050208", "#0A0514", "#120A25", "#180D32", "#120A25", "#0A0514", "#050208", "#020105"] as const,
  imperialGold: ["#B8860B", "#D4AF37", "#F5E6B3", "#D4AF37", "#B8860B"] as const,
  luxuryRoseGold: ["#8B4854", "#B76E79", "#D4A5AD", "#B76E79", "#8B4854"] as const,
  premiumPlatinum: ["#A8A8A8", "#E5E4E2", "#FFFFFF", "#E5E4E2", "#A8A8A8"] as const,
  eliteCardBorder: ["#D4AF37", "#8B5CF6", "#FFE5A0", "#A855F7", "#D4AF37"] as const,
  vipGoldPurple: ["#D4AF37", "#A855F7", "#6366F1", "#A855F7", "#D4AF37"] as const,
  obsidianShine: ["#0A0A0F", "#1A1A25", "#2A2A35", "#1A1A25", "#0A0A0F"] as const,
  velvetNight: ["#0D0518", "#1A0A2E", "#2D1545", "#1A0A2E", "#0D0518"] as const,
};

export const Colors = {
  light: {
    text: "#FFFFFF",
    textDim: "rgba(255, 255, 255, 0.7)",
    buttonText: "#FFFFFF",
    tabIconDefault: "rgba(255, 255, 255, 0.5)",
    tabIconSelected: NeonColors.green,
    link: NeonColors.blue,
    backgroundRoot: "#0D0D0D",
    backgroundDefault: "#1A1A1A",
    backgroundSecondary: "#252525",
    backgroundTertiary: "#303030",
    neonGreen: NeonColors.green,
    neonPurple: NeonColors.purple,
    neonBlue: NeonColors.blue,
    neonPink: NeonColors.pink,
    gold: NeonColors.gold,
  },
  dark: {
    text: "#FFFFFF",
    textDim: "rgba(255, 255, 255, 0.7)",
    buttonText: "#FFFFFF",
    tabIconDefault: "rgba(255, 255, 255, 0.5)",
    tabIconSelected: NeonColors.green,
    link: NeonColors.blue,
    backgroundRoot: "#0D0D0D",
    backgroundDefault: "#1A1A1A",
    backgroundSecondary: "#252525",
    backgroundTertiary: "#303030",
    neonGreen: NeonColors.green,
    neonPurple: NeonColors.purple,
    neonBlue: NeonColors.blue,
    neonPink: NeonColors.pink,
    gold: NeonColors.gold,
  },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  "2xl": 24,
  "3xl": 32,
  "4xl": 40,
  "5xl": 48,
  inputHeight: 48,
  buttonHeight: 52,
  sidebarWidth: 72,
};

export const BorderRadius = {
  xs: 8,
  sm: 12,
  md: 18,
  lg: 24,
  xl: 30,
  "2xl": 40,
  "3xl": 50,
  full: 9999,
};

export const Typography = {
  h1: {
    fontSize: 32,
    fontWeight: "700" as const,
  },
  h2: {
    fontSize: 28,
    fontWeight: "700" as const,
  },
  h3: {
    fontSize: 24,
    fontWeight: "600" as const,
  },
  h4: {
    fontSize: 20,
    fontWeight: "600" as const,
  },
  body: {
    fontSize: 16,
    fontWeight: "400" as const,
  },
  small: {
    fontSize: 14,
    fontWeight: "400" as const,
  },
  link: {
    fontSize: 16,
    fontWeight: "400" as const,
  },
  balance: {
    fontSize: 28,
    fontWeight: "700" as const,
  },
  gameTitle: {
    fontSize: 14,
    fontWeight: "700" as const,
  },
};

export const Fonts = Platform.select({
  ios: {
    sans: "system-ui",
    serif: "ui-serif",
    rounded: "ui-rounded",
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

export const Shadows = {
  neonGlow: (color: string) => createBoxShadow(color, 0, 0, 0.8, 12, 8),
  premiumGlow: (color: string, intensity: number = 1) => createBoxShadow(color, 0, 0, 0.6 * intensity, 20 * intensity, 12),
  luxuryGoldGlow: createBoxShadow("#D4AF37", 0, 0, 0.5, 16, 10),
  platinumGlow: createBoxShadow("#E5E4E2", 0, 0, 0.4, 14, 8),
  diamondGlow: createBoxShadow("#B9F2FF", 0, 0, 0.5, 18, 10),
  card: createBoxShadow("#000", 0, 4, 0.3, 8, 4),
  premiumCard: createBoxShadow("#000", 0, 8, 0.45, 16, 12),
  eliteCard: createBoxShadow("#8B5CF6", 0, 6, 0.35, 20, 14),
  button: createBoxShadow("#000", 0, 2, 0.25, 4, 3),
  luxuryButton: createBoxShadow("#D4AF37", 0, 4, 0.4, 12, 8),
  innerGlow: createBoxShadow("rgba(255, 255, 255, 0.15)", 0, -1, 1, 2, 1),
};