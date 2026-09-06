import React, { useEffect } from "react";
import { View, StyleSheet, Pressable, Platform, useWindowDimensions } from "react-native";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
  WithSpringConfig,
  interpolate,
} from "react-native-reanimated";
import { ThemedText } from "@/components/ThemedText";
import { NeonColors, Spacing, BorderRadius, PremiumColors, createBoxShadow, createTextShadow } from "@/constants/theme";

const neonBellIcon = require("@/attached_assets/generated_images/neon_bell_alerts_icon.png");
const neonGiftIcon = require("@/attached_assets/generated_images/neon_gift_bonus_icon.png");
const neonSettingsIcon = require("@/attached_assets/generated_images/neon_settings_gear_icon.png");
const premiumSpinWheelIcon = require("@/attached_assets/generated_images/premium_elite_spin_wheel_icon.png");
const defaultAvatarImage = require("@/assets/images/icon.png");

interface BottomActionBarProps {
  onSpinWheelPress?: () => void;
  onBonusPress?: () => void;
  onNotificationPress?: () => void;
  onProfilePress?: () => void;
  onSettingsPress?: () => void;
  onDepositPress?: () => void;
  onWithdrawPress?: () => void;
  avatarUrl?: string;
}

const springConfig: WithSpringConfig = {
  damping: 12,
  mass: 0.4,
  stiffness: 200,
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function PremiumNeonButton({
  icon,
  label,
  neonColor,
  onPress,
  size = 48,
}: {
  icon: React.ReactNode;
  label: string;
  neonColor: string;
  onPress?: () => void;
  size?: number;
}) {
  const scale = useSharedValue(1);
  const glowPulse = useSharedValue(0.3);
  const borderGlow = useSharedValue(0.5);
  const cornerRadius = 12;

  useEffect(() => {
    glowPulse.value = withRepeat(
      withSequence(
        withTiming(0.7, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.3, { duration: 1500, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
    borderGlow.value = withRepeat(
      withSequence(
        withTiming(0.9, { duration: 1800, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.5, { duration: 1800, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowPulse.value,
  }));

  const borderStyle = useAnimatedStyle(() => ({
    opacity: borderGlow.value,
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.92, springConfig);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, springConfig);
  };

  const handlePress = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    onPress?.();
  };

  return (
    <View style={styles.actionButtonWrapper}>
      <AnimatedPressable
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[styles.neonButtonWrapper, animatedStyle]}
      >
        <Animated.View 
          style={[
            styles.buttonGlowEffect, 
            { 
              backgroundColor: neonColor,
              ...createBoxShadow(neonColor, 0, 0, 0.6, 12, 6),
              borderRadius: cornerRadius + 4,
              pointerEvents: "none",
            },
            glowStyle
          ]} 
        />
        
        <View
          style={[
            styles.neonOutlineButton,
            { 
              width: size, 
              height: size, 
              borderRadius: cornerRadius,
              borderColor: neonColor,
            },
          ]}
        >
          <LinearGradient
            colors={[neonColor + "30", "rgba(15, 8, 25, 0.95)", neonColor + "15"]}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={[styles.buttonGradientBg, { borderRadius: cornerRadius }]}
          />
          
          <Animated.View style={[styles.buttonBorderGlow, { borderColor: neonColor, pointerEvents: "none" }, borderStyle]} />

          <View style={styles.iconContainer}>
            {icon}
          </View>
          
          <View style={[styles.buttonTopHighlight, { borderRadius: cornerRadius, pointerEvents: "none" }]} />
        </View>
      </AnimatedPressable>
      <View style={styles.labelContainer}>
        <ThemedText style={[styles.actionLabel, { color: neonColor, ...createTextShadow(neonColor, 0, 0, 6) }]}>
          {label}
        </ThemedText>
      </View>
    </View>
  );
}

function PremiumEliteSpinWheel({ size = 100 }: { size?: number }) {
  const diamondGlow = useSharedValue(0.5);
  
  useEffect(() => {
    diamondGlow.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.5, { duration: 1000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, []);
  
  const diamondStyle = useAnimatedStyle(() => ({
    opacity: diamondGlow.value,
  }));
  
  return (
    <View style={[styles.eliteWheelContainer, { width: size, height: size }]}>
      <Image 
        source={premiumSpinWheelIcon} 
        style={{ width: size * 0.95, height: size * 0.95 }}
        contentFit="contain"
      />
      <Animated.View style={[styles.eliteDiamondGlow, diamondStyle, { pointerEvents: "none" }]} />
    </View>
  );
}

const neonDepositIcon = require("@/attached_assets/generated_images/neon_gift_bonus_icon.png");

export function BottomActionBar({
  onSpinWheelPress,
  onBonusPress,
  onNotificationPress,
  onProfilePress,
  onSettingsPress,
  onDepositPress,
  onWithdrawPress,
  avatarUrl,
}: BottomActionBarProps) {
  const insets = useSafeAreaInsets();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const isLandscape = screenWidth > screenHeight;
  const sidebarOffset = isLandscape ? 76 : 0;
  const spinScale = useSharedValue(1);
  const spinGlow = useSharedValue(0.4);
  const spinRotation = useSharedValue(0);
  const borderShimmer = useSharedValue(0);

  useEffect(() => {
    spinGlow.value = withRepeat(
      withSequence(
        withTiming(0.85, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.4, { duration: 1200, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );

    spinRotation.value = withRepeat(
      withTiming(360, { duration: 15000, easing: Easing.linear }),
      -1,
      false
    );

    borderShimmer.value = withRepeat(
      withTiming(1, { duration: 2000, easing: Easing.linear }),
      -1,
      false
    );
  }, []);

  const spinAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: spinScale.value }],
  }));

  const spinGlowStyle = useAnimatedStyle(() => ({
    opacity: spinGlow.value,
  }));

  const wheelRotationStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${spinRotation.value}deg` }],
  }));

  const shimmerStyle = useAnimatedStyle(() => ({
    opacity: interpolate(borderShimmer.value, [0, 0.5, 1], [0.3, 0.8, 0.3]),
  }));

  const handleSpinPressIn = () => {
    spinScale.value = withSpring(0.94, springConfig);
  };

  const handleSpinPressOut = () => {
    spinScale.value = withSpring(1, springConfig);
  };

  const handleSpinPress = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }
    onSpinWheelPress?.();
  };

  const minPortraitButtonSize = Math.min(32, (screenWidth - 100) / 8);
  const buttonSize = isLandscape ? 40 : Math.max(26, minPortraitButtonSize);
  const largeButtonSize = isLandscape ? 44 : Math.max(30, minPortraitButtonSize + 4);
  const spinWheelSize = isLandscape ? 100 : Math.max(50, Math.min(70, screenWidth / 6));
  const spinWheelHeight = isLandscape ? 55 : Math.max(30, Math.min(40, screenWidth / 10));
  const contentGap = isLandscape ? Spacing.xl * 1.5 : Math.max(4, Math.min(Spacing.sm, (screenWidth - 280) / 8));
  const iconSize = Math.floor(buttonSize * 0.65);
  const featherIconSize = Math.floor(buttonSize * 0.55);

  const barZIndex = isLandscape ? 99 : 150;

  return (
    <View style={[styles.container, { paddingBottom: 0, left: sidebarOffset, zIndex: barZIndex }]}>
      <LinearGradient
        colors={["transparent", "rgba(10, 5, 20, 0.6)", "rgba(10, 5, 20, 0.8)"]}
        style={styles.backgroundGradient}
      />
      
      <View style={[styles.content, { gap: contentGap }]}>
        <PremiumNeonButton
          icon={
            <View style={{ width: iconSize, height: iconSize, borderRadius: iconSize / 2, overflow: "hidden", borderWidth: 2, borderColor: "#EC4899" }}>
              <Image 
                source={avatarUrl ? { uri: avatarUrl } : defaultAvatarImage} 
                style={{ width: "100%", height: "100%" }} 
                contentFit="cover" 
              />
            </View>
          }
          label="Profile"
          neonColor="#EC4899"
          onPress={onProfilePress}
          size={buttonSize}
        />

        <PremiumNeonButton
          icon={<Image source={neonBellIcon} style={{ width: iconSize, height: iconSize }} contentFit="contain" />}
          label="Alerts"
          neonColor="#FFD700"
          onPress={onNotificationPress}
          size={buttonSize}
        />

        <PremiumNeonButton
          icon={<Feather name="plus-circle" size={featherIconSize} color="#10B981" />}
          label="Deposit"
          neonColor="#10B981"
          onPress={onDepositPress}
          size={buttonSize}
        />

        <View style={styles.spinWheelWrapper}>
          <AnimatedPressable
            onPress={handleSpinPress}
            onPressIn={handleSpinPressIn}
            onPressOut={handleSpinPressOut}
            style={[styles.spinWheelButton, spinAnimatedStyle, { width: spinWheelSize, height: spinWheelHeight }]}
          >
            <Animated.View style={[styles.spinWheelGlow, spinGlowStyle, !isLandscape && { top: -8, left: -10, right: -10, bottom: -3 }]} />
            
            <View style={[styles.spinWheelClipContainer, { width: spinWheelSize, height: spinWheelHeight, borderTopLeftRadius: spinWheelHeight, borderTopRightRadius: spinWheelHeight }]}>
              <View style={[styles.spinWheelBorderGradient, { borderTopLeftRadius: spinWheelHeight, borderTopRightRadius: spinWheelHeight }]}>
                <LinearGradient
                  colors={[PremiumColors.royalGold, "#FFE5A0", PremiumColors.royalGold, "#B8860B"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.spinBorderInner}
                />
              </View>
              
              <View style={[styles.spinWheelPointerTop, !isLandscape && { top: 2, borderLeftWidth: 6, borderRightWidth: 6, borderBottomWidth: 10 }]}>
                <LinearGradient
                  colors={[PremiumColors.royalGold, "#FFE5A0"]}
                  style={styles.pointerGradient}
                />
              </View>
              
              <Animated.View style={[styles.wheelRotator, wheelRotationStyle, !isLandscape && { top: 3 }]}>
                <PremiumEliteSpinWheel size={isLandscape ? 95 : Math.min(65, spinWheelSize * 0.95)} />
              </Animated.View>

              <Animated.View style={[styles.borderShimmer, shimmerStyle, { borderTopLeftRadius: spinWheelHeight, borderTopRightRadius: spinWheelHeight }]}>
                <LinearGradient
                  colors={["transparent", "rgba(255, 255, 255, 0.6)", "transparent"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={StyleSheet.absoluteFill}
                />
              </Animated.View>
            </View>
          </AnimatedPressable>
          <ThemedText style={[styles.spinLabel, !isLandscape && { fontSize: 8, marginTop: 2 }]}>SPIN</ThemedText>
        </View>

        <PremiumNeonButton
          icon={<Feather name="minus-circle" size={featherIconSize} color="#F59E0B" />}
          label="Cashout"
          neonColor="#F59E0B"
          onPress={onWithdrawPress}
          size={buttonSize}
        />

        <PremiumNeonButton
          icon={<Image source={neonGiftIcon} style={{ width: iconSize, height: iconSize }} contentFit="contain" />}
          label="Bonus"
          neonColor="#FF44FF"
          onPress={onBonusPress}
          size={buttonSize}
        />

        <PremiumNeonButton
          icon={<Image source={neonSettingsIcon} style={{ width: iconSize, height: iconSize }} contentFit="contain" />}
          label="Settings"
          neonColor="#8B5CF6"
          onPress={onSettingsPress}
          size={buttonSize}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    right: 0,
    bottom: 0,
    zIndex: 99,
    alignItems: "center",
  },
  backgroundGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  content: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "center",
    gap: Spacing.xl * 1.5,
    paddingVertical: Spacing.xs,
  },
  actionButtonWrapper: {
    alignItems: "center",
    gap: 4,
    marginBottom: 10,
  },
  neonButtonWrapper: {
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
  },
  buttonGlowEffect: {
    position: "absolute",
    top: -4,
    left: -4,
    right: -4,
    bottom: -4,
  },
  neonOutlineButton: {
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    backgroundColor: "rgba(8, 4, 16, 0.9)",
    overflow: "hidden",
  },
  buttonGradientBg: {
    ...StyleSheet.absoluteFillObject,
  },
  buttonBorderGlow: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderWidth: 1,
    borderRadius: 12,
  },
  buttonTopHighlight: {
    position: "absolute",
    top: 0,
    left: 3,
    right: 3,
    height: 1,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
  },
  iconContainer: {
    zIndex: 10,
  },
  labelContainer: {
    alignItems: "center",
  },
  actionLabel: {
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  spinWheelWrapper: {
    alignItems: "center",
  },
  spinWheelButton: {
    width: 100,
    height: 55,
    overflow: "visible",
  },
  spinWheelGlow: {
    position: "absolute",
    top: -12,
    left: -14,
    right: -14,
    bottom: -4,
    borderTopLeftRadius: 65,
    borderTopRightRadius: 65,
    backgroundColor: PremiumColors.royalGold,
    ...createBoxShadow(PremiumColors.royalGold, 0, -6, 0.8, 30, 16),
  },
  spinWheelClipContainer: {
    width: 100,
    height: 55,
    alignItems: "center",
    overflow: "hidden",
    borderTopLeftRadius: 55,
    borderTopRightRadius: 55,
    backgroundColor: "transparent",
    position: "relative",
  },
  spinWheelBorderGradient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderTopLeftRadius: 55,
    borderTopRightRadius: 55,
    borderWidth: 3,
    borderBottomWidth: 0,
    borderColor: PremiumColors.royalGold,
    overflow: "hidden",
  },
  spinBorderInner: {
    flex: 1,
  },
  spinWheelPointerTop: {
    position: "absolute",
    top: 4,
    zIndex: 10,
    width: 0,
    height: 0,
    borderLeftWidth: 9,
    borderRightWidth: 9,
    borderBottomWidth: 14,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderBottomColor: PremiumColors.royalGold,
    overflow: "hidden",
  },
  pointerGradient: {
    position: "absolute",
    top: 0,
    left: -9,
    width: 18,
    height: 14,
  },
  wheelRotator: {
    position: "absolute",
    top: 5,
  },
  wheelVisual: {
    borderRadius: 50,
    overflow: "hidden",
    position: "relative",
  },
  wheelSlice: {
    position: "absolute",
    width: "50%",
    height: "50%",
    left: "25%",
    top: 0,
    transformOrigin: "bottom center",
  },
  wheelOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 50,
  },
  wheelCenterDot: {
    position: "absolute",
    top: "50%",
    left: "50%",
    width: 20,
    height: 20,
    marginTop: -10,
    marginLeft: -10,
    borderRadius: 10,
    overflow: "hidden",
  },
  wheelCenterGradient: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#B8860B",
    borderRadius: 10,
  },
  wheelCenterInnerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#6B4E0A",
  },
  borderShimmer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderTopLeftRadius: 55,
    borderTopRightRadius: 55,
  },
  spinLabel: {
    fontSize: 10,
    color: PremiumColors.royalGold,
    fontWeight: "800",
    marginTop: 4,
    letterSpacing: 1.5,
    ...createTextShadow(PremiumColors.royalGold, 0, 0, 10),
  },
  eliteWheelContainer: {
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 50,
    overflow: "hidden",
    position: "relative",
  },
  eliteDiamondGlow: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 50,
    backgroundColor: "rgba(255, 215, 0, 0.15)",
    ...createBoxShadow("#FFD700", 0, 0, 1, 20, 10),
  },
});
