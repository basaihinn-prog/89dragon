import React from "react";
import { View, StyleSheet, ViewStyle, StyleProp, Platform } from "react-native";
import { BlurView } from "expo-blur";
import { BorderRadius, GlassColors, Spacing } from "@/constants/theme";

interface GlassCardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  intensity?: number;
}

export function GlassCard({ children, style, intensity = 20 }: GlassCardProps) {
  if (Platform.OS === "ios") {
    return (
      <BlurView intensity={intensity} tint="dark" style={[styles.container, style]}>
        <View style={styles.border}>{children}</View>
      </BlurView>
    );
  }

  return (
    <View style={[styles.container, styles.androidBackground, style]}>
      <View style={styles.border}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: BorderRadius.md,
    overflow: "hidden",
  },
  androidBackground: {
    backgroundColor: GlassColors.darkGlass,
  },
  border: {
    borderWidth: 1,
    borderColor: GlassColors.borderGlass,
    borderRadius: BorderRadius.md,
  },
});
