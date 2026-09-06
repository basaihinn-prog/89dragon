import React, { useEffect, useMemo } from "react";
import { View, StyleSheet, useWindowDimensions } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withRepeat,
  withSequence,
  Easing,
} from "react-native-reanimated";

interface ConfettiPiece {
  id: number;
  x: number;
  delay: number;
  color: string;
  size: number;
}

interface ConfettiPieceProps extends ConfettiPiece {
  containerHeight: number;
  duration?: number;
}

function ConfettiPieceComponent({ 
  x, 
  delay, 
  color, 
  size, 
  containerHeight,
  duration = 2500,
}: ConfettiPieceProps) {
  const translateY = useSharedValue(-50);
  const translateX = useSharedValue(0);
  const rotate = useSharedValue(0);
  const opacity = useSharedValue(1);

  useEffect(() => {
    translateY.value = withDelay(
      delay,
      withTiming(containerHeight * 0.8, {
        duration,
        easing: Easing.out(Easing.quad),
      })
    );
    translateX.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(30, { duration: 500 }),
          withTiming(-30, { duration: 500 })
        ),
        5,
        true
      )
    );
    rotate.value = withDelay(
      delay,
      withRepeat(withTiming(360, { duration: 1000 }), -1)
    );
    opacity.value = withDelay(
      delay + duration * 0.8,
      withTiming(0, { duration: duration * 0.2 })
    );
  }, [containerHeight, delay, duration]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { translateX: translateX.value },
      { rotate: `${rotate.value}deg` },
    ],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        {
          position: "absolute",
          left: x,
          top: 0,
          width: size,
          height: size,
          backgroundColor: color,
          borderRadius: size / 4,
        },
        animatedStyle,
      ]}
    />
  );
}

interface ConfettiProps {
  count?: number;
  colors?: string[];
  containerWidth?: number;
  containerHeight?: number;
  minSize?: number;
  maxSize?: number;
  duration?: number;
  visible?: boolean;
}

const DEFAULT_COLORS = [
  "#FFD700", "#FF6B6B", "#4ECDC4", "#A855F7", "#3B82F6", "#10B981",
  "#FF44FF", "#00FF88", "#FF5555", "#FFE5A0",
];

export function Confetti({
  count = 50,
  colors = DEFAULT_COLORS,
  containerWidth,
  containerHeight,
  minSize = 8,
  maxSize = 16,
  duration = 2500,
  visible = true,
}: ConfettiProps) {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  
  const width = containerWidth || screenWidth;
  const height = containerHeight || screenHeight;

  const pieces = useMemo(() => {
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      x: Math.random() * width,
      delay: Math.random() * 600,
      color: colors[Math.floor(Math.random() * colors.length)],
      size: minSize + Math.random() * (maxSize - minSize),
    }));
  }, [count, width, colors, minSize, maxSize]);

  if (!visible) return null;

  return (
    <View style={[styles.container, { pointerEvents: "none" }]}>
      {pieces.map((piece) => (
        <ConfettiPieceComponent
          key={piece.id}
          {...piece}
          containerHeight={height}
          duration={duration}
        />
      ))}
    </View>
  );
}

export function generateConfettiPieces(
  count: number,
  width: number,
  colors: string[] = DEFAULT_COLORS,
  minSize: number = 8,
  maxSize: number = 16,
): ConfettiPiece[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * width,
    delay: Math.random() * 600,
    color: colors[Math.floor(Math.random() * colors.length)],
    size: minSize + Math.random() * (maxSize - minSize),
  }));
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    overflow: "hidden",
  },
});
