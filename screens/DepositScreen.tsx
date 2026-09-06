import React, { useState, useRef, useEffect } from "react";
import { View, StyleSheet, Pressable, useWindowDimensions, TextInput, ActivityIndicator, Keyboard, Platform, ScrollView } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { useNavigation } from "@react-navigation/native";
import * as Haptics from "expo-haptics";
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring, 
  withSequence,
  withTiming,
  FadeIn,
  FadeOut 
} from "react-native-reanimated";
import { ThemedText } from "@/components/ThemedText";
import { GlassCard } from "@/components/GlassCard";
import { useAuth } from "@/contexts/AuthContext";
import { activatePinCode } from "@/services/api";
import { NeonColors, Spacing, BorderRadius, GlassColors, GradientColors, PremiumColors } from "@/constants/theme";

type ActivationStatus = "idle" | "loading" | "success" | "error";

interface ActivationResult {
  amountAdded: string;
  refundBonus: string;
  newBalance: string;
}

export default function DepositScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { user, token, refreshBalance } = useAuth();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  
  const [pinCode, setPinCode] = useState("");
  const [status, setStatus] = useState<ActivationStatus>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [result, setResult] = useState<ActivationResult | null>(null);
  
  const inputRef = useRef<TextInput>(null);
  const shakeAnimation = useSharedValue(0);
  const successScale = useSharedValue(1);
  
  const successTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (successTimeoutRef.current) clearTimeout(successTimeoutRef.current);
    };
  }, []);

  const isLandscape = screenWidth > screenHeight;
  const isValidPin = pinCode.replace(/[-\s]/g, "").length >= 8;

  const handleActivate = async () => {
    if (!isValidPin || !token) return;
    
    Keyboard.dismiss();
    setStatus("loading");
    setErrorMessage("");
    setResult(null);

    try {
      const response = await activatePinCode(token, pinCode);
      const apiData = response.data as any;
      
      let resultData = null;
      if (apiData?.data) {
        resultData = apiData.data;
      } else if (apiData?.credit_history) {
        resultData = apiData.credit_history;
      } else if (apiData?.amount_added || apiData?.new_balance) {
        resultData = apiData;
      }
      
      const hasSuccessFlag = apiData?.success === true;
      const hasResultData = resultData && (resultData.amount_added || resultData.new_balance);
      const isSuccess = response.success && (hasSuccessFlag || hasResultData);
      
      if (isSuccess && hasResultData) {
        setResult({
          amountAdded: resultData.amount_added || resultData.amount || "0.00",
          refundBonus: resultData.refund_bonus || resultData.bonus || "0.00",
          newBalance: resultData.new_balance || resultData.balance || "0.00",
        });
        setStatus("success");
        setPinCode("");
        
        if (Platform.OS !== "web") {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
        
        successScale.value = withSequence(
          withSpring(1.1, { damping: 10 }),
          withSpring(1, { damping: 15 })
        );
        
        await refreshBalance();
        
        if (successTimeoutRef.current) clearTimeout(successTimeoutRef.current);
        successTimeoutRef.current = setTimeout(() => {
          setStatus("idle");
          setResult(null);
        }, 5000);
      } else {
        const errorMsg = apiData?.error || apiData?.message || response.error || "Failed to activate PIN code";
        setErrorMessage(errorMsg);
        setStatus("error");
        
        if (Platform.OS !== "web") {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        }
        
        shakeAnimation.value = withSequence(
          withTiming(-10, { duration: 50 }),
          withTiming(10, { duration: 50 }),
          withTiming(-10, { duration: 50 }),
          withTiming(10, { duration: 50 }),
          withTiming(0, { duration: 50 })
        );
      }
    } catch (error) {
      console.error("PIN activation error:", error);
      setErrorMessage("Network error. Please try again.");
      setStatus("error");
      
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    }
  };

  const handleBack = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    navigation.goBack();
  };

  const formatPinInput = (text: string) => {
    const cleaned = text.toUpperCase().replace(/[^A-Z0-9]/g, "");
    const parts = cleaned.match(/.{1,4}/g) || [];
    return parts.join("-");
  };

  const handlePinChange = (text: string) => {
    const formatted = formatPinInput(text);
    setPinCode(formatted);
    if (status === "error") {
      setStatus("idle");
      setErrorMessage("");
    }
  };

  const shakeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shakeAnimation.value }],
  }));

  const successStyle = useAnimatedStyle(() => ({
    transform: [{ scale: successScale.value }],
  }));

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <LinearGradient
        colors={GradientColors.velvetNight}
        style={StyleSheet.absoluteFill}
      />

      <View style={[styles.header, { paddingTop: insets.top + Spacing.xs }]}>
        <Pressable onPress={handleBack} style={styles.backButton}>
          <Feather name="arrow-left" size={22} color="#FFFFFF" />
        </Pressable>
        <ThemedText style={styles.headerTitle}>Add Credits</ThemedText>
        <View style={styles.balanceContainer}>
          <ThemedText style={styles.balanceLabel}>Balance:</ThemedText>
          <ThemedText style={styles.balanceValue}>
            ${user?.balance?.toFixed(2) || "0.00"}
          </ThemedText>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + Spacing.xl },
          isLandscape && styles.contentLandscape
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <GlassCard style={[styles.mainCard, isLandscape && styles.mainCardLandscape]}>
          <View style={[styles.iconContainer, isLandscape && { marginBottom: Spacing.sm }]}>
            <LinearGradient
              colors={[PremiumColors.emerald, "#059669"]}
              style={[styles.iconGradient, isLandscape && { width: 48, height: 48, borderRadius: 24 }]}
            >
              <Feather name="credit-card" size={isLandscape ? 22 : 28} color="#FFFFFF" />
            </LinearGradient>
          </View>
          
          <ThemedText style={[styles.title, isLandscape && { fontSize: 18, marginBottom: 2 }]}>Enter PIN Code</ThemedText>
          <ThemedText style={[styles.subtitle, isLandscape && { fontSize: 12, marginBottom: Spacing.sm }]}>
            Enter your PIN code to add credits to your account
          </ThemedText>

          <Animated.View style={[styles.inputWrapper, shakeStyle, isLandscape && { marginBottom: Spacing.sm }]}>
            <TextInput
              ref={inputRef}
              style={[
                styles.pinInput,
                isLandscape && { height: 48, fontSize: 16 },
                status === "error" && styles.pinInputError,
                status === "success" && styles.pinInputSuccess,
              ]}
              value={pinCode}
              onChangeText={handlePinChange}
              placeholder="XXXX-XXXX-XXXX-XXXX"
              placeholderTextColor="rgba(255,255,255,0.3)"
              autoCapitalize="characters"
              autoCorrect={false}
              autoComplete="off"
              keyboardType="default"
              maxLength={24}
              editable={status !== "loading"}
              returnKeyType="done"
            />
          </Animated.View>

          {status === "error" && errorMessage ? (
            <Animated.View 
              entering={FadeIn.duration(200)} 
              exiting={FadeOut.duration(200)}
              style={styles.errorContainer}
            >
              <Feather name="alert-circle" size={16} color={NeonColors.red} />
              <ThemedText style={styles.errorText}>{errorMessage}</ThemedText>
            </Animated.View>
          ) : null}

          {status === "success" && result ? (
            <Animated.View 
              entering={FadeIn.duration(300)}
              style={[styles.successContainer, successStyle]}
            >
              <View style={styles.successIconContainer}>
                <Feather name="check-circle" size={32} color={NeonColors.green} />
              </View>
              <ThemedText style={styles.successTitle}>Credits Added!</ThemedText>
              <View style={styles.successDetails}>
                <View style={styles.successRow}>
                  <ThemedText style={styles.successLabel}>Amount:</ThemedText>
                  <ThemedText style={styles.successValue}>${result.amountAdded}</ThemedText>
                </View>
                {parseFloat(result.refundBonus) > 0 ? (
                  <View style={styles.successRow}>
                    <ThemedText style={styles.successLabel}>Bonus:</ThemedText>
                    <ThemedText style={styles.bonusValue}>+${result.refundBonus}</ThemedText>
                  </View>
                ) : null}
                <View style={[styles.successRow, styles.totalRow]}>
                  <ThemedText style={styles.totalLabel}>New Balance:</ThemedText>
                  <ThemedText style={styles.totalValue}>${result.newBalance}</ThemedText>
                </View>
              </View>
            </Animated.View>
          ) : null}

          <Pressable
            onPress={handleActivate}
            disabled={!isValidPin || status === "loading" || status === "success"}
            style={({ pressed }) => [
              styles.activateButton,
              (!isValidPin || status === "loading" || status === "success") && styles.activateButtonDisabled,
              pressed && styles.activateButtonPressed,
            ]}
          >
            <LinearGradient
              colors={
                !isValidPin || status === "loading" || status === "success"
                  ? ["#333", "#222"]
                  : [PremiumColors.emerald, "#059669"]
              }
              style={styles.activateButtonGradient}
            >
              {status === "loading" ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <>
                  <Feather 
                    name={status === "success" ? "check" : "plus-circle"} 
                    size={20} 
                    color="#FFFFFF" 
                  />
                  <ThemedText style={styles.activateButtonText}>
                    {status === "success" ? "Added!" : "Add Credits"}
                  </ThemedText>
                </>
              )}
            </LinearGradient>
          </Pressable>
        </GlassCard>

        <GlassCard style={[styles.infoCard, isLandscape && styles.infoCardLandscape]}>
          <View style={styles.infoRow}>
            <Feather name="info" size={18} color={PremiumColors.emerald} />
            <ThemedText style={styles.infoText}>
              PIN codes are available from your local agent. Each code can only be used once.
            </ThemedText>
          </View>
        </GlassCard>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0D0D0D",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.xs,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.full,
    backgroundColor: GlassColors.cardGlass,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  balanceContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  balanceLabel: {
    fontSize: 12,
    color: "rgba(255,255,255,0.6)",
  },
  balanceValue: {
    fontSize: 16,
    fontWeight: "700",
    color: NeonColors.green,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    alignItems: "center",
    gap: Spacing.md,
  },
  contentLandscape: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    alignItems: "flex-start",
  },
  mainCard: {
    padding: Spacing.xl,
    width: "100%",
    maxWidth: 420,
    alignItems: "center",
  },
  mainCardLandscape: {
    padding: Spacing.md,
    maxWidth: 360,
    flexDirection: "column",
  },
  iconContainer: {
    marginBottom: Spacing.md,
  },
  iconGradient: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: 14,
    color: "rgba(255,255,255,0.6)",
    textAlign: "center",
    marginBottom: Spacing.lg,
  },
  inputWrapper: {
    width: "100%",
    marginBottom: Spacing.md,
  },
  pinInput: {
    width: "100%",
    height: 56,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: BorderRadius.lg,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.15)",
    paddingHorizontal: Spacing.lg,
    fontSize: 18,
    fontWeight: "600",
    color: "#FFFFFF",
    textAlign: "center",
    letterSpacing: 2,
  },
  pinInputError: {
    borderColor: NeonColors.red,
    backgroundColor: "rgba(239, 68, 68, 0.1)",
  },
  pinInputSuccess: {
    borderColor: NeonColors.green,
    backgroundColor: "rgba(16, 185, 129, 0.1)",
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    marginBottom: Spacing.md,
    paddingHorizontal: Spacing.sm,
  },
  errorText: {
    fontSize: 13,
    color: NeonColors.red,
    flex: 1,
  },
  successContainer: {
    width: "100%",
    backgroundColor: "rgba(16, 185, 129, 0.1)",
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: "rgba(16, 185, 129, 0.3)",
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    alignItems: "center",
  },
  successIconContainer: {
    marginBottom: Spacing.sm,
  },
  successTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: NeonColors.green,
    marginBottom: Spacing.md,
  },
  successDetails: {
    width: "100%",
    gap: Spacing.sm,
  },
  successRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  successLabel: {
    fontSize: 14,
    color: "rgba(255,255,255,0.7)",
  },
  successValue: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  bonusValue: {
    fontSize: 16,
    fontWeight: "600",
    color: PremiumColors.royalGold,
  },
  totalRow: {
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.1)",
    marginTop: Spacing.xs,
  },
  totalLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  totalValue: {
    fontSize: 20,
    fontWeight: "700",
    color: NeonColors.green,
  },
  activateButton: {
    width: "100%",
    borderRadius: BorderRadius.lg,
    overflow: "hidden",
  },
  activateButtonDisabled: {
    opacity: 0.6,
  },
  activateButtonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  activateButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
  activateButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  infoCard: {
    padding: Spacing.md,
    width: "100%",
    maxWidth: 420,
  },
  infoCardLandscape: {
    maxWidth: 400,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.sm,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: "rgba(255,255,255,0.7)",
    lineHeight: 20,
  },
});
