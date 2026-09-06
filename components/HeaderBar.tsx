import React from "react";
import { View, StyleSheet, Pressable, Image, Platform } from "react-native";
import { Feather } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ThemedText } from "@/components/ThemedText";
import { BalanceDisplay } from "@/components/BalanceDisplay";
import { NeonColors, Spacing, BorderRadius, GlassColors, createTextShadow } from "@/constants/theme";

interface HeaderBarProps {
  balance: number;
  onRefreshBalance?: () => void;
  isRefreshing?: boolean;
  onProfilePress: () => void;
  onDepositPress?: () => void;
  onWithdrawPress?: () => void;
  username?: string;
}

export function HeaderBar({
  balance,
  onRefreshBalance,
  isRefreshing,
  onProfilePress,
  onDepositPress,
  onWithdrawPress,
  username,
}: HeaderBarProps) {
  const insets = useSafeAreaInsets();

  const Content = () => (
    <View style={[styles.content, { paddingTop: insets.top + Spacing.sm }]}>
      <View style={styles.leftSection}>
        <Image
          source={require("../assets/images/icon.png")}
          style={styles.logo}
          resizeMode="contain"
        />
        <ThemedText style={styles.appName}>Jade Royale</ThemedText>
      </View>

      <View style={styles.rightSection}>
        <BalanceDisplay
          balance={balance}
          onRefresh={onRefreshBalance}
          isRefreshing={isRefreshing}
          onDepositPress={onDepositPress}
          onWithdrawPress={onWithdrawPress}
        />
        <Pressable
          onPress={onProfilePress}
          style={({ pressed }) => [
            styles.profileButton,
            { opacity: pressed ? 0.7 : 1 },
          ]}
        >
          <Feather name="user" size={20} color="#FFFFFF" />
        </Pressable>
      </View>
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
    position: "absolute",
    top: 0,
    left: Spacing.sidebarWidth,
    right: 0,
    zIndex: 50,
  },
  androidBackground: {
    backgroundColor: GlassColors.darkGlass,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
  leftSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  logo: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.sm,
  },
  appName: {
    fontSize: 20,
    fontWeight: "700",
    color: "#FFFFFF",
    ...createTextShadow(NeonColors.green, 0, 0, 8),
  },
  rightSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  profileButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    backgroundColor: GlassColors.cardGlass,
    borderWidth: 1,
    borderColor: GlassColors.borderGlass,
    alignItems: "center",
    justifyContent: "center",
  },
});
