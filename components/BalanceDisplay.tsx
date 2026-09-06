import React from "react";
import { View, StyleSheet, Pressable, Platform } from "react-native";
import { Feather } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { ThemedText } from "@/components/ThemedText";
import { NeonColors, Spacing, BorderRadius, GlassColors, createTextShadow } from "@/constants/theme";

interface BalanceDisplayProps {
  balance: number;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  onDepositPress?: () => void;
  onWithdrawPress?: () => void;
}

export function BalanceDisplay({ balance, onRefresh, isRefreshing, onDepositPress, onWithdrawPress }: BalanceDisplayProps) {
  const shimmerOpacity = useSharedValue(1);
  const rotateZ = useSharedValue(0);

  const handleRefresh = () => {
    if (onRefresh && !isRefreshing) {
      rotateZ.value = withSequence(
        withTiming(360, { duration: 500 }),
        withTiming(0, { duration: 0 })
      );
      shimmerOpacity.value = withSequence(
        withTiming(0.5, { duration: 150 }),
        withTiming(1, { duration: 150 })
      );
      onRefresh();
    }
  };

  const rotateStyle = useAnimatedStyle(() => ({
    transform: [{ rotateZ: `${rotateZ.value}deg` }],
  }));

  const shimmerStyle = useAnimatedStyle(() => ({
    opacity: shimmerOpacity.value,
  }));

  const numericBalance = Number(balance) || 0;
  const formattedBalance = numericBalance.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  });

  const Content = () => (
    <View style={styles.content}>
      {onDepositPress ? (
        <Pressable
          onPress={onDepositPress}
          style={({ pressed }) => [
            styles.actionButton,
            styles.depositButton,
            { opacity: pressed ? 0.7 : 1 },
          ]}
        >
          <Feather name="plus" size={14} color="#10B981" />
        </Pressable>
      ) : null}
      
      <Animated.Text style={[styles.balanceText, shimmerStyle]}>
        {formattedBalance}
      </Animated.Text>
      {onRefresh ? (
        <Pressable
          onPress={handleRefresh}
          disabled={isRefreshing}
          style={({ pressed }) => [
            styles.refreshButton,
            { opacity: pressed || isRefreshing ? 0.5 : 1 },
          ]}
          hitSlop={8}
        >
          <Animated.View style={rotateStyle}>
            <Feather name="refresh-cw" size={16} color={NeonColors.gold} />
          </Animated.View>
        </Pressable>
      ) : null}
      
      {onWithdrawPress ? (
        <Pressable
          onPress={onWithdrawPress}
          style={({ pressed }) => [
            styles.actionButton,
            styles.withdrawButton,
            { opacity: pressed ? 0.7 : 1 },
          ]}
        >
          <Feather name="minus" size={14} color="#F59E0B" />
        </Pressable>
      ) : null}
    </View>
  );

  if (Platform.OS === "ios") {
    return (
      <BlurView intensity={30} tint="dark" style={styles.container}>
        <Content />
      </BlurView>
    );
  }

  return (
    <View style={[styles.container, styles.androidBackground]}>
      <Content />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: BorderRadius.md,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: GlassColors.borderGlass,
  },
  androidBackground: {
    backgroundColor: GlassColors.darkGlass,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  balanceText: {
    fontSize: 18,
    fontWeight: "700",
    color: NeonColors.gold,
    ...createTextShadow(NeonColors.gold, 0, 0, 6),
  },
  refreshButton: {
    padding: Spacing.xs,
  },
  actionButton: {
    width: 28,
    height: 28,
    borderRadius: BorderRadius.full,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  depositButton: {
    backgroundColor: "rgba(16, 185, 129, 0.15)",
    borderColor: "rgba(16, 185, 129, 0.4)",
  },
  withdrawButton: {
    backgroundColor: "rgba(245, 158, 11, 0.15)",
    borderColor: "rgba(245, 158, 11, 0.4)",
  },
});
