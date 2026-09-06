import React, { useEffect, useState, useRef } from "react";
import { View, StyleSheet, Pressable, Platform, useWindowDimensions } from "react-native";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Image } from "expo-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const neonSettingsIcon = require("@/attached_assets/generated_images/neon_settings_gear_icon.png");
const jadeRoyaleLogo = require("@/attached_assets/0975C570-66A0-4B19-94AC-C481B54B960A_1765012551750.jpeg");
const defaultAvatarImage = require("@/assets/images/icon.png");
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
  interpolate,
  runOnJS,
} from "react-native-reanimated";
import { ThemedText } from "@/components/ThemedText";
import { Spacing, BorderRadius, PremiumColors, createBoxShadow, createTextShadow } from "@/constants/theme";
import { Jackpot, getJackpots } from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";

interface TopHeaderBarProps {
  balance: number;
}

interface Win {
  id: number;
  playerName: string;
  gameName: string;
  amount: number;
}

const springConfig: WithSpringConfig = {
  damping: 12,
  mass: 0.4,
  stiffness: 200,
};

const DISPLAY_DURATION = 4000;

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function AnimatedIconButton({
  children,
  onPress,
  style,
  glowColor,
}: {
  children: React.ReactNode;
  onPress: () => void;
  style?: any;
  glowColor?: string;
}) {
  const scale = useSharedValue(1);
  const glowOpacity = useSharedValue(0.3);
  const ringPulse = useSharedValue(0.5);

  useEffect(() => {
    if (glowColor) {
      glowOpacity.value = withRepeat(
        withSequence(
          withTiming(0.7, { duration: 1800, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.3, { duration: 1800, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );
      ringPulse.value = withRepeat(
        withSequence(
          withTiming(0.8, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.4, { duration: 2000, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );
    }
  }, [glowColor]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  const ringStyle = useAnimatedStyle(() => ({
    opacity: ringPulse.value,
    transform: [{ scale: interpolate(ringPulse.value, [0.4, 0.8], [0.95, 1.05]) }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.88, springConfig);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, springConfig);
  };

  const handlePress = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onPress();
  };

  return (
    <AnimatedPressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[styles.buttonWrapper, animatedStyle, style]}
    >
      {glowColor ? (
        <>
          <Animated.View 
            style={[
              styles.buttonGlow, 
              { backgroundColor: glowColor, ...createBoxShadow(glowColor, 0, 0, 0.6, 12, 6) },
              glowStyle
            ]} 
          />
          <Animated.View 
            style={[
              styles.buttonRing, 
              { borderColor: glowColor },
              ringStyle
            ]} 
          />
        </>
      ) : null}
      {children}
    </AnimatedPressable>
  );
}

function LuxuryCoinStack() {
  const rotation = useSharedValue(0);
  const shimmer = useSharedValue(0);
  const float = useSharedValue(0);

  useEffect(() => {
    rotation.value = withRepeat(
      withSequence(
        withTiming(-8, { duration: 2500, easing: Easing.inOut(Easing.ease) }),
        withTiming(8, { duration: 2500, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );

    shimmer.value = withRepeat(
      withTiming(1, { duration: 2500, easing: Easing.linear }),
      -1,
      false
    );

    float.value = withRepeat(
      withSequence(
        withTiming(-2, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
        withTiming(2, { duration: 1500, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, []);

  const coinStyle = useAnimatedStyle(() => ({
    transform: [
      { rotateY: `${rotation.value}deg` },
      { translateY: float.value },
    ],
  }));

  const shimmerStyle = useAnimatedStyle(() => ({
    opacity: interpolate(shimmer.value, [0, 0.5, 1], [0.3, 0.7, 0.3]),
    transform: [{ translateX: interpolate(shimmer.value, [0, 1], [-10, 30]) }],
  }));

  return (
    <Animated.View style={[styles.coinStack, coinStyle]}>
      <View style={[styles.coin, styles.coinBack]} />
      <View style={[styles.coin, styles.coinMiddle]} />
      <LinearGradient
        colors={[PremiumColors.royalGold, "#FFF8DC", PremiumColors.royalGold]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.coin, styles.coinFront]}
      >
        <ThemedText style={styles.coinSymbol}>$</ThemedText>
        <Animated.View style={[styles.coinShimmer, shimmerStyle]}>
          <LinearGradient
            colors={["transparent", "rgba(255, 255, 255, 0.8)", "transparent"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
      </LinearGradient>
      <View style={styles.coinGlow} />
    </Animated.View>
  );
}

function NeonLogo({ isPortrait = false }: { isPortrait?: boolean }) {
  return (
    <View style={styles.logoContainer}>
      <View style={styles.logoFrame}>
        <Image 
          source={jadeRoyaleLogo} 
          style={isPortrait ? styles.logoImagePortrait : styles.logoImage}
          contentFit="contain"
        />
      </View>
    </View>
  );
}

function CompactWinsTicker() {
  const { token } = useAuth();
  const [wins, setWins] = useState<Win[]>([]);
  const scrollX = useSharedValue(0);
  const pulseAnim = useSharedValue(0.5);
  const ITEM_WIDTH = 120;

  useEffect(() => {
    pulseAnim.value = withRepeat(
      withSequence(
        withTiming(0.8, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.5, { duration: 1500, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, []);

  useEffect(() => {
    if (token) {
      fetchWins();
      const fetchInterval = setInterval(fetchWins, 60000);
      return () => clearInterval(fetchInterval);
    }
  }, [token]);

  useEffect(() => {
    if (wins.length > 0) {
      const totalWidth = wins.length * ITEM_WIDTH;
      scrollX.value = 0;
      scrollX.value = withRepeat(
        withTiming(-totalWidth, { duration: wins.length * 3000, easing: Easing.linear }),
        -1,
        false
      );
    }
  }, [wins]);

  const fetchWins = async () => {
    if (!token) return;
    
    try {
      const result = await getJackpots(token);
      if (result.success && result.data) {
        const filteredWins = result.data
          .filter((j: Jackpot) => {
            const amount = parseFloat(j.sum || "0");
            return amount > 0 && amount < 500;
          })
          .slice(0, 20)
          .map((j: Jackpot) => ({
            id: j.id,
            playerName: j.user || j.name || "Player",
            gameName: j.game || "Slots",
            amount: parseFloat(j.sum || "0"),
          }));
        
        if (filteredWins.length > 0) {
          setWins(filteredWins);
        } else {
          setWins(generateSampleWins());
        }
      } else {
        setWins(generateSampleWins());
      }
    } catch (error) {
      setWins(generateSampleWins());
    }
  };

  const generateSampleWins = (): Win[] => {
    const games = ["Gates of Olympus", "Buffalo Blitz", "Aztec Gems", "Crystal Ball", "Wolf Moon"];
    const names = ["Luc***", "Mar***", "Jam***", "Ale***", "Sop***", "Oli***", "Emi***", "Noa***"];
    
    return Array.from({ length: 8 }, (_, i) => ({
      id: i + 1,
      playerName: names[Math.floor(Math.random() * names.length)],
      gameName: games[Math.floor(Math.random() * games.length)],
      amount: Math.floor(Math.random() * 450) + 10,
    }));
  };

  const scrollStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: scrollX.value }],
  }));

  const pulseStyle = useAnimatedStyle(() => ({
    opacity: pulseAnim.value,
  }));

  if (wins.length === 0) {
    return null;
  }

  const doubledWins = [...wins, ...wins];

  return (
    <View style={styles.winsContainer}>
      <Animated.View style={[styles.winsGlowBg, pulseStyle]} />
      
      <LinearGradient
        colors={["rgba(16, 185, 129, 0.2)", "rgba(139, 92, 246, 0.15)", "rgba(16, 185, 129, 0.2)"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.winsGradient}
      >
        <View style={styles.winsIconContainer}>
          <LinearGradient
            colors={[PremiumColors.royalGold, "#FFE5A0"]}
            style={styles.winsIconBg}
          >
            <Feather name="award" size={10} color="#1A0D35" />
          </LinearGradient>
        </View>

        <View style={styles.winsScrollMask}>
          <Animated.View style={[styles.winsScrollContent, scrollStyle]}>
            {doubledWins.map((win, index) => (
              <View key={`${win.id}-${index}`} style={styles.winsItem}>
                <ThemedText style={styles.winsPlayerName} numberOfLines={1}>
                  {win.playerName}
                </ThemedText>
                <ThemedText style={styles.winsAmount}>
                  ${win.amount.toFixed(0)}
                </ThemedText>
              </View>
            ))}
          </Animated.View>
        </View>
      </LinearGradient>

      <View style={styles.winsTopHighlight} />
    </View>
  );
}

export function TopHeaderBar({
  balance,
}: TopHeaderBarProps) {
  const insets = useSafeAreaInsets();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const isLandscape = screenWidth > screenHeight;
  const balanceGlow = useSharedValue(0.3);
  const balanceShimmer = useSharedValue(0);
  const borderPulse = useSharedValue(0.4);

  useEffect(() => {
    balanceGlow.value = withRepeat(
      withSequence(
        withTiming(0.6, { duration: 2500, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.3, { duration: 2500, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );

    balanceShimmer.value = withRepeat(
      withTiming(1, { duration: 4000, easing: Easing.linear }),
      -1,
      false
    );

    borderPulse.value = withRepeat(
      withSequence(
        withTiming(0.7, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.4, { duration: 2000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, []);

  const balanceGlowStyle = useAnimatedStyle(() => ({
    opacity: balanceGlow.value,
  }));

  const shimmerStyle = useAnimatedStyle(() => ({
    opacity: interpolate(balanceShimmer.value, [0, 0.5, 1], [0, 0.4, 0]),
    transform: [{ translateX: interpolate(balanceShimmer.value, [0, 1], [-60, 120]) }],
  }));

  const borderStyle = useAnimatedStyle(() => ({
    opacity: borderPulse.value,
  }));

  return (
    <View style={[styles.container, { paddingTop: Math.max(insets.top - 16, 0) }]}>
      <View style={styles.middleSection}>
        <CompactWinsTicker />
        <View style={!isLandscape ? styles.logoPortraitPosition : undefined}>
          <NeonLogo isPortrait={!isLandscape} />
        </View>
        <View style={[styles.balanceSection, !isLandscape && styles.balanceSectionPortrait]}>
          <View style={styles.balanceContainer}>
            <Animated.View style={[styles.balanceGlow, balanceGlowStyle]} />
            
            <LinearGradient
              colors={["rgba(212, 175, 55, 0.25)", "rgba(139, 92, 246, 0.35)", "rgba(79, 70, 229, 0.3)", "rgba(139, 92, 246, 0.35)", "rgba(212, 175, 55, 0.25)"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.balanceBar}
            >
              <Animated.View style={[styles.borderGlow, borderStyle]}>
                <LinearGradient
                  colors={["rgba(212, 175, 55, 0.6)", "rgba(139, 92, 246, 0.5)", "rgba(212, 175, 55, 0.6)"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.borderGlowInner}
                />
              </Animated.View>

              <View style={styles.balanceTextRow}>
                <View style={styles.miniCoin}>
                  <LinearGradient
                    colors={[PremiumColors.royalGold, "#FFF8DC", PremiumColors.royalGold]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.miniCoinGradient}
                  />
                </View>
                <ThemedText style={styles.balanceText}>
                  {(Number(balance) || 0).toFixed(2)}
                </ThemedText>
              </View>

              <Animated.View style={[styles.balanceShimmer, shimmerStyle]}>
                <LinearGradient
                  colors={["transparent", "rgba(255, 255, 255, 0.5)", "transparent"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={StyleSheet.absoluteFill}
                />
              </Animated.View>

              <View style={styles.balanceTopHighlight} />
            </LinearGradient>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    left: 70,
    right: 0,
    zIndex: 100,
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.sm,
    paddingBottom: 0,
    overflow: "visible",
  },
  middleSection: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: Spacing.sm,
    overflow: "visible",
  },
  logoContainer: {
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
    overflow: "visible",
    marginTop: -4,
    flex: 0,
  },
  logoGlitterBorder: {
    position: "absolute",
    top: -8,
    left: -24,
    right: -24,
    bottom: -8,
    borderRadius: BorderRadius.lg,
    overflow: "hidden",
  },
  logoOuterGlow: {
    position: "absolute",
    top: -6,
    left: -20,
    right: -20,
    bottom: -6,
    backgroundColor: "rgba(16, 185, 129, 0.15)",
    borderRadius: BorderRadius.md,
    ...createBoxShadow("#10B981", 0, 0, 0.5, 20, 8),
  },
  logoFrame: {
    position: "relative",
    borderRadius: BorderRadius.md,
    overflow: "hidden",
  },
  logoBorder: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: BorderRadius.md,
  },
  logoInner: {
    margin: 2,
    borderRadius: BorderRadius.sm,
    overflow: "hidden",
    backgroundColor: "rgba(10, 5, 20, 0.5)",
  },
  logoImage: {
    width: 160,
    height: 48,
  },
  logoImagePortrait: {
    width: 110,
    height: 33,
  },
  logoShimmer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: 80,
  },
  logoHighlight: {
    position: "absolute",
    top: 0,
    left: 10,
    right: 10,
    height: 1,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 1,
  },
  logoTextContainer: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 4,
  },
  logoTextJade: {
    fontSize: 14,
    fontWeight: "900",
    color: "#10B981",
    letterSpacing: 2,
    ...createTextShadow("#10B981", 0, 0, 10),
    fontStyle: "italic",
  },
  logoTextRoyale: {
    fontSize: 12,
    fontWeight: "700",
    color: "#34D399",
    letterSpacing: 1.5,
    ...createTextShadow("#34D399", 0, 0, 8),
    fontStyle: "italic",
  },
  winsContainer: {
    position: "relative",
    borderRadius: BorderRadius.xs,
    overflow: "hidden",
    ...createBoxShadow("#10B981", 0, 2, 0.3, 8, 6),
    marginLeft: 20,
    minWidth: 140,
    maxWidth: 180,
    marginTop: -4,
    flex: 0,
  },
  winsGlowBg: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(16, 185, 129, 0.15)",
    borderRadius: BorderRadius.sm,
  },
  winsGradient: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: "rgba(16, 185, 129, 0.3)",
    borderRadius: BorderRadius.xs,
    gap: 8,
  },
  winsIconContainer: {
    width: 18,
    height: 18,
    borderRadius: 9,
    overflow: "hidden",
  },
  winsIconBg: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  winsScrollMask: {
    flex: 1,
    overflow: "hidden",
  },
  winsScrollContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  winsItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    width: 120,
    paddingHorizontal: 4,
  },
  winsPlayerName: {
    fontSize: 10,
    fontWeight: "700",
    color: "#10B981",
    letterSpacing: 0.3,
  },
  winsAmount: {
    fontSize: 11,
    fontWeight: "800",
    color: PremiumColors.royalGold,
    letterSpacing: 0.5,
  },
  winsTopHighlight: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
  },
  buttonWrapper: {
    position: "relative",
  },
  buttonGlow: {
    position: "absolute",
    top: -5,
    left: -5,
    right: -5,
    bottom: -5,
    borderRadius: BorderRadius.full,
  },
  buttonRing: {
    position: "absolute",
    top: -3,
    left: -3,
    right: -3,
    bottom: -3,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  settingsButton: {
    width: 34,
    height: 34,
    borderRadius: BorderRadius.full,
    overflow: "visible",
  },
  settingsIconContainer: {
    width: 34,
    height: 34,
    borderRadius: 10,
    overflow: "hidden",
    backgroundColor: "rgba(20, 10, 35, 0.8)",
    borderWidth: 1,
    borderColor: "rgba(212, 175, 55, 0.4)",
  },
  settingsIcon: {
    width: "100%",
    height: "100%",
  },
  balanceSection: {
    flexDirection: "row",
    alignItems: "center",
  },
  balanceSectionPortrait: {
    position: "absolute",
    right: 0,
    top: 50,
    zIndex: 200,
  },
  logoPortraitPosition: {
    marginLeft: -40,
    marginTop: 12,
  },
  balanceContainer: {
    position: "relative",
  },
  balanceGlow: {
    position: "absolute",
    top: -5,
    left: -5,
    right: -5,
    bottom: -5,
    borderRadius: BorderRadius.md + 5,
    backgroundColor: "rgba(139, 92, 246, 0.45)",
    ...createBoxShadow("#8B5CF6", 0, 0, 0.7, 16, 12),
  },
  balanceBar: {
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.sm + 4,
    paddingVertical: Spacing.xs + 2,
    minWidth: 90,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "rgba(212, 175, 55, 0.6)",
    overflow: "hidden",
    position: "relative",
    ...createBoxShadow("#D4AF37", 0, 2, 0.3, 8, 8),
  },
  borderGlow: {
    position: "absolute",
    top: -1,
    left: -1,
    right: -1,
    bottom: -1,
    borderRadius: BorderRadius.md,
    overflow: "hidden",
  },
  borderGlowInner: {
    flex: 1,
  },
  balanceTextRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  miniCoin: {
    width: 16,
    height: 16,
    borderRadius: 8,
    overflow: "hidden",
    borderWidth: 1.5,
    borderColor: "#B8860B",
  },
  miniCoinGradient: {
    flex: 1,
  },
  balanceText: {
    fontSize: 17,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: 0.8,
  },
  balanceShimmer: {
    position: "absolute",
    top: 0,
    left: 0,
    width: 30,
    height: "100%",
  },
  balanceTopHighlight: {
    position: "absolute",
    top: 0,
    left: 10,
    right: 10,
    height: 1,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
  },
  coinStack: {
    marginRight: -12,
    width: 36,
    height: 36,
    position: "relative",
  },
  coin: {
    width: 26,
    height: 26,
    borderRadius: 13,
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  coinBack: {
    backgroundColor: "#7C5A0D",
    top: 7,
    left: 0,
  },
  coinMiddle: {
    backgroundColor: "#9E7B14",
    top: 3,
    left: 4,
  },
  coinFront: {
    top: 0,
    left: 8,
    borderWidth: 2,
    borderColor: "#B8860B",
  },
  coinSymbol: {
    fontSize: 13,
    fontWeight: "900",
    color: "#6B4E0A",
  },
  coinShimmer: {
    position: "absolute",
    top: 0,
    left: 0,
    width: 10,
    height: "100%",
  },
  coinGlow: {
    position: "absolute",
    top: -2,
    left: 4,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(212, 175, 55, 0.3)",
    ...createBoxShadow(PremiumColors.royalGold, 0, 0, 0.5, 10, 6),
  },
  profileButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: "visible",
  },
  avatarContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    position: "relative",
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarBorderGradient: {
    position: "absolute",
    top: -2,
    left: -2,
    right: -2,
    bottom: -2,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: "transparent",
  },
});
