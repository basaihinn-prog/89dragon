import React, { useEffect } from "react";
import { StyleSheet, ViewStyle, StyleProp } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  interpolateColor,
  Easing,
} from "react-native-reanimated";
import { NeonColors } from "@/constants/theme";

interface AnimatedGradientProps {
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
}

const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient);

export function AnimatedGradient({ style, children }: AnimatedGradientProps) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withRepeat(
      withTiming(1, { duration: 10000, easing: Easing.linear }),
      -1,
      false
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    const phase = progress.value;
    return {
      opacity: 1,
    };
  });

  return (
    <Animated.View style={[styles.container, style, animatedStyle]}>
      <LinearGradient
        colors={[
          NeonColors.green,
          NeonColors.purple,
          NeonColors.blue,
          NeonColors.pink,
        ]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <Animated.View style={[StyleSheet.absoluteFill, styles.overlay]} />
      {children}
    </Animated.View>
  );
}

export function StaticGradient({ style, children }: AnimatedGradientProps) {
  return (
    <LinearGradient
      colors={[
        NeonColors.green,
        NeonColors.purple,
        NeonColors.blue,
        NeonColors.pink,
      ]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.container, style]}
    >
      {children}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  overlay: {
    backgroundColor: "rgba(0, 0, 0, 0.3)",
  },
});
