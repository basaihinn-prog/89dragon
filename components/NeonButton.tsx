import React, { useEffect } from "react";
import { StyleSheet, Pressable, ViewStyle, StyleProp, ActivityIndicator, View, Platform } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
  WithSpringConfig,
} from "react-native-reanimated";
import { ThemedText } from "@/components/ThemedText";
import { NeonColors, BorderRadius, Spacing, Shadows, createBoxShadow, createTextShadow } from "@/constants/theme";

interface NeonButtonProps {
  onPress?: () => void;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
  loading?: boolean;
  color?: string;
  variant?: "solid" | "outline" | "royale";
}

const springConfig: WithSpringConfig = {
  damping: 10,
  mass: 0.3,
  stiffness: 200,
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function NeonButton({
  onPress,
  children,
  style,
  disabled = false,
  loading = false,
  color = NeonColors.green,
  variant = "solid",
}: NeonButtonProps) {
  const scale = useSharedValue(1);
  const glowOpacity = useSharedValue(0.5);
  const shimmerPosition = useSharedValue(-100);

  useEffect(() => {
    if (!disabled && !loading) {
      glowOpacity.value = withRepeat(
        withSequence(
          withTiming(0.8, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.4, { duration: 1200, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );
    }
  }, [disabled, loading]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  const handlePressIn = () => {
    if (!disabled && !loading) {
      scale.value = withSpring(0.94, springConfig);
      if (Platform.OS !== "web") {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    }
  };

  const handlePressOut = () => {
    if (!disabled && !loading) {
      scale.value = withSpring(1, springConfig);
    }
  };

  const handlePress = () => {
    if (!disabled && !loading && onPress) {
      if (Platform.OS !== "web") {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
      onPress();
    }
  };

  const isDisabled = disabled || loading;

  if (variant === "royale") {
    return (
      <AnimatedPressable
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={isDisabled}
        style={[
          styles.royaleWrapper,
          { opacity: isDisabled ? 0.5 : 1 },
          style,
          animatedStyle,
        ]}
      >
        <Animated.View style={[styles.royaleGlow, glowStyle]} />
        <LinearGradient
          colors={["#FFD700", "#FFA500", "#DAA520", "#FFD700"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.royaleGradient}
        >
          <View style={styles.royaleInner}>
            {loading ? (
              <ActivityIndicator color="#FFD700" size="small" />
            ) : (
              <ThemedText style={styles.royaleText}>{children}</ThemedText>
            )}
          </View>
        </LinearGradient>
      </AnimatedPressable>
    );
  }

  if (variant === "outline") {
    return (
      <AnimatedPressable
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={isDisabled}
        style={[
          styles.outlineButton,
          { borderColor: color, opacity: isDisabled ? 0.5 : 1 },
          style,
          animatedStyle,
        ]}
      >
        <Animated.View 
          style={[
            styles.outlineGlow, 
            { backgroundColor: color, ...createBoxShadow(color, 0, 0, 0.6, 12, 6) },
            glowStyle
          ]} 
        />
        {loading ? (
          <ActivityIndicator color={color} size="small" />
        ) : (
          <ThemedText style={[styles.outlineText, { color }]}>{children}</ThemedText>
        )}
      </AnimatedPressable>
    );
  }

  return (
    <AnimatedPressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={isDisabled}
      style={[
        styles.solidWrapper,
        { opacity: isDisabled ? 0.5 : 1 },
        style,
        animatedStyle,
      ]}
    >
      <Animated.View 
        style={[
          styles.solidGlow, 
          { backgroundColor: color, ...createBoxShadow(color, 0, 0, 0.6, 12, 6) },
          glowStyle
        ]} 
      />
      <LinearGradient
        colors={[color, adjustColor(color, -20)]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.solidGradient}
      >
        {loading ? (
          <ActivityIndicator color="#FFFFFF" size="small" />
        ) : (
          <ThemedText style={styles.solidText}>{children}</ThemedText>
        )}
      </LinearGradient>
    </AnimatedPressable>
  );
}

function adjustColor(hex: string, amount: number): string {
  const num = parseInt(hex.replace("#", ""), 16);
  const r = Math.min(255, Math.max(0, (num >> 16) + amount));
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0x00ff) + amount));
  const b = Math.min(255, Math.max(0, (num & 0x0000ff) + amount));
  return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
}

const styles = StyleSheet.create({
  solidWrapper: {
    borderRadius: BorderRadius.lg,
    overflow: "visible",
  },
  solidGlow: {
    position: "absolute",
    top: -3,
    left: -3,
    right: -3,
    bottom: -3,
    borderRadius: BorderRadius.lg + 3,
  },
  solidGradient: {
    height: Spacing.buttonHeight,
    borderRadius: BorderRadius.lg,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing["2xl"],
  },
  solidText: {
    fontWeight: "700",
    fontSize: 16,
    color: "#FFFFFF",
    ...createTextShadow("rgba(0, 0, 0, 0.3)", 0, 1, 3),
    letterSpacing: 0.5,
  },
  outlineButton: {
    height: Spacing.buttonHeight,
    borderRadius: BorderRadius.lg,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing["2xl"],
    borderWidth: 2,
    backgroundColor: "transparent",
    overflow: "visible",
  },
  outlineGlow: {
    position: "absolute",
    top: -4,
    left: -4,
    right: -4,
    bottom: -4,
    borderRadius: BorderRadius.lg + 4,
  },
  outlineText: {
    fontWeight: "700",
    fontSize: 16,
    letterSpacing: 0.5,
  },
  royaleWrapper: {
    borderRadius: BorderRadius.lg,
    overflow: "visible",
  },
  royaleGlow: {
    position: "absolute",
    top: -5,
    left: -5,
    right: -5,
    bottom: -5,
    borderRadius: BorderRadius.lg + 5,
    backgroundColor: "#FFD700",
    ...createBoxShadow("#FFD700", 0, 0, 0.7, 16, 10),
  },
  royaleGradient: {
    borderRadius: BorderRadius.lg,
    padding: 3,
  },
  royaleInner: {
    height: Spacing.buttonHeight - 6,
    borderRadius: BorderRadius.lg - 3,
    backgroundColor: "rgba(26, 10, 46, 0.9)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing["2xl"],
  },
  royaleText: {
    fontWeight: "900",
    fontSize: 18,
    color: "#FFD700",
    textTransform: "uppercase",
    letterSpacing: 3,
    ...createTextShadow("#FFA500", 0, 0, 10),
  },
});
