import React, { useEffect, useState } from "react";
import {
  View,
  StyleSheet,
  Modal,
  Pressable,
  Dimensions,
  Platform,
} from "react-native";
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
} from "react-native-reanimated";
import { ThemedText } from "@/components/ThemedText";
import { useDailyBonus } from "@/contexts/DailyBonusContext";
import { useNotifications } from "@/contexts/NotificationsContext";
import { useAuth } from "@/contexts/AuthContext";
import { BorderRadius, Spacing, createTextShadow } from "@/constants/theme";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const MODAL_WIDTH = Math.min(SCREEN_WIDTH * 0.95, 600);

interface ConfettiPiece {
  id: number;
  x: number;
  delay: number;
  color: string;
  size: number;
}

const DAILY_REWARDS = [
  { day: 1, amount: 10.00 },
  { day: 2, amount: 10.00 },
  { day: 3, amount: 10.00 },
  { day: 4, amount: 10.00 },
  { day: 5, amount: 10.00 },
  { day: 6, amount: 10.00 },
  { day: 7, amount: 10.00 },
];

function Confetti({ pieces }: { pieces: ConfettiPiece[] }) {
  return (
    <View style={[styles.confettiContainer, { pointerEvents: "none" }]}>
      {pieces.map((piece) => (
        <ConfettiPieceComponent key={piece.id} {...piece} />
      ))}
    </View>
  );
}

