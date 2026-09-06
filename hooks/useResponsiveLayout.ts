import { useWindowDimensions } from "react-native";
import { useMemo } from "react";
import { Spacing } from "@/constants/theme";

interface ResponsiveLayoutValues {
  isLandscape: boolean;
  isPortrait: boolean;
  screenWidth: number;
  screenHeight: number;
  modalWidth: number;
  modalMaxHeight: number;
  spacing: {
    modal: number;
    content: number;
    title: number;
    button: number;
  };
  fontSize: {
    title: number;
    subtitle: number;
    body: number;
    small: number;
  };
  iconSize: {
    large: number;
    medium: number;
    small: number;
  };
  buttonSize: {
    large: number;
    medium: number;
    small: number;
  };
}

export function useResponsiveLayout(): ResponsiveLayoutValues {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const isLandscape = screenWidth > screenHeight;
  const isPortrait = !isLandscape;

  return useMemo(() => {
    const modalWidth = isLandscape 
      ? Math.min(screenWidth * 0.7, 500) 
      : Math.min(screenWidth * 0.95, 600);
    
    const modalMaxHeight = screenHeight * 0.85;

    return {
      isLandscape,
      isPortrait,
      screenWidth,
      screenHeight,
      modalWidth,
      modalMaxHeight,
      spacing: {
        modal: isLandscape ? Spacing.sm : Spacing.lg,
        content: isLandscape ? Spacing.xs : Spacing.md,
        title: isLandscape ? Spacing.xs : Spacing.lg,
        button: isLandscape ? Spacing.sm : Spacing.md,
      },
      fontSize: {
        title: isLandscape ? 18 : 28,
        subtitle: isLandscape ? 12 : 16,
        body: isLandscape ? 12 : 14,
        small: isLandscape ? 10 : 12,
      },
      iconSize: {
        large: isLandscape ? 32 : 48,
        medium: isLandscape ? 24 : 32,
        small: isLandscape ? 16 : 24,
      },
      buttonSize: {
        large: isLandscape ? 44 : 56,
        medium: isLandscape ? 36 : 44,
        small: isLandscape ? 28 : 36,
      },
    };
  }, [screenWidth, screenHeight, isLandscape]);
}

export function getResponsiveValue<T>(
  isLandscape: boolean,
  landscapeValue: T,
  portraitValue: T
): T {
  return isLandscape ? landscapeValue : portraitValue;
}

export function clampDimension(
  value: number,
  min: number,
  max: number
): number {
  return Math.min(Math.max(value, min), max);
}
