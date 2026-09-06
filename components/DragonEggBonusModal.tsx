import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  StyleSheet,
  Modal,
  Pressable,
  useWindowDimensions,
  Platform,
  ScrollView,
} from "react-native";
import { Image } from "expo-image";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
  withDelay,
  withRepeat,
  Easing,
  interpolate,
  FadeIn,
  FadeOut,
  runOnJS,
} from "react-native-reanimated";
import { ThemedText } from "@/components/ThemedText";
import { useDailyBonus } from "@/contexts/DailyBonusContext";
import { useNotifications } from "@/contexts/NotificationsContext";
import { usePushNotifications } from "@/contexts/PushNotificationsContext";
import { BorderRadius, Spacing, createTextShadow } from "@/constants/theme";

interface ConfettiPiece {
  id: number;
  x: number;
  delay: number;
  color: string;
  size: number;
}

function Confetti({ pieces, containerHeight }: { pieces: ConfettiPiece[]; containerHeight: number }) {
  return (
    <View style={[styles.confettiContainer, { pointerEvents: "none" }]}>
      {pieces.map((piece) => (
        <ConfettiPieceComponent key={piece.id} {...piece} containerHeight={containerHeight} />
      ))}
    </View>
  );
}

function ConfettiPieceComponent({ x, delay, color, size, containerHeight }: ConfettiPiece & { containerHeight: number }) {
  const translateY = useSharedValue(-50);
  const translateX = useSharedValue(0);
  const rotate = useSharedValue(0);
  const opacity = useSharedValue(1);

  useEffect(() => {
    translateY.value = withDelay(
      delay,
      withTiming(containerHeight * 0.8, {
        duration: 2500,
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
      delay + 2000,
      withTiming(0, { duration: 500 })
    );
  }, []);

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

interface DragonEggProps {
  position: "left" | "right";
  onSelect: () => void;
  disabled: boolean;
  isSelected: boolean;
  eggSize: number;
}

function DragonEgg({ position, onSelect, disabled, isSelected, eggSize }: DragonEggProps) {
  const wobble = useSharedValue(0);
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);
  const crackProgress = useSharedValue(0);

  useEffect(() => {
    wobble.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
        withTiming(-1, { duration: 1500, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, []);

  useEffect(() => {
    if (isSelected) {
      scale.value = withSequence(
        withTiming(1.1, { duration: 100 }),
        withRepeat(
          withSequence(
            withTiming(1.05, { duration: 50 }),
            withTiming(1.15, { duration: 50 })
          ),
          8,
          true
        ),
        withTiming(1.3, { duration: 200 }),
        withTiming(0, { duration: 300 })
      );
      opacity.value = withDelay(700, withTiming(0, { duration: 300 }));
      crackProgress.value = withDelay(200, withTiming(1, { duration: 500 }));
    }
  }, [isSelected]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { rotate: `${wobble.value * 3}deg` },
      { scale: scale.value },
    ],
    opacity: opacity.value,
  }));

  const crackStyle = useAnimatedStyle(() => ({
    opacity: interpolate(crackProgress.value, [0, 0.5, 1], [0, 1, 0]),
  }));

  const handlePress = () => {
    if (disabled) return;
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }
    onSelect();
  };

  return (
    <Pressable onPress={handlePress} disabled={disabled}>
      <Animated.View style={[styles.eggContainer, animatedStyle]}>
        <View style={[styles.eggImageWrapper, { width: eggSize, height: eggSize * 1.15 }]}>
          <Image
            source={require("@/assets/images/dragon-egg.png")}
            style={[styles.eggImage, { width: eggSize, height: eggSize * 1.15 }]}
            contentFit="contain"
          />
          <Animated.View style={[styles.crackOverlay, crackStyle]}>
            <View style={styles.crack1} />
            <View style={styles.crack2} />
            <View style={styles.crack3} />
            <View style={styles.crackGlow1} />
            <View style={styles.crackGlow2} />
          </Animated.View>
        </View>
        <View style={[styles.eggShadow, { width: eggSize * 0.6 }]} />
      </Animated.View>
    </Pressable>
  );
}

function JadeGem({ amount, visible }: { amount: string; visible: boolean }) {
  const scale = useSharedValue(0);
  const glow = useSharedValue(0);
  const floatY = useSharedValue(0);
  const shimmer = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      scale.value = withDelay(800, withSpring(1, { damping: 10, stiffness: 120 }));
      glow.value = withDelay(
        1000,
        withRepeat(
          withSequence(
            withTiming(1, { duration: 1200 }),
            withTiming(0.4, { duration: 1200 })
          ),
          -1,
          true
        )
      );
      floatY.value = withDelay(
        800,
        withRepeat(
          withSequence(
            withTiming(-8, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
            withTiming(8, { duration: 1500, easing: Easing.inOut(Easing.ease) })
          ),
          -1,
          true
        )
      );
      shimmer.value = withDelay(
        1200,
        withRepeat(
          withSequence(
            withTiming(1, { duration: 2000 }),
            withTiming(0, { duration: 2000 })
          ),
          -1,
          true
        )
      );
    } else {
      scale.value = 0;
    }
  }, [visible]);

  const gemStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { translateY: floatY.value },
    ],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glow.value * 0.6,
    transform: [{ scale: 1 + glow.value * 0.1 }],
  }));

  const shimmerStyle = useAnimatedStyle(() => ({
    opacity: shimmer.value * 0.8,
  }));

  if (!visible) return null;

  return (
    <Animated.View style={[styles.gemContainer, gemStyle]}>
      <Animated.View style={[styles.gemGlow, glowStyle]} />
      <Animated.View style={[styles.gemGlowInner, glowStyle]} />
      
      <View style={styles.prizeCard}>
        <LinearGradient
          colors={["#1a3d2a", "#0d2818", "#051a0d"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.prizeCardInner}
        >
          <View style={styles.prizeCardBorderTop} />
          <View style={styles.prizeCardBorderBottom} />
          
          <View style={styles.coinIconContainer}>
            <LinearGradient
              colors={["#FFD700", "#FFA500", "#FF8C00"]}
              style={styles.coinIcon}
            >
              <ThemedText style={styles.coinSymbol}>$</ThemedText>
            </LinearGradient>
          </View>
          
          <ThemedText style={styles.prizeLabel}>YOUR PRIZE</ThemedText>
          <ThemedText style={styles.prizeAmount}>${amount}</ThemedText>
          
          <Animated.View style={[styles.prizeShimmer, shimmerStyle]} />
        </LinearGradient>
      </View>
    </Animated.View>
  );
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function DragonEggBonusModal() {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const isLandscape = screenWidth > screenHeight;
  
  const modalWidth = isLandscape 
    ? Math.min(screenWidth * 0.7, 450) 
    : Math.min(screenWidth * 0.95, 550);
  const modalMaxHeight = isLandscape 
    ? screenHeight * 0.85 
    : screenHeight * 0.85;
  const eggSize = isLandscape 
    ? Math.min(screenHeight * 0.18, 60) 
    : Math.min(modalWidth * 0.35, 140);
  const titleFontSize = isLandscape ? 18 : 32;
  const subtitleFontSize = isLandscape ? 10 : 14;
  
  const {
    canClaimToday,
    rewardAmount,
    currentDay,
    isModalVisible,
    hideModal,
    claimBonus,
  } = useDailyBonus();
  const { notifyDragonEgg } = useNotifications();
  const { scheduleDailyBonusReminder, isEnabled: pushEnabled } = usePushNotifications();

  const [showConfetti, setShowConfetti] = useState(false);
  const [confettiPieces, setConfettiPieces] = useState<ConfettiPiece[]>([]);
  const [isClaiming, setIsClaiming] = useState(false);
  const [selectedEgg, setSelectedEgg] = useState<"left" | "right" | null>(null);
  const [showGem, setShowGem] = useState(false);
  const [claimedAmount, setClaimedAmount] = useState("10.00");
  const [claimError, setClaimError] = useState<string | null>(null);

  const modalScale = useSharedValue(0.8);
  const titleGlow = useSharedValue(0);

  useEffect(() => {
    if (isModalVisible) {
      modalScale.value = withSpring(1, { damping: 15, stiffness: 150 });
      titleGlow.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 1500 }),
          withTiming(0.5, { duration: 1500 })
        ),
        -1,
        true
      );
      setSelectedEgg(null);
      setShowGem(false);
      setShowConfetti(false);
      setClaimError(null);
    } else {
      modalScale.value = 0.8;
    }
  }, [isModalVisible]);

  const handleEggSelect = async (egg: "left" | "right") => {
    if (!canClaimToday || isClaiming || selectedEgg) return;

    setIsClaiming(true);
    setSelectedEgg(egg);

    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    const result = await claimBonus();

    if (result.success) {
      const amount = result.amount || rewardAmount || "10.00";
      setClaimedAmount(amount);
      setClaimError(null);
      
      if (pushEnabled) {
        scheduleDailyBonusReminder();
      }
      
      setTimeout(() => {
        setShowGem(true);
        notifyDragonEgg(currentDay, parseFloat(amount) || 10);
        
        const colors = ["#50C878", "#FFD700", "#2E8B57", "#228B22", "#98FB98", "#00FF7F"];
        const newConfetti: ConfettiPiece[] = Array.from({ length: 60 }, (_, i) => ({
          id: i,
          x: Math.random() * modalWidth,
          delay: Math.random() * 600,
          color: colors[Math.floor(Math.random() * colors.length)],
          size: 8 + Math.random() * 10,
        }));
        setConfettiPieces(newConfetti);
        setShowConfetti(true);
      }, 800);
    } else {
      setSelectedEgg(null);
      setClaimError(result.message || "Failed to claim reward. Please try again.");
    }

    setIsClaiming(false);
  };

  const handleClose = () => {
    modalScale.value = withTiming(0.8, { duration: 150 });
    setTimeout(hideModal, 150);
  };

  const modalStyle = useAnimatedStyle(() => ({
    transform: [{ scale: modalScale.value }],
    opacity: interpolate(modalScale.value, [0.8, 1], [0, 1]),
  }));

  const titleGlowStyle = useAnimatedStyle(() => ({
    textShadowRadius: interpolate(titleGlow.value, [0.5, 1], [4, 12]),
    textShadowColor: `rgba(80, 200, 120, ${interpolate(titleGlow.value, [0.5, 1], [0.5, 1])})`,
  }));

  return (
    <Modal
      visible={isModalVisible}
      transparent
      animationType="none"
      onRequestClose={handleClose}
    >
      <Pressable style={styles.overlay} onPress={handleClose}>
        <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill} />
        
        <Animated.View style={modalStyle}>
          <Pressable onPress={(e) => e.stopPropagation()}>
            <LinearGradient
              colors={["#1a2a1a", "#0d1f0d", "#152515"]}
              style={[
                styles.modalContainer, 
                { 
                  width: modalWidth, 
                  maxHeight: modalMaxHeight,
                  padding: isLandscape ? Spacing.sm : Spacing.lg,
                  paddingTop: isLandscape ? Spacing.sm : Spacing.xl + 10,
                  paddingBottom: isLandscape ? Spacing.xs : Spacing.lg,
                }
              ]}
            >
              <View style={styles.borderGlow} />

              <Pressable style={styles.closeButton} onPress={handleClose}>
                <LinearGradient
                  colors={["#50C878", "#2E8B57"]}
                  style={[styles.closeButtonGradient, isLandscape && { width: 30, height: 30, borderRadius: 15 }]}
                >
                  <Feather name="x" size={isLandscape ? 18 : 22} color="#FFFFFF" />
                </LinearGradient>
              </Pressable>

              <ScrollView 
                showsVerticalScrollIndicator={false}
                contentContainerStyle={[styles.scrollContent, isLandscape && { paddingTop: 2 }]}
                bounces={false}
              >
                <Animated.View 
                  entering={FadeIn.delay(100).duration(400)}
                  style={[styles.titleContainer, isLandscape && { marginBottom: Spacing.xs }]}
                >
                  <Animated.Text style={[styles.titleText, titleGlowStyle, { fontSize: titleFontSize }]}>
                    DRAGON'S GIFT
                  </Animated.Text>
                  <ThemedText style={[styles.subtitleText, { fontSize: subtitleFontSize }]}>
                    Choose an egg to reveal your reward
                  </ThemedText>
                </Animated.View>

                <View style={[
                  styles.eggsContainer, 
                  { 
                    minHeight: eggSize + (isLandscape ? 16 : 60),
                    marginVertical: isLandscape ? Spacing.xs : Spacing.lg,
                  }
                ]}>
                  {!showGem ? (
                    <>
                      <DragonEgg
                        position="left"
                        onSelect={() => handleEggSelect("left")}
                        disabled={!canClaimToday || isClaiming || selectedEgg !== null}
                        isSelected={selectedEgg === "left"}
                        eggSize={eggSize}
                      />
                      <DragonEgg
                        position="right"
                        onSelect={() => handleEggSelect("right")}
                        disabled={!canClaimToday || isClaiming || selectedEgg !== null}
                        isSelected={selectedEgg === "right"}
                        eggSize={eggSize}
                      />
                    </>
                  ) : null}
                  
                  <JadeGem amount={claimedAmount} visible={showGem} />
                </View>

                {showGem ? (
                  <Animated.View 
                    entering={FadeIn.delay(1200).duration(500)}
                    style={[styles.congratsContainer, isLandscape && { marginTop: 4 }]}
                  >
                    <ThemedText style={[styles.congratsText, isLandscape && { fontSize: 14 }]}>
                      Congratulations!
                    </ThemedText>
                    <ThemedText style={[styles.rewardAddedText, isLandscape && { fontSize: 10 }]}>
                      Reward added to your balance
                    </ThemedText>
                  </Animated.View>
                ) : null}

                {claimError ? (
                  <View style={[styles.alreadyClaimedContainer, isLandscape && { marginTop: 4 }]}>
                    <Feather name="alert-circle" size={isLandscape ? 14 : 24} color="#FF6B6B" />
                    <ThemedText style={[styles.alreadyClaimedText, isLandscape && { fontSize: 11 }, { color: "#FF6B6B" }]}>
                      {claimError}
                    </ThemedText>
                    <ThemedText style={[styles.comeBackText, isLandscape && { fontSize: 9 }]}>
                      Please try selecting an egg again
                    </ThemedText>
                  </View>
                ) : !canClaimToday && !showGem ? (
                  <View style={[styles.alreadyClaimedContainer, isLandscape && { marginTop: 4 }]}>
                    <Feather name="check-circle" size={isLandscape ? 14 : 24} color="#50C878" />
                    <ThemedText style={[styles.alreadyClaimedText, isLandscape && { fontSize: 11 }]}>
                      You've already claimed today's gift!
                    </ThemedText>
                    <ThemedText style={[styles.comeBackText, isLandscape && { fontSize: 9 }]}>
                      Come back tomorrow for another dragon egg
                    </ThemedText>
                  </View>
                ) : null}

                <ThemedText style={[styles.resetText, isLandscape && { fontSize: 9, marginTop: 4 }]}>
                  New egg available daily at 00:00 (UTC-4)
                </ThemedText>
              </ScrollView>

              {showConfetti ? <Confetti pieces={confettiPieces} containerHeight={modalMaxHeight} /> : null}
            </LinearGradient>
          </Pressable>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    borderRadius: 24,
    overflow: "hidden",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "#50C878",
  },
  scrollContent: {
    alignItems: "center",
    paddingTop: Spacing.sm,
  },
  borderGlow: {
    position: "absolute",
    top: -2,
    left: -2,
    right: -2,
    bottom: -2,
    borderRadius: 26,
    borderWidth: 2,
    borderColor: "rgba(80, 200, 120, 0.4)",
  },
  closeButton: {
    position: "absolute",
    top: 12,
    right: 12,
    zIndex: 10,
  },
  closeButtonGradient: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  titleContainer: {
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  titleText: {
    fontWeight: "900",
    color: "#50C878",
    letterSpacing: 3,
    textShadowOffset: { width: 0, height: 0 },
  },
  subtitleText: {
    color: "rgba(255, 255, 255, 0.7)",
    marginTop: Spacing.xs,
  },
  eggsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: Spacing.xl,
  },
  eggContainer: {
    alignItems: "center",
  },
  eggImageWrapper: {
    alignItems: "center",
    justifyContent: "center",
  },
  eggImage: {
  },
  egg: {
    overflow: "hidden",
    borderWidth: 3,
    borderColor: "rgba(30, 80, 50, 0.8)",
  },
  scalePattern: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.4,
  },
  scaleRow: {
    position: "absolute",
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 5,
  },
  scale: {
    width: 18,
    height: 12,
    borderRadius: 9,
    backgroundColor: "rgba(20, 60, 35, 0.6)",
    borderWidth: 1,
    borderColor: "rgba(100, 180, 130, 0.3)",
  },
  vein1: {
    position: "absolute",
    width: 2,
    height: "45%",
    backgroundColor: "rgba(0, 40, 20, 0.4)",
    top: "25%",
    left: "30%",
    transform: [{ rotate: "-15deg" }],
    borderRadius: 1,
  },
  vein2: {
    position: "absolute",
    width: 2,
    height: "35%",
    backgroundColor: "rgba(0, 40, 20, 0.3)",
    top: "30%",
    right: "25%",
    transform: [{ rotate: "20deg" }],
    borderRadius: 1,
  },
  vein3: {
    position: "absolute",
    width: 1.5,
    height: "25%",
    backgroundColor: "rgba(0, 40, 20, 0.35)",
    bottom: "20%",
    left: "50%",
    transform: [{ rotate: "-5deg" }],
    borderRadius: 1,
  },
  speckle1: {
    position: "absolute",
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(80, 150, 100, 0.5)",
    top: "20%",
    left: "60%",
  },
  speckle2: {
    position: "absolute",
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(60, 120, 80, 0.4)",
    top: "45%",
    left: "20%",
  },
  speckle3: {
    position: "absolute",
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: "rgba(100, 180, 130, 0.35)",
    top: "60%",
    right: "30%",
  },
  speckle4: {
    position: "absolute",
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: "rgba(70, 140, 90, 0.45)",
    top: "35%",
    right: "40%",
  },
  speckle5: {
    position: "absolute",
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(90, 160, 110, 0.4)",
    bottom: "30%",
    left: "35%",
  },
  eggHighlight: {
    position: "absolute",
    top: "12%",
    left: "18%",
    width: "30%",
    height: "22%",
    backgroundColor: "rgba(180, 255, 220, 0.25)",
    borderRadius: 100,
    transform: [{ rotate: "-25deg" }],
  },
  eggShine: {
    position: "absolute",
    top: "8%",
    left: "28%",
    width: "18%",
    height: "12%",
    backgroundColor: "rgba(255, 255, 255, 0.4)",
    borderRadius: 50,
  },
  eggRimLight: {
    position: "absolute",
    top: 0,
    left: "10%",
    right: "40%",
    height: 4,
    backgroundColor: "rgba(200, 255, 230, 0.3)",
    borderRadius: 2,
  },
  eggGloss: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: "45%",
    borderBottomLeftRadius: 100,
    borderBottomRightRadius: 100,
  },
  eggShadow: {
    height: 12,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    borderRadius: 100,
    marginTop: 10,
  },
  crackOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  crack1: {
    position: "absolute",
    width: 3,
    height: "40%",
    backgroundColor: "#FFD700",
    transform: [{ rotate: "15deg" }],
    top: "20%",
    left: "40%",
  },
  crack2: {
    position: "absolute",
    width: 3,
    height: "30%",
    backgroundColor: "#FFD700",
    transform: [{ rotate: "-25deg" }],
    top: "35%",
    right: "35%",
  },
  crack3: {
    position: "absolute",
    width: 3,
    height: "25%",
    backgroundColor: "#FFD700",
    transform: [{ rotate: "40deg" }],
    bottom: "25%",
    left: "45%",
  },
  crackGlow1: {
    position: "absolute",
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 215, 0, 0.4)",
    top: "35%",
    left: "35%",
  },
  crackGlow2: {
    position: "absolute",
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "rgba(255, 180, 0, 0.3)",
    top: "50%",
    right: "35%",
  },
  gemContainer: {
    alignItems: "center",
    position: "absolute",
  },
  gemGlow: {
    position: "absolute",
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: "#50C878",
  },
  gemGlowInner: {
    position: "absolute",
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: "#FFD700",
  },
  prizeCard: {
    borderRadius: BorderRadius.lg,
    overflow: "hidden",
    borderWidth: 3,
    borderColor: "#50C878",
  },
  prizeCardInner: {
    paddingHorizontal: Spacing.xl + 8,
    paddingVertical: Spacing.lg,
    alignItems: "center",
    minWidth: 160,
  },
  prizeCardBorderTop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: "rgba(80, 200, 120, 0.5)",
  },
  prizeCardBorderBottom: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: "rgba(80, 200, 120, 0.3)",
  },
  coinIconContainer: {
    marginBottom: Spacing.sm,
  },
  coinIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "rgba(255, 255, 255, 0.4)",
  },
  coinSymbol: {
    fontSize: 24,
    fontWeight: "900",
    color: "#FFFFFF",
    ...createTextShadow("#000", 1, 1, 2),
  },
  prizeLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "rgba(255, 255, 255, 0.6)",
    letterSpacing: 2,
    marginBottom: 4,
  },
  prizeAmount: {
    fontSize: 42,
    fontWeight: "900",
    color: "#FFD700",
    ...createTextShadow("#000", 2, 2, 6),
  },
  prizeShimmer: {
    position: "absolute",
    top: 0,
    left: -50,
    width: 30,
    height: "100%",
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    transform: [{ skewX: "-20deg" }],
  },
  congratsContainer: {
    alignItems: "center",
    marginTop: Spacing.sm,
  },
  congratsText: {
    fontSize: 24,
    fontWeight: "800",
    color: "#50C878",
  },
  rewardAddedText: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.7)",
    marginTop: Spacing.xs,
  },
  alreadyClaimedContainer: {
    alignItems: "center",
    padding: Spacing.lg,
    gap: Spacing.sm,
  },
  alreadyClaimedText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#50C878",
    textAlign: "center",
  },
  comeBackText: {
    fontSize: 13,
    color: "rgba(255, 255, 255, 0.5)",
    textAlign: "center",
  },
  resetText: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.4)",
    textAlign: "center",
    marginTop: Spacing.md,
  },
  confettiContainer: {
    ...StyleSheet.absoluteFillObject,
    overflow: "hidden",
  },
});
