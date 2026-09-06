import React, { useRef, useEffect } from "react";
import {
  View,
  StyleSheet,
  Modal,
  Pressable,
  useWindowDimensions,
  ViewStyle,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
} from "react-native-reanimated";
import { BorderRadius, Spacing } from "@/constants/theme";

interface BaseModalProps {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  gradientColors?: string[];
  borderColor?: string;
  closeButtonColors?: string[];
  maxWidth?: number;
  maxHeight?: number;
  style?: ViewStyle;
  showCloseButton?: boolean;
  closeOnBackdrop?: boolean;
}

export function BaseModal({
  visible,
  onClose,
  children,
  gradientColors = ["#2D1B69", "#1E1145", "#150D30"],
  borderColor = "#9333EA",
  closeButtonColors = ["#FF8C00", "#FF6600"],
  maxWidth,
  maxHeight,
  style,
  showCloseButton = true,
  closeOnBackdrop = true,
}: BaseModalProps) {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const isLandscape = screenWidth > screenHeight;
  
  const defaultMaxWidth = isLandscape 
    ? Math.min(screenWidth * 0.7, 500) 
    : Math.min(screenWidth * 0.95, 600);
  const defaultMaxHeight = screenHeight * 0.85;
  
  const modalWidth = maxWidth || defaultMaxWidth;
  const modalMaxHeight = maxHeight || defaultMaxHeight;

  const modalScale = useSharedValue(visible ? 1 : 0.8);
  const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (visible) {
      modalScale.value = withSpring(1, { damping: 15, stiffness: 150 });
    } else {
      modalScale.value = 0.8;
    }
  }, [visible]);

  useEffect(() => {
    return () => {
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current);
      }
    };
  }, []);

  const handleClose = () => {
    modalScale.value = withTiming(0.8, { duration: 150 });
    if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
    closeTimeoutRef.current = setTimeout(onClose, 150);
  };

  const modalStyle = useAnimatedStyle(() => ({
    transform: [{ scale: modalScale.value }],
    opacity: interpolate(modalScale.value, [0.8, 1], [0, 1]),
  }));

  const closeButtonSize = isLandscape ? 30 : 36;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleClose}
    >
      <Pressable 
        style={styles.overlay} 
        onPress={closeOnBackdrop ? handleClose : undefined}
      >
        <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill} />
        
        <Animated.View style={modalStyle}>
          <Pressable onPress={(e) => e.stopPropagation()}>
            <LinearGradient
              colors={gradientColors as [string, string, ...string[]]}
              style={[
                styles.modalContainer,
                {
                  width: modalWidth,
                  maxHeight: modalMaxHeight,
                  borderColor,
                  padding: isLandscape ? Spacing.sm : Spacing.lg,
                  paddingTop: isLandscape ? Spacing.sm : Spacing.xl,
                  paddingBottom: isLandscape ? Spacing.xs : Spacing.lg,
                },
                style,
              ]}
            >
              <View style={[styles.borderGlow, { borderColor: borderColor + "80" }]} />

              {showCloseButton ? (
                <Pressable style={styles.closeButton} onPress={handleClose}>
                  <LinearGradient
                    colors={closeButtonColors as [string, string, ...string[]]}
                    style={[
                      styles.closeButtonGradient, 
                      { 
                        width: closeButtonSize, 
                        height: closeButtonSize, 
                        borderRadius: closeButtonSize / 2 
                      }
                    ]}
                  >
                    <Feather name="x" size={isLandscape ? 18 : 22} color="#FFFFFF" />
                  </LinearGradient>
                </Pressable>
              ) : null}

              {children}
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
  },
  borderGlow: {
    position: "absolute",
    top: -2,
    left: -2,
    right: -2,
    bottom: -2,
    borderRadius: 26,
    borderWidth: 2,
  },
  closeButton: {
    position: "absolute",
    top: 12,
    right: 12,
    zIndex: 10,
  },
  closeButtonGradient: {
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
});
