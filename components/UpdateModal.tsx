import React, { useEffect } from "react";
import {
  View,
  StyleSheet,
  Modal,
  Pressable,
  useWindowDimensions,
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
  withRepeat,
  withSequence,
  withTiming,
  Easing,
  FadeIn,
} from "react-native-reanimated";
import { ThemedText } from "@/components/ThemedText";
import { UpdateInfo, openDownloadUrl } from "@/services/updateChecker";
import { BorderRadius, Spacing, NeonColors, PremiumColors, GlassColors, createBoxShadow } from "@/constants/theme";

interface UpdateModalProps {
  visible: boolean;
  updateInfo: UpdateInfo | null;
  onClose: () => void;
}

export function UpdateModal({ visible, updateInfo, onClose }: UpdateModalProps) {
  const { width: screenWidth } = useWindowDimensions();
  const modalWidth = Math.min(screenWidth * 0.9, 500);
  const scale = useSharedValue(0.8);
  const glowOpacity = useSharedValue(0.4);
  const buttonScale = useSharedValue(1);

  useEffect(() => {
    if (visible) {
      scale.value = withSpring(1, { damping: 12, stiffness: 100 });
      glowOpacity.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 800, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.4, { duration: 800, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );
    } else {
      scale.value = 0.8;
    }
  }, [visible]);

  const containerAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const glowAnimatedStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  const buttonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  const handleUpdate = async () => {
    if (Platform.OS !== "web") {
      try {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } catch (e) {}
    }
    buttonScale.value = withSequence(
      withTiming(0.95, { duration: 100 }),
      withSpring(1, { damping: 10 })
    );
    if (updateInfo?.downloadUrl) {
      await openDownloadUrl(updateInfo.downloadUrl);
    }
  };

  const handleLater = () => {
    if (Platform.OS !== "web") {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch (e) {}
    }
    onClose();
  };

  if (!updateInfo) return null;

  const isForceUpdate = updateInfo.forceUpdate;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={isForceUpdate ? undefined : onClose}
    >
      <View style={styles.overlay}>
        <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill} />
        
        <Animated.View style={[styles.modalContainer, containerAnimatedStyle, { width: modalWidth }]}>
          <Animated.View style={[styles.glowEffect, glowAnimatedStyle]} />
          
          <LinearGradient
            colors={[
              "rgba(30, 20, 50, 0.98)",
              "rgba(20, 15, 40, 0.98)",
              "rgba(15, 10, 30, 0.98)",
            ]}
            style={styles.gradientBackground}
          >
            <View style={styles.borderGlow} />
            
            <View style={styles.content}>
              <View style={styles.iconContainer}>
                <LinearGradient
                  colors={[NeonColors.cyan, NeonColors.blue]}
                  style={styles.iconGradient}
                >
                  <Feather name="download-cloud" size={32} color="#FFFFFF" />
                </LinearGradient>
              </View>

              <ThemedText style={styles.title}>Update Available</ThemedText>
              
              <View style={styles.versionBadge}>
                <ThemedText style={styles.versionText}>
                  Version {updateInfo.versionName}
                </ThemedText>
              </View>

              <ThemedText style={styles.releaseNotesTitle}>What's New:</ThemedText>
              <View style={styles.releaseNotesContainer}>
                <ThemedText style={styles.releaseNotes}>
                  {updateInfo.releaseNotes}
                </ThemedText>
              </View>

              <View style={styles.buttonContainer}>
                <Pressable onPress={handleUpdate}>
                  <Animated.View style={[styles.updateButton, buttonAnimatedStyle]}>
                    <LinearGradient
                      colors={[NeonColors.cyan, NeonColors.blue]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.updateButtonGradient}
                    >
                      <Feather name="download" size={18} color="#FFFFFF" style={styles.buttonIcon} />
                      <ThemedText style={styles.updateButtonText}>Update Now</ThemedText>
                    </LinearGradient>
                  </Animated.View>
                </Pressable>

                {!isForceUpdate ? (
                  <Pressable onPress={handleLater} style={styles.laterButton}>
                    <ThemedText style={styles.laterButtonText}>Later</ThemedText>
                  </Pressable>
                ) : (
                  <ThemedText style={styles.forceUpdateText}>
                    This update is required to continue
                  </ThemedText>
                )}
              </View>
            </View>
          </LinearGradient>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.7)",
  },
  modalContainer: {
    borderRadius: BorderRadius.xl,
    overflow: "hidden",
    position: "relative",
  },
  glowEffect: {
    position: "absolute",
    top: -2,
    left: -2,
    right: -2,
    bottom: -2,
    borderRadius: BorderRadius.xl + 2,
    backgroundColor: NeonColors.cyan,
    ...createBoxShadow(NeonColors.cyan, 0, 0, 0.6, 20, 8),
  },
  gradientBackground: {
    borderRadius: BorderRadius.xl,
    overflow: "hidden",
    position: "relative",
  },
  borderGlow: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: "rgba(0, 229, 255, 0.3)",
  },
  content: {
    padding: Spacing.xl,
    alignItems: "center",
  },
  iconContainer: {
    marginBottom: Spacing.lg,
  },
  iconGradient: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
    ...createBoxShadow(NeonColors.cyan, 0, 0, 0.5, 15, 6),
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: Spacing.md,
    textAlign: "center",
  },
  versionBadge: {
    backgroundColor: "rgba(0, 229, 255, 0.15)",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: "rgba(0, 229, 255, 0.3)",
    marginBottom: Spacing.lg,
  },
  versionText: {
    fontSize: 14,
    fontWeight: "600",
    color: NeonColors.cyan,
  },
  releaseNotesTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "rgba(255, 255, 255, 0.7)",
    alignSelf: "flex-start",
    marginBottom: Spacing.sm,
  },
  releaseNotesContainer: {
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    width: "100%",
    marginBottom: Spacing.xl,
    maxHeight: 120,
  },
  releaseNotes: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.8)",
    lineHeight: 20,
  },
  buttonContainer: {
    width: "100%",
    alignItems: "center",
  },
  updateButton: {
    borderRadius: BorderRadius.lg,
    overflow: "hidden",
    ...createBoxShadow(NeonColors.cyan, 0, 4, 0.4, 12, 6),
  },
  updateButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing["3xl"],
  },
  buttonIcon: {
    marginRight: Spacing.sm,
  },
  updateButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  laterButton: {
    marginTop: Spacing.lg,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.xl,
  },
  laterButtonText: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.6)",
    fontWeight: "500",
  },
  forceUpdateText: {
    marginTop: Spacing.md,
    fontSize: 12,
    color: NeonColors.orange,
    fontWeight: "500",
    textAlign: "center",
  },
});
