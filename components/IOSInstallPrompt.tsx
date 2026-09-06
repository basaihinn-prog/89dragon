import React, { useState, useEffect } from "react";
import { View, StyleSheet, Pressable, Platform, Animated, Dimensions } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Feather } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { ThemedText } from "./ThemedText";
import { NeonColors, Spacing, BorderRadius } from "@/constants/theme";

const IOS_INSTALL_PROMPT_KEY = "@jade_royale_ios_install_dismissed";

export function IOSInstallPrompt() {
  const [isVisible, setIsVisible] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    checkShouldShow();
  }, []);

  const checkShouldShow = async () => {
    if (Platform.OS !== "web") return;

    const userAgent = navigator.userAgent.toLowerCase();
    const isIOS = /iphone|ipad|ipod/.test(userAgent);
    const isSafari = /safari/.test(userAgent) && !/chrome/.test(userAgent) && !/crios/.test(userAgent);
    const isStandalone = (window.navigator as any).standalone === true;

    if (!isIOS || isStandalone) return;

    try {
      const dismissed = await AsyncStorage.getItem(IOS_INSTALL_PROMPT_KEY);
      if (dismissed) {
        const dismissedDate = new Date(dismissed);
        const daysSinceDismissed = (Date.now() - dismissedDate.getTime()) / (1000 * 60 * 60 * 24);
        if (daysSinceDismissed < 7) return;
      }

      setTimeout(() => {
        setIsVisible(true);
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }).start();
      }, 3000);
    } catch (error) {
      console.error("Error checking install prompt:", error);
    }
  };

  const handleDismiss = async () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setIsVisible(false);
    });

    try {
      await AsyncStorage.setItem(IOS_INSTALL_PROMPT_KEY, new Date().toISOString());
    } catch (error) {
      console.error("Error saving dismiss state:", error);
    }
  };

  if (!isVisible) return null;

  return (
    <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
      <Pressable style={styles.backdrop} onPress={handleDismiss} />
      <Animated.View style={[styles.promptContainer, { transform: [{ translateY: fadeAnim.interpolate({ inputRange: [0, 1], outputRange: [100, 0] }) }] }]}>
        <BlurView intensity={80} tint="dark" style={styles.blurContainer}>
          <View style={styles.content}>
            <Pressable style={styles.closeButton} onPress={handleDismiss}>
              <Feather name="x" size={18} color="rgba(255, 255, 255, 0.6)" />
            </Pressable>

            <View style={styles.header}>
              <View style={styles.iconContainer}>
                <Feather name="download" size={24} color={NeonColors.gold} />
              </View>
              <ThemedText style={styles.title}>Install Jade Royale</ThemedText>
            </View>

            <ThemedText style={styles.description}>
              Add Jade Royale to your home screen for the best experience
            </ThemedText>

            <View style={styles.steps}>
              <View style={styles.step}>
                <View style={styles.stepNumber}>
                  <ThemedText style={styles.stepNumberText}>1</ThemedText>
                </View>
                <View style={styles.stepContent}>
                  <Feather name="share" size={16} color={NeonColors.blue} />
                  <ThemedText style={styles.stepText}>
                    Tap the Share button below
                  </ThemedText>
                </View>
              </View>

              <View style={styles.step}>
                <View style={styles.stepNumber}>
                  <ThemedText style={styles.stepNumberText}>2</ThemedText>
                </View>
                <View style={styles.stepContent}>
                  <Feather name="plus-square" size={16} color={NeonColors.green} />
                  <ThemedText style={styles.stepText}>
                    Select "Add to Home Screen"
                  </ThemedText>
                </View>
              </View>

              <View style={styles.step}>
                <View style={styles.stepNumber}>
                  <ThemedText style={styles.stepNumberText}>3</ThemedText>
                </View>
                <View style={styles.stepContent}>
                  <Feather name="check-circle" size={16} color={NeonColors.gold} />
                  <ThemedText style={styles.stepText}>
                    Tap "Add" to install
                  </ThemedText>
                </View>
              </View>
            </View>

            <View style={styles.arrowContainer}>
              <Feather name="chevron-down" size={24} color="rgba(255, 255, 255, 0.4)" />
            </View>
          </View>
        </BlurView>
      </Animated.View>
    </Animated.View>
  );
}

const { width: screenWidth } = Dimensions.get("window");

const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "flex-end",
    alignItems: "center",
    zIndex: 9999,
  },
  backdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  promptContainer: {
    width: Math.min(screenWidth - 32, 400),
    marginBottom: 60,
    borderRadius: BorderRadius.lg,
    overflow: "hidden",
  },
  blurContainer: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: "rgba(212, 175, 55, 0.3)",
    overflow: "hidden",
  },
  content: {
    padding: Spacing.lg,
    paddingTop: Spacing.xl,
  },
  closeButton: {
    position: "absolute",
    top: 12,
    right: 12,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: Spacing.md,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "rgba(212, 175, 55, 0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  description: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.7)",
    marginBottom: Spacing.lg,
    lineHeight: 20,
  },
  steps: {
    gap: 12,
  },
  step: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  stepNumber: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "rgba(139, 92, 246, 0.3)",
    alignItems: "center",
    justifyContent: "center",
  },
  stepNumberText: {
    fontSize: 12,
    fontWeight: "600",
    color: NeonColors.purple,
  },
  stepContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  stepText: {
    fontSize: 13,
    color: "rgba(255, 255, 255, 0.9)",
    flex: 1,
  },
  arrowContainer: {
    alignItems: "center",
    marginTop: Spacing.md,
  },
});