function ConfettiPieceComponent({ x, delay, color, size }: ConfettiPiece) {
  const translateY = useSharedValue(-50);
  const translateX = useSharedValue(0);
  const rotate = useSharedValue(0);
  const opacity = useSharedValue(1);

  useEffect(() => {
    translateY.value = withDelay(
      delay,
      withTiming(SCREEN_HEIGHT + 100, {
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

interface DayBoxProps {
  day: number;
  amount: number;
  isClaimed: boolean;
  isCurrentDay: boolean;
  isFutureDay: boolean;
}

function DayBox({ day, amount, isClaimed, isCurrentDay, isFutureDay }: DayBoxProps) {
  const scale = useSharedValue(1);
  const glow = useSharedValue(0);

  useEffect(() => {
    if (isCurrentDay) {
      glow.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 800 }),
          withTiming(0.4, { duration: 800 })
        ),
        -1,
        true
      );
    }
  }, [isCurrentDay]);

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glow.value,
  }));

  return (
    <View style={styles.dayBoxWrapper}>
      <View style={[
        styles.dayLabelContainer,
        isCurrentDay && styles.dayLabelContainerActive,
        isClaimed && styles.dayLabelContainerClaimed,
      ]}>
        <ThemedText style={[
          styles.dayLabel,
          isCurrentDay && styles.dayLabelActive,
        ]}>
          Day {day}
        </ThemedText>
      </View>
      
      <View style={[
        styles.dayBox,
        isClaimed && styles.dayBoxClaimed,
        isCurrentDay && styles.dayBoxCurrent,
        isFutureDay && styles.dayBoxFuture,
      ]}>
        {isCurrentDay && (
          <Animated.View style={[styles.dayBoxGlow, glowStyle]} />
        )}
        
        <LinearGradient
          colors={
            isClaimed 
              ? ["#1a1a2e", "#16213e"] 
              : isCurrentDay 
                ? ["#FFD700", "#FFA500"] 
                : isFutureDay
                  ? ["#2a2a3e", "#1a1a2e"]
                  : ["#FFD700", "#FFA500"]
          }
          style={styles.dayBoxGradient}
        >
          {isClaimed ? (
            <View style={styles.checkmarkContainer}>
              <Feather name="check" size={28} color="#10B981" />
            </View>
          ) : isCurrentDay ? (
            <View style={styles.coinIconContainer}>
              <LinearGradient
                colors={["#FFD700", "#FFA500"]}
                style={styles.coinIcon}
              >
                <ThemedText style={styles.coinIconText}>GC</ThemedText>
              </LinearGradient>
            </View>
          ) : (
            <View style={styles.lockedContainer}>
              <Feather name="lock" size={20} color="rgba(255,255,255,0.3)" />
            </View>
          )}
        </LinearGradient>
      </View>
      
      <View style={[
        styles.amountContainer,
        isCurrentDay && styles.amountContainerActive,
      ]}>
        <ThemedText style={[
          styles.amountText,
          isClaimed && styles.amountTextClaimed,
          isCurrentDay && styles.amountTextActive,
          isFutureDay && styles.amountTextFuture,
        ]}>
          ${amount.toFixed(2)}
        </ThemedText>
      </View>
    </View>
  );
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function DailyBonusModal() {
  const {
    canClaimToday,
    rewardAmount,
    currentDay,
    claimedDays,
    isModalVisible,
    hideModal,
    claimBonus,
  } = useDailyBonus();
  const { notifyDragonEgg } = useNotifications();
  const { refreshBalance } = useAuth();

  const [showConfetti, setShowConfetti] = useState(false);
  const [confettiPieces, setConfettiPieces] = useState<ConfettiPiece[]>([]);
  const [isClaiming, setIsClaiming] = useState(false);
  const [justClaimed, setJustClaimed] = useState(false);

  const modalScale = useSharedValue(0.8);
  const buttonScale = useSharedValue(1);
  const buttonGlow = useSharedValue(0);

  useEffect(() => {
    if (isModalVisible) {
      modalScale.value = withSpring(1, { damping: 15, stiffness: 150 });
      buttonGlow.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 800 }),
          withTiming(0.5, { duration: 800 })
        ),
        -1,
        true
      );
    } else {
      modalScale.value = 0.8;
      setShowConfetti(false);
      setJustClaimed(false);
    }
  }, [isModalVisible]);

  const handleCollect = async () => {
    if (!canClaimToday || isClaiming || justClaimed) return;

    setIsClaiming(true);
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    buttonScale.value = withSequence(
      withTiming(0.9, { duration: 100 }),
      withSpring(1.1, { damping: 8 }),
      withSpring(1, { damping: 12 })
    );

    const result = await claimBonus();
    
    if (result.success) {
      setJustClaimed(true);
      notifyDragonEgg(currentDay, parseFloat(rewardAmount) || 0);
      const colors = ["#FFD700", "#FF6B6B", "#4ECDC4", "#A855F7", "#3B82F6", "#10B981"];
      const newConfetti: ConfettiPiece[] = Array.from({ length: 50 }, (_, i) => ({
        id: i,
        x: Math.random() * MODAL_WIDTH,
        delay: Math.random() * 500,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: 8 + Math.random() * 8,
      }));
      setConfettiPieces(newConfetti);
      setShowConfetti(true);
    }

    setIsClaiming(false);
  };

  const handleClose = () => {
    modalScale.value = withTiming(0.8, { duration: 150 });
    setTimeout(() => {
      hideModal();
      if (refreshBalance) {
        refreshBalance();
      }
    }, 150);
  };

  const modalStyle = useAnimatedStyle(() => ({
    transform: [{ scale: modalScale.value }],
    opacity: interpolate(modalScale.value, [0.8, 1], [0, 1]),
  }));

  const buttonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  const buttonGlowStyle = useAnimatedStyle(() => ({
    opacity: buttonGlow.value,
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
              colors={["#2D1B69", "#1E1145", "#150D30"]}
              style={styles.modalContainer}
            >
              <View style={styles.borderGlow} />

              <Pressable style={styles.closeButton} onPress={handleClose}>
                <LinearGradient
                  colors={["#FF8C00", "#FF6600"]}
                  style={styles.closeButtonGradient}
                >
                  <Feather name="x" size={22} color="#FFFFFF" />
                </LinearGradient>
              </Pressable>

              <Animated.View 
                entering={FadeIn.delay(100).duration(400)}
                style={styles.titleContainer}
              >
                <ThemedText style={styles.titleText}>DAILY BONUS!</ThemedText>
              </Animated.View>

              <View style={styles.daysContainer}>
                <View style={styles.daysRow}>
                  {DAILY_REWARDS.map((reward) => (
                    <DayBox
                      key={reward.day}
                      day={reward.day}
                      amount={reward.amount}
                      isClaimed={claimedDays.includes(reward.day)}
                      isCurrentDay={reward.day === currentDay}
                      isFutureDay={reward.day > currentDay}
                    />
                  ))}
                </View>
              </View>

              <View style={styles.collectSection}>
                <AnimatedPressable
                  style={[
                    styles.collectButton,
                    (!canClaimToday || justClaimed) && styles.collectButtonDisabled,
                    buttonStyle,
                  ]}
                  onPress={handleCollect}
                  disabled={!canClaimToday || isClaiming || justClaimed}
                >
                  {(canClaimToday && !justClaimed) && (
                    <Animated.View style={[styles.collectButtonGlow, buttonGlowStyle]}>
                      <LinearGradient
                        colors={["rgba(16, 185, 129, 0.6)", "transparent"]}
                        style={StyleSheet.absoluteFill}
                      />
                    </Animated.View>
                  )}
                  <LinearGradient
                    colors={
                      canClaimToday && !justClaimed
                        ? ["#10B981", "#059669"]
                        : ["#4B5563", "#374151"]
                    }
                    style={styles.collectButtonGradient}
                  >
                    <ThemedText style={styles.collectButtonText}>
                      {justClaimed ? "CLAIMED!" : isClaiming ? "CLAIMING..." : "COLLECT"}
                    </ThemedText>
                  </LinearGradient>
                </AnimatedPressable>

                <ThemedText style={styles.resetText}>
                  Your rewards reset daily at 00:00(UTC-4).
                </ThemedText>
              </View>

              {showConfetti && <Confetti pieces={confettiPieces} />}
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
    width: MODAL_WIDTH,
    borderRadius: 20,
    padding: Spacing.lg,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.lg,
    overflow: "hidden",
    alignItems: "center",
    borderWidth: 4,
    borderColor: "#9333EA",
  },
  borderGlow: {
    position: "absolute",
    top: -2,
    left: -2,
    right: -2,
    bottom: -2,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: "rgba(168, 85, 247, 0.5)",
  },
  closeButton: {
    position: "absolute",
    top: 8,
    right: 8,
    zIndex: 10,
  },
  closeButtonGradient: {
    width: 32,
    height: 32,
    borderRadius: 16,
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
    fontSize: 32,
    fontWeight: "900",
    color: "#FFD700",
    ...createTextShadow("#FF6600", 2, 2, 4),
    letterSpacing: 2,
  },
  daysContainer: {
    width: "100%",
    marginBottom: Spacing.lg,
    paddingHorizontal: Spacing.xs,
  },
  daysRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 6,
  },
  dayBoxWrapper: {
    flex: 1,
    alignItems: "center",
    maxWidth: 75,
  },
  dayLabelContainer: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: "rgba(30, 30, 60, 0.8)",
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    marginBottom: -2,
    zIndex: 1,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: "rgba(100, 100, 150, 0.3)",
  },
  dayLabelContainerActive: {
    backgroundColor: "rgba(255, 200, 0, 0.2)",
    borderColor: "#FFD700",
  },
  dayLabelContainerClaimed: {
    backgroundColor: "rgba(16, 185, 129, 0.1)",
  },
  dayLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: "rgba(255, 255, 255, 0.6)",
    textAlign: "center",
  },
  dayLabelActive: {
    color: "#FFD700",
  },
  dayBox: {
    width: "100%",
    aspectRatio: 0.85,
    borderRadius: 8,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "rgba(100, 100, 150, 0.4)",
  },
  dayBoxClaimed: {
    borderColor: "#10B981",
  },
  dayBoxCurrent: {
    borderColor: "#FFD700",
    borderWidth: 3,
  },
  dayBoxFuture: {
    borderColor: "rgba(60, 60, 100, 0.5)",
  },
  dayBoxGlow: {
    position: "absolute",
    top: -4,
    left: -4,
    right: -4,
    bottom: -4,
    backgroundColor: "#FFD700",
    borderRadius: 12,
    opacity: 0.3,
  },
  dayBoxGradient: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  checkmarkContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(16, 185, 129, 0.2)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#10B981",
  },
  coinIconContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  coinIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#B8860B",
  },
  coinIconText: {
    fontSize: 12,
    fontWeight: "900",
    color: "#8B4513",
  },
  lockedContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  amountContainer: {
    backgroundColor: "#FFD700",
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderBottomLeftRadius: 6,
    borderBottomRightRadius: 6,
    marginTop: -2,
    width: "100%",
  },
  amountContainerActive: {
    backgroundColor: "#FFD700",
  },
  amountText: {
    fontSize: 11,
    fontWeight: "900",
    color: "#000000",
    textAlign: "center",
  },
  amountTextClaimed: {
    color: "#000000",
  },
  amountTextActive: {
    color: "#000000",
  },
  amountTextFuture: {
    color: "#000000",
  },
  collectSection: {
    alignItems: "center",
    gap: Spacing.sm,
    width: "100%",
    paddingHorizontal: Spacing.xl,
  },
  collectButton: {
    borderRadius: BorderRadius.md,
    overflow: "hidden",
    width: "80%",
  },
  collectButtonDisabled: {
    opacity: 0.7,
  },
  collectButtonGlow: {
    position: "absolute",
    top: -10,
    left: -10,
    right: -10,
    bottom: -10,
    borderRadius: BorderRadius.md + 10,
  },
  collectButtonGradient: {
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  collectButtonText: {
    fontSize: 20,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: 3,
  },
  resetText: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.5)",
    textAlign: "center",
  },
  confettiContainer: {
    ...StyleSheet.absoluteFillObject,
    overflow: "hidden",
  },
});
