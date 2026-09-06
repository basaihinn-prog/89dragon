import React, { useState, useEffect, useCallback } from "react";
import { View, StyleSheet, Pressable, useWindowDimensions, TextInput, ActivityIndicator, Platform, ScrollView } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import QRCode from "react-native-qrcode-svg";
import { ThemedText } from "@/components/ThemedText";
import { GlassCard } from "@/components/GlassCard";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { useAuth } from "@/contexts/AuthContext";
import { NeonColors, Spacing, BorderRadius, GlassColors, GradientColors, PremiumColors } from "@/constants/theme";
import { hasPin, savePin, verifyPin } from "@/services/pinService";

const ScrollContainer = Platform.OS === "web" ? ScrollView : KeyboardAwareScrollView;

type ScreenState = "loading" | "setup_pin" | "verify_pin" | "show_qr";

export default function WithdrawalScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { user } = useAuth();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();

  const isLandscape = screenWidth > screenHeight;

  const [screenState, setScreenState] = useState<ScreenState>("loading");
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [error, setError] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      checkPinStatus();
      return () => {
        setPin("");
        setConfirmPin("");
        setError("");
        setScreenState("loading");
      };
    }, [])
  );

  const checkPinStatus = async () => {
    const hasPinSet = await hasPin();
    setScreenState(hasPinSet ? "verify_pin" : "setup_pin");
  };

  const handleSetupPin = useCallback(async () => {
    if (pin.length !== 4) {
      setError("PIN must be 4 digits");
      return;
    }
    if (pin !== confirmPin) {
      setError("PINs do not match");
      return;
    }
    if (!/^\d{4}$/.test(pin)) {
      setError("PIN must contain only numbers");
      return;
    }

    setIsProcessing(true);
    setError("");

    const success = await savePin(pin);
    if (success) {
      setScreenState("show_qr");
    } else {
      setError("Failed to save PIN. Please try again.");
    }
    setIsProcessing(false);
  }, [pin, confirmPin]);

  const handleVerifyPin = useCallback(async () => {
    if (pin.length !== 4) {
      setError("Please enter your 4-digit PIN");
      return;
    }

    setIsProcessing(true);
    setError("");

    const isValid = await verifyPin(pin);
    if (isValid) {
      setScreenState("show_qr");
    } else {
      setError("Incorrect PIN. Please try again.");
      setPin("");
    }
    setIsProcessing(false);
  }, [pin]);

  const resetToVerify = () => {
    setPin("");
    setError("");
    setScreenState("verify_pin");
  };

  const renderContent = () => {
    if (screenState === "loading") {
      return (
        <GlassCard style={[styles.card, isLandscape && styles.cardLandscape]}>
          <ActivityIndicator size="large" color={PremiumColors.royalGold} />
        </GlassCard>
      );
    }

    if (screenState === "setup_pin") {
      return (
        <GlassCard style={[styles.card, isLandscape && styles.cardLandscape]}>
          <View style={[styles.iconContainer, isLandscape && { marginBottom: Spacing.sm }]}>
            <LinearGradient
              colors={[PremiumColors.royalGold, "#B8860B"]}
              style={[styles.iconGradient, isLandscape && { width: 50, height: 50, borderRadius: 25 }]}
            >
              <Feather name="lock" size={isLandscape ? 24 : 32} color="#FFFFFF" />
            </LinearGradient>
          </View>

          <ThemedText style={[styles.title, isLandscape && { fontSize: 16, marginBottom: Spacing.xs }]}>
            Set Up Your PIN
          </ThemedText>
          <ThemedText style={[styles.subtitle, isLandscape && { fontSize: 11, marginBottom: Spacing.sm }]}>
            Create a 4-digit PIN to protect your QR code
          </ThemedText>

          <View style={styles.inputContainer}>
            <TextInput
              style={[styles.pinInput, isLandscape && { height: 44, fontSize: 20 }]}
              placeholder="Enter PIN"
              placeholderTextColor="rgba(255,255,255,0.4)"
              keyboardType="numeric"
              maxLength={4}
              secureTextEntry
              value={pin}
              onChangeText={(text) => {
                setPin(text.replace(/[^0-9]/g, ""));
                setError("");
              }}
            />
            <TextInput
              style={[styles.pinInput, isLandscape && { height: 44, fontSize: 20 }]}
              placeholder="Confirm PIN"
              placeholderTextColor="rgba(255,255,255,0.4)"
              keyboardType="numeric"
              maxLength={4}
              secureTextEntry
              value={confirmPin}
              onChangeText={(text) => {
                setConfirmPin(text.replace(/[^0-9]/g, ""));
                setError("");
              }}
            />
          </View>

          {error ? <ThemedText style={styles.errorText}>{error}</ThemedText> : null}

          <Pressable
            style={[styles.button, isProcessing && styles.buttonDisabled]}
            onPress={handleSetupPin}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <ThemedText style={styles.buttonText}>Set PIN</ThemedText>
            )}
          </Pressable>
        </GlassCard>
      );
    }

    if (screenState === "verify_pin") {
      return (
        <GlassCard style={[styles.card, isLandscape && styles.cardLandscape]}>
          <View style={[styles.iconContainer, isLandscape && { marginBottom: Spacing.sm }]}>
            <LinearGradient
              colors={[PremiumColors.royalGold, "#B8860B"]}
              style={[styles.iconGradient, isLandscape && { width: 50, height: 50, borderRadius: 25 }]}
            >
              <Feather name="shield" size={isLandscape ? 24 : 32} color="#FFFFFF" />
            </LinearGradient>
          </View>

          <ThemedText style={[styles.title, isLandscape && { fontSize: 16, marginBottom: Spacing.xs }]}>
            Enter Your PIN
          </ThemedText>
          <ThemedText style={[styles.subtitle, isLandscape && { fontSize: 11, marginBottom: Spacing.sm }]}>
            Enter your 4-digit PIN to view your QR code
          </ThemedText>

          <View style={styles.inputContainer}>
            <TextInput
              style={[styles.pinInput, isLandscape && { height: 44, fontSize: 20 }]}
              placeholder="Enter PIN"
              placeholderTextColor="rgba(255,255,255,0.4)"
              keyboardType="numeric"
              maxLength={4}
              secureTextEntry
              value={pin}
              onChangeText={(text) => {
                setPin(text.replace(/[^0-9]/g, ""));
                setError("");
              }}
            />
          </View>

          {error ? <ThemedText style={styles.errorText}>{error}</ThemedText> : null}

          <Pressable
            style={[styles.button, isProcessing && styles.buttonDisabled]}
            onPress={handleVerifyPin}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <ThemedText style={styles.buttonText}>Verify PIN</ThemedText>
            )}
          </Pressable>
        </GlassCard>
      );
    }

    if (screenState === "show_qr") {
      const oddsId = user?.user_id?.toString() || user?.id?.toString() || "0";
      const shopId = user?.shop_id?.toString() || "0";
      const qrValue = JSON.stringify({ oddsId, shopId });

      if (isLandscape) {
        return (
          <GlassCard style={styles.cardLandscapeQR}>
            <View style={styles.qrLandscapeLeft}>
              <View style={styles.qrContainerLandscape}>
                <QRCode
                  value={qrValue}
                  size={140}
                  color="#FFFFFF"
                  backgroundColor="transparent"
                />
              </View>
              <Pressable style={styles.lockButtonLandscape} onPress={resetToVerify}>
                <Feather name="lock" size={14} color="#FFFFFF" />
                <ThemedText style={styles.lockButtonText}>Lock</ThemedText>
              </Pressable>
            </View>
            <View style={styles.qrLandscapeRight}>
              <ThemedText style={styles.titleLandscape}>Cashout QR Code</ThemedText>
              <View style={styles.userIdRowLandscape}>
                <ThemedText style={styles.userIdLabelSmall}>Player ID:</ThemedText>
                <ThemedText style={styles.userIdValueSmall}>{oddsId}</ThemedText>
              </View>
              <View style={styles.userIdRowLandscape}>
                <ThemedText style={styles.userIdLabelSmall}>Shop ID:</ThemedText>
                <ThemedText style={styles.userIdValueSmall}>{shopId}</ThemedText>
              </View>
              <View style={styles.noteSectionLandscape}>
                <Feather name="info" size={14} color={PremiumColors.royalGold} />
                <ThemedText style={styles.noteTextLandscape}>
                  Show this QR code to the cashier when cashing out.
                </ThemedText>
              </View>
            </View>
          </GlassCard>
        );
      }

      return (
        <GlassCard style={styles.card}>
          <ThemedText style={styles.title}>Your Cashout QR Code</ThemedText>

          <View style={styles.qrContainer}>
            <QRCode
              value={qrValue}
              size={180}
              color="#FFFFFF"
              backgroundColor="transparent"
            />
          </View>

          <View style={styles.userIdContainer}>
            <ThemedText style={styles.userIdLabel}>Player ID:</ThemedText>
            <ThemedText style={styles.userIdValue}>{oddsId}</ThemedText>
          </View>

          <View style={styles.userIdContainer}>
            <ThemedText style={styles.userIdLabel}>Shop ID:</ThemedText>
            <ThemedText style={styles.userIdValue}>{shopId}</ThemedText>
          </View>

          <View style={styles.divider} />

          <View style={styles.noteSection}>
            <Feather name="info" size={20} color={PremiumColors.royalGold} />
            <ThemedText style={styles.noteText}>
              Show this QR code to the cashier for easy account lookup when cashing out.
            </ThemedText>
          </View>

          <Pressable style={styles.lockButton} onPress={resetToVerify}>
            <Feather name="lock" size={16} color="#FFFFFF" />
            <ThemedText style={styles.lockButtonText}>Lock QR Code</ThemedText>
          </Pressable>
        </GlassCard>
      );
    }

    return null;
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <LinearGradient
        colors={GradientColors.velvetNight}
        style={StyleSheet.absoluteFill}
      />

      <View style={[styles.header, { paddingTop: insets.top + Spacing.xs }]}>
        <Pressable
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Feather name="arrow-left" size={22} color="#FFFFFF" />
        </Pressable>
        <ThemedText style={styles.headerTitle}>Cash Out</ThemedText>
        <View style={styles.balanceContainer}>
          <ThemedText style={styles.balanceLabel}>Balance:</ThemedText>
          <ThemedText style={styles.balanceValue}>
            ${user?.balance?.toFixed(2) || "0.00"}
          </ThemedText>
        </View>
      </View>

      <ScrollContainer
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + Spacing.xl }
        ]}
        keyboardShouldPersistTaps="handled"
      >
        {renderContent()}
      </ScrollContainer>
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
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: Spacing.md,
    justifyContent: "center",
    alignItems: "center",
  },
  card: {
    padding: Spacing.xl,
    alignItems: "center",
    maxWidth: 400,
    width: "100%",
  },
  cardLandscape: {
    padding: Spacing.md,
    maxWidth: 320,
  },
  iconContainer: {
    marginBottom: Spacing.lg,
  },
  iconGradient: {
    width: 70,
    height: 70,
    borderRadius: 35,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.2)",
  },
  title: {
    fontSize: 20,
    fontWeight: "800",
    color: "#FFFFFF",
    textAlign: "center",
    marginBottom: Spacing.sm,
  },
  subtitle: {
    fontSize: 13,
    color: "rgba(255,255,255,0.7)",
    textAlign: "center",
    marginBottom: Spacing.lg,
  },
  inputContainer: {
    width: "100%",
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  pinInput: {
    width: "100%",
    height: 50,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    fontSize: 24,
    color: "#FFFFFF",
    textAlign: "center",
    letterSpacing: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  errorText: {
    color: "#EF4444",
    fontSize: 12,
    marginBottom: Spacing.sm,
    textAlign: "center",
  },
  button: {
    width: "100%",
    height: 48,
    borderRadius: BorderRadius.md,
    backgroundColor: PremiumColors.royalGold,
    alignItems: "center",
    justifyContent: "center",
    marginTop: Spacing.sm,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  qrContainer: {
    padding: Spacing.lg,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  userIdContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  userIdLabel: {
    fontSize: 14,
    color: "rgba(255,255,255,0.6)",
  },
  userIdValue: {
    fontSize: 18,
    fontWeight: "700",
    color: PremiumColors.royalGold,
  },
  divider: {
    width: "80%",
    height: 1,
    backgroundColor: "rgba(255,255,255,0.15)",
    marginVertical: Spacing.md,
  },
  noteSection: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.sm,
    backgroundColor: "rgba(212, 175, 55, 0.1)",
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: "rgba(212, 175, 55, 0.3)",
    width: "100%",
  },
  noteText: {
    flex: 1,
    fontSize: 13,
    color: "rgba(255,255,255,0.8)",
    lineHeight: 18,
  },
  lockButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    marginTop: Spacing.md,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: BorderRadius.md,
  },
  lockButtonText: {
    fontSize: 13,
    color: "rgba(255,255,255,0.8)",
  },
  cardLandscapeQR: {
    flexDirection: "row",
    padding: Spacing.md,
    maxWidth: 480,
    gap: Spacing.md,
  },
  qrLandscapeLeft: {
    alignItems: "center",
    gap: Spacing.sm,
  },
  qrLandscapeRight: {
    flex: 1,
    justifyContent: "center",
    gap: Spacing.xs,
  },
  qrContainerLandscape: {
    padding: Spacing.sm,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  lockButtonLandscape: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: BorderRadius.sm,
  },
  titleLandscape: {
    fontSize: 16,
    fontWeight: "800",
    color: "#FFFFFF",
    marginBottom: Spacing.xs,
  },
  userIdRowLandscape: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  userIdLabelSmall: {
    fontSize: 12,
    color: "rgba(255,255,255,0.6)",
  },
  userIdValueSmall: {
    fontSize: 14,
    fontWeight: "700",
    color: PremiumColors.royalGold,
  },
  noteSectionLandscape: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.xs,
    backgroundColor: "rgba(212, 175, 55, 0.1)",
    padding: Spacing.sm,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: "rgba(212, 175, 55, 0.3)",
    marginTop: Spacing.xs,
  },
  noteTextLandscape: {
    flex: 1,
    fontSize: 11,
    color: "rgba(255,255,255,0.8)",
    lineHeight: 14,
  },
});
