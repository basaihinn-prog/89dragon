import React, { useEffect } from "react";
import { View, StyleSheet, Pressable, Platform, useWindowDimensions } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { Image } from "expo-image";
import * as Haptics from "expo-haptics";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  withRepeat,
  withSequence,
  Easing,
  interpolate,
  withDelay,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ThemedText } from "@/components/ThemedText";
import { BorderRadius, PremiumColors, GlassColors, createBoxShadow, createTextShadow } from "@/constants/theme";
import { CategoryFilter } from "@/contexts/GamesContext";

export const SIDEBAR_WIDTH = 100;
export const SIDEBAR_WIDTH_PORTRAIT = 70;

// Sparkle star component for twinkling effect
function SparkleStar({ x, y, size, delay, color }: { x: number; y: number; size: number; delay: number; color: string }) {
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.5);

  useEffect(() => {
    opacity.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 800, easing: Easing.out(Easing.ease) }),
          withTiming(0.2, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.8, { duration: 600, easing: Easing.inOut(Easing.ease) }),
          withTiming(0, { duration: 1000, easing: Easing.in(Easing.ease) })
        ),
        -1,
        false
      )
    );
    scale.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1.2, { duration: 800, easing: Easing.out(Easing.ease) }),
          withTiming(0.8, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 600, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.5, { duration: 1000, easing: Easing.in(Easing.ease) })
        ),
        -1,
        false
      )
    );
  }, [delay]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View
      style={[
        {
          position: "absolute",
          left: `${x}%`,
          top: `${y}%`,
          width: size,
          height: size,
        },
        animatedStyle,
      ]}
    >
      {/* 4-point star shape */}
      <View style={{
        position: "absolute",
        width: size,
        height: 2,
        backgroundColor: color,
        top: (size - 2) / 2,
        borderRadius: 1,
      }} />
      <View style={{
        position: "absolute",
        width: 2,
        height: size,
        backgroundColor: color,
        left: (size - 2) / 2,
        borderRadius: 1,
      }} />
      {/* Center glow */}
      <View style={{
        position: "absolute",
        width: size * 0.4,
        height: size * 0.4,
        backgroundColor: color,
        borderRadius: size * 0.2,
        left: size * 0.3,
        top: size * 0.3,
        shadowColor: color,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 1,
        shadowRadius: 4,
      }} />
    </Animated.View>
  );
}

// Sparkle stars background
function SparkleStarsBackground() {
  const stars = [
    { x: 15, y: 8, size: 8, delay: 0, color: "#FFD700" },
    { x: 75, y: 15, size: 6, delay: 500, color: "#FFFFFF" },
    { x: 25, y: 28, size: 5, delay: 1200, color: "#D4AF37" },
    { x: 65, y: 35, size: 7, delay: 800, color: "#FFD700" },
    { x: 45, y: 48, size: 4, delay: 1800, color: "#FFFFFF" },
    { x: 80, y: 55, size: 6, delay: 400, color: "#D4AF37" },
    { x: 20, y: 62, size: 5, delay: 1500, color: "#FFD700" },
    { x: 55, y: 72, size: 7, delay: 200, color: "#FFFFFF" },
    { x: 35, y: 85, size: 4, delay: 1000, color: "#D4AF37" },
    { x: 70, y: 92, size: 6, delay: 600, color: "#FFD700" },
  ];

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {stars.map((star, index) => (
        <SparkleStar
          key={index}
          x={star.x}
          y={star.y}
          size={star.size}
          delay={star.delay}
          color={star.color}
        />
      ))}
    </View>
  );
}

// Particle component for floating effects
function FloatingParticle({ delay, color }: { delay: number; color: string }) {
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    translateY.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(-30, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
          withTiming(0, { duration: 2000, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      )
    );
    opacity.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(0.8, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
          withTiming(0, { duration: 1000, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      )
    );
  }, [delay]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        {
          position: "absolute",
          width: 3,
          height: 3,
          borderRadius: 1.5,
          backgroundColor: color,
        },
        animatedStyle,
      ]}
    />
  );
}

const slotsIcon = require("../attached_assets/generated_images/neon_slot_machine_icon.png");
const fishIcon = require("../attached_assets/generated_images/neon_fish_game_icon.png");
const tablesIcon = require("../attached_assets/generated_images/neon_card_tables_icon.png");
const favesIcon = require("../attached_assets/generated_images/neon_favorites_heart_icon.png");
const jadeRoyaleLogo = require("../attached_assets/targeted_element_1765780843892.png");
interface SidebarProps {
  selectedCategory: CategoryFilter;
  onCategoryChange: (category: CategoryFilter) => void;
}

interface CategoryButtonProps {
  iconSource: any;
  label: string;
  isSelected: boolean;
  accentColor: string;
  onPress: () => void;
  index: number;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function CategoryButton({ iconSource, label, isSelected, accentColor, onPress, index }: CategoryButtonProps) {
  const scale = useSharedValue(1);
  const backgroundOpacity = useSharedValue(isSelected ? 1 : 0);
  const glowOpacity = useSharedValue(0);
  const borderGlow = useSharedValue(0.3);
  const iconGlow = useSharedValue(0.5);
  const breathingScale = useSharedValue(1);
  const subtleGlow = useSharedValue(0.2);
  const holographicShimmer = useSharedValue(0);
  const particlesOpacity = useSharedValue(0);
  const iconRotation = useSharedValue(0);

  useEffect(() => {
    const breathingDelay = index * 400;
    breathingScale.value = withRepeat(
      withSequence(
        withTiming(1.03, { duration: 2000 + breathingDelay, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 2000 + breathingDelay, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
    subtleGlow.value = withRepeat(
      withSequence(
        withTiming(0.4, { duration: 2500 + breathingDelay, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.15, { duration: 2500 + breathingDelay, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );

    // Holographic shimmer effect
    holographicShimmer.value = withRepeat(
      withTiming(1, { duration: 3000, easing: Easing.linear }),
      -1,
      false
    );
  }, [index]);

  useEffect(() => {
    backgroundOpacity.value = withTiming(isSelected ? 1 : 0, { duration: 250 });
    particlesOpacity.value = withTiming(isSelected ? 1 : 0, { duration: 300 });

    if (isSelected) {
      // Icon rotation on selection
      iconRotation.value = withSequence(
        withTiming(5, { duration: 150, easing: Easing.out(Easing.ease) }),
        withTiming(0, { duration: 150, easing: Easing.inOut(Easing.ease) })
      );

      glowOpacity.value = withRepeat(
        withSequence(
          withTiming(0.9, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.4, { duration: 1200, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );
      borderGlow.value = withRepeat(
        withSequence(
          withTiming(0.8, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.3, { duration: 1500, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );
      iconGlow.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.6, { duration: 1000, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );
    } else {
      glowOpacity.value = withTiming(0, { duration: 200 });
      borderGlow.value = withTiming(0.3, { duration: 200 });
      iconGlow.value = withTiming(0.5, { duration: 200 });
      iconRotation.value = withTiming(0, { duration: 200 });
    }
  }, [isSelected]);

  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const backgroundStyle = useAnimatedStyle(() => ({
    opacity: backgroundOpacity.value,
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  const borderGlowStyle = useAnimatedStyle(() => ({
    opacity: borderGlow.value,
  }));

  const iconContainerStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: breathingScale.value },
      { rotate: `${iconRotation.value}deg` }
    ],
  }));

  const subtleGlowStyle = useAnimatedStyle(() => ({
    opacity: subtleGlow.value,
  }));

  const holographicStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: interpolate(holographicShimmer.value, [0, 1], [-100, 100]) }
    ],
    opacity: interpolate(holographicShimmer.value, [0, 0.5, 1], [0, 0.3, 0]),
  }));

  const particlesStyle = useAnimatedStyle(() => ({
    opacity: particlesOpacity.value,
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.92, { damping: 15, stiffness: 200 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 200 });
  };

  const handlePress = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onPress();
  };

  return (
    <Pressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={styles.categoryButton}
    >
      <Animated.View style={[StyleSheet.absoluteFill, containerStyle, { pointerEvents: "none" }]}>
        <Animated.View style={[styles.buttonGlow, { backgroundColor: accentColor, pointerEvents: "none" }, glowStyle]} />

        <Animated.View style={[styles.buttonBackground, backgroundStyle, { pointerEvents: "none" }]}>
          <LinearGradient
            colors={[accentColor + "35", accentColor + "15", "rgba(0, 0, 0, 0.2)"]}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={styles.buttonGradient}
          />
          <View style={[styles.buttonBorderInner, { borderColor: accentColor + "60" }]} />

          {/* Holographic shimmer effect */}
          <Animated.View style={[styles.holographicShimmer, holographicStyle]}>
            <LinearGradient
              colors={["transparent", "rgba(255, 255, 255, 0.4)", "transparent"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={StyleSheet.absoluteFill}
            />
          </Animated.View>
        </Animated.View>

        <Animated.View style={[styles.borderGlowOverlay, borderGlowStyle, { pointerEvents: "none" }]}>
          <LinearGradient
            colors={[accentColor + "80", "transparent", accentColor + "60"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>

        {/* Floating particles for selected state */}
        {isSelected && (
          <Animated.View style={[styles.particlesContainer, particlesStyle, { pointerEvents: "none" }]}>
            <FloatingParticle delay={0} color={accentColor} />
            <FloatingParticle delay={300} color={accentColor} />
            <FloatingParticle delay={600} color={accentColor} />
          </Animated.View>
        )}
      </Animated.View>

      <View style={[styles.categoryButtonContent, { pointerEvents: "none" }]}>
        <ThemedText 
          style={[
            styles.label,
            { color: isSelected ? accentColor : "rgba(255, 255, 255, 0.6)" },
            isSelected ? createTextShadow(accentColor, 0, 0, 6) : null,
          ]}
          numberOfLines={1}
        >
          {label}
        </ThemedText>

        <Animated.View style={[
          styles.iconWrapper,
          iconContainerStyle,
          { pointerEvents: "none" }
        ]}>
          <Image
            source={iconSource}
            style={[
              styles.iconImage,
              isSelected && { opacity: 1 },
              !isSelected && { opacity: 0.7 }
            ]}
            contentFit="contain"
          />
        </Animated.View>

      </View>
    </Pressable>
  );
}

function PremiumDivider() {
  const shimmer = useSharedValue(0);

  useEffect(() => {
    shimmer.value = withRepeat(
      withTiming(1, { duration: 3000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, []);

  const shimmerStyle = useAnimatedStyle(() => ({
    opacity: interpolate(shimmer.value, [0, 0.5, 1], [0.2, 0.5, 0.2]),
  }));

  return (
    <View style={styles.dividerContainer}>
      <LinearGradient
        colors={["transparent", "rgba(212, 175, 55, 0.3)", "transparent"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.divider}
      />
      <Animated.View style={[styles.dividerShimmer, shimmerStyle]}>
        <LinearGradient
          colors={["transparent", "rgba(255, 255, 255, 0.5)", "transparent"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
    </View>
  );
}

// Animated border flow effect
function AnimatedBorderFlow() {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withRepeat(
      withTiming(1, { duration: 4000, easing: Easing.linear }),
      -1,
      false
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: interpolate(progress.value, [0, 1], [0, 200]) }],
  }));

  return (
    <Animated.View style={[styles.borderFlow, animatedStyle]}>
      <LinearGradient
        colors={[
          "transparent",
          "rgba(212, 175, 55, 0.8)",
          "rgba(139, 92, 246, 0.8)",
          "rgba(212, 175, 55, 0.8)",
          "transparent"
        ]}
        style={{ flex: 1 }}
      />
    </Animated.View>
  );
}


function BottomMenuButton({ iconName, label, color, onPress, index }: { iconName: string; label: string; color: string; onPress: () => void; index: number }) {
  const scale = useSharedValue(1);
  const breathingScale = useSharedValue(1);
  const subtleGlow = useSharedValue(0.2);
  const Feather = require("@expo/vector-icons").Feather;

  useEffect(() => {
    const breathingDelay = index * 400;
    breathingScale.value = withRepeat(
      withSequence(
        withTiming(1.03, { duration: 2000 + breathingDelay, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 2000 + breathingDelay, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
    subtleGlow.value = withRepeat(
      withSequence(
        withTiming(0.4, { duration: 2500 + breathingDelay, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.15, { duration: 2500 + breathingDelay, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, [index]);

  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const iconContainerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: breathingScale.value }],
  }));

  const subtleGlowStyle = useAnimatedStyle(() => ({
    opacity: subtleGlow.value,
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.92, { damping: 15, stiffness: 200 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 200 });
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
      style={[styles.bottomMenuButton, containerStyle]}
    >
      <ThemedText 
        style={[styles.label, { color: "rgba(255, 255, 255, 0.6)" }]}
        numberOfLines={1}
      >
        {label}
      </ThemedText>

      <Animated.View style={[
        styles.iconWrapper,
        createBoxShadow(color, 0, 0, 0.5, 8, 4),
        iconContainerStyle
      ]}>
        <Animated.View style={[styles.subtleGlowRing, { borderColor: color, pointerEvents: "none" }, subtleGlowStyle]} />
        <LinearGradient
          colors={["rgba(0, 0, 0, 0.4)", "rgba(0, 0, 0, 0.6)"]}
          style={styles.iconGradient}
        >
          <Feather name={iconName} size={22} color={color} />
        </LinearGradient>
      </Animated.View>
    </AnimatedPressable>
  );
}

// Category color mapping
const CATEGORY_COLORS: Record<CategoryFilter, { primary: string; secondary: string }> = {
  slots: { primary: "#EC4899", secondary: "#9333EA" },
  fish: { primary: "#00D4FF", secondary: "#0891B2" },
  tables: { primary: "#FFD700", secondary: "#F59E0B" },
  favorites: { primary: "#FF6B9C", secondary: "#EC4899" },
  bonus: { primary: "#10B981", secondary: "#059669" },
};

// Animated category background component
function CategoryBackground({ selectedCategory }: { selectedCategory: CategoryFilter }) {
  const colors = CATEGORY_COLORS[selectedCategory];
  const pulse = useSharedValue(0);
  const orb1Y = useSharedValue(0);
  const orb2Y = useSharedValue(0);
  const colorTransition = useSharedValue(0);

  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 2500, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 2500, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
    orb1Y.value = withRepeat(
      withSequence(
        withTiming(-20, { duration: 3000, easing: Easing.inOut(Easing.ease) }),
        withTiming(20, { duration: 3000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
    orb2Y.value = withRepeat(
      withSequence(
        withTiming(30, { duration: 4000, easing: Easing.inOut(Easing.ease) }),
        withTiming(-30, { duration: 4000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, []);

  useEffect(() => {
    colorTransition.value = withTiming(1, { duration: 400, easing: Easing.out(Easing.ease) });
    const timeout = setTimeout(() => {
      colorTransition.value = 0;
    }, 400);
    return () => clearTimeout(timeout);
  }, [selectedCategory]);

  const pulseStyle = useAnimatedStyle(() => ({
    opacity: interpolate(pulse.value, [0, 1], [0.15, 0.35]),
  }));

  const orb1Style = useAnimatedStyle(() => ({
    transform: [{ translateY: orb1Y.value }],
    opacity: interpolate(pulse.value, [0, 1], [0.2, 0.4]),
  }));

  const orb2Style = useAnimatedStyle(() => ({
    transform: [{ translateY: orb2Y.value }],
    opacity: interpolate(pulse.value, [0, 1], [0.15, 0.3]),
  }));

  return (
    <View style={styles.categoryBackground}>
      <Animated.View style={[styles.categoryGlowOrb, styles.orbTop, orb1Style]}>
        <LinearGradient
          colors={[colors.primary + "40", colors.primary + "10", "transparent"]}
          style={StyleSheet.absoluteFill}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
        />
      </Animated.View>
      <Animated.View style={[styles.categoryGlowOrb, styles.orbBottom, orb2Style]}>
        <LinearGradient
          colors={["transparent", colors.secondary + "15", colors.secondary + "30"]}
          style={StyleSheet.absoluteFill}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
        />
      </Animated.View>
      <Animated.View style={[styles.categoryPulse, pulseStyle]}>
        <LinearGradient
          colors={[colors.primary + "20", "transparent", colors.secondary + "15"]}
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
      </Animated.View>
    </View>
  );
}

export function Sidebar({ selectedCategory, onCategoryChange }: SidebarProps) {
  const insets = useSafeAreaInsets();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const isLandscape = screenWidth > screenHeight;
  const sidebarWidth = isLandscape ? SIDEBAR_WIDTH : SIDEBAR_WIDTH_PORTRAIT;
  const scanLineProgress = useSharedValue(0);

  useEffect(() => {
    scanLineProgress.value = withRepeat(
      withTiming(1, { duration: 3000, easing: Easing.linear }),
      -1,
      false
    );
  }, []);

  const scanLineStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: interpolate(scanLineProgress.value, [0, 1], [-50, 600]) }],
    opacity: interpolate(scanLineProgress.value, [0, 0.3, 0.7, 1], [0, 0.3, 0.3, 0]),
  }));

  const categories: { id: CategoryFilter; iconSource: any; label: string; color: string }[] = [
    { 
      id: "slots", 
      iconSource: slotsIcon, 
      label: "SLOTS", 
      color: "#EC4899"
    },
    { 
      id: "fish", 
      iconSource: fishIcon, 
      label: "FISH", 
      color: "#00D4FF"
    },
    { 
      id: "tables", 
      iconSource: tablesIcon, 
      label: "TABLES", 
      color: "#FFD700"
    },
    { 
      id: "favorites", 
      iconSource: favesIcon, 
      label: "FAVES", 
      color: "#FF6B9C"
    },
  ];

  const handleCategoryPress = (cat: typeof categories[0]) => {
    onCategoryChange(cat.id);
  };

  return (
    <View style={[styles.container, { paddingLeft: insets.left, width: sidebarWidth }]}>
      <BlurView intensity={80} tint="dark" style={styles.blurContainer}>
        <LinearGradient
          colors={["rgba(10, 5, 25, 0.97)", "rgba(20, 8, 40, 0.95)", "rgba(10, 5, 25, 0.97)"]}
          style={[styles.gradientOverlay, { pointerEvents: "none" }]}
        />

        {/* Animated category-reactive background */}
        <CategoryBackground selectedCategory={selectedCategory} />

        {/* Sparkle stars effect */}
        <SparkleStarsBackground />

        {/* Scan line effect */}
        <Animated.View style={[styles.scanLine, scanLineStyle, { pointerEvents: "none" }]}>
          <LinearGradient
            colors={["transparent", "rgba(139, 92, 246, 0.3)", "transparent"]}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>

        {/* Animated border flow */}
        <AnimatedBorderFlow />

        <View style={[
          styles.content, 
          { 
            paddingTop: insets.top + 16, 
            paddingBottom: insets.bottom + 16 
          }
        ]}>
          <View style={[styles.topDecor, { pointerEvents: "none" }]}>
            <LinearGradient
              colors={["rgba(212, 175, 55, 0.4)", "transparent"]}
              style={styles.topDecorGradient}
            />
          </View>

          <View style={[
            styles.categoriesSection,
            !isLandscape && styles.categoriesSectionPortrait
          ]}>
            {categories.map((cat, index) => (
              <React.Fragment key={cat.id}>
                <CategoryButton
                  iconSource={cat.iconSource}
                  label={cat.label}
                  isSelected={selectedCategory === cat.id}
                  accentColor={cat.color}
                  onPress={() => handleCategoryPress(cat)}
                  index={index}
                />
                {index < categories.length - 1 && <PremiumDivider />}
              </React.Fragment>
            ))}
          </View>
        </View>
      </BlurView>

      <View style={[styles.rightBorderContainer, { pointerEvents: "none" }]}>
        <LinearGradient
          colors={["transparent", "rgba(212, 175, 55, 0.6)", "#8B5CF6", "rgba(212, 175, 55, 0.6)", "transparent"]}
          style={styles.rightBorder}
        />
        <View style={styles.rightBorderGlow} />
      </View>

      <View style={[styles.cornerAccentBottom, { pointerEvents: "none" }]}>
        <LinearGradient
          colors={["transparent", "rgba(139, 92, 246, 0.4)"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: SIDEBAR_WIDTH,
    zIndex: 100,
    ...createBoxShadow("#8B5CF6", 4, 0, 0.3, 16, 12),
  },
  blurContainer: {
    flex: 1,
    overflow: "hidden",
    borderRightWidth: 1,
    borderRightColor: "rgba(139, 92, 246, 0.25)",
  },
  gradientOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  ambientGlow: {
    ...StyleSheet.absoluteFillObject,
  },
  categoryBackground: {
    ...StyleSheet.absoluteFillObject,
    pointerEvents: "none",
  },
  categoryGlowOrb: {
    position: "absolute",
    left: -20,
    right: -20,
    height: 150,
    borderRadius: 75,
  },
  orbTop: {
    top: "10%",
  },
  orbBottom: {
    bottom: "15%",
  },
  categoryPulse: {
    ...StyleSheet.absoluteFillObject,
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 8,
  },
  categoriesSection: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
    width: "100%",
  },
  categoriesSectionPortrait: {
    justifyContent: "center",
    gap: 8,
  },
  bottomMenuSection: {
    width: "100%",
    alignItems: "center",
    paddingTop: 4,
  },
  bottomMenuRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
    paddingTop: 4,
  },
  bottomMenuButton: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 4,
    paddingHorizontal: 2,
    flex: 1,
  },
  topDecor: {
    position: "absolute",
    top: 0,
    left: 10,
    right: 10,
    height: 2,
  },
  topDecorGradient: {
    flex: 1,
    borderRadius: 1,
  },
  dividerContainer: {
    width: "70%",
    height: 1,
    marginVertical: 2,
    position: "relative",
  },
  divider: {
    flex: 1,
  },
  dividerShimmer: {
    ...StyleSheet.absoluteFillObject,
  },
  rightBorderContainer: {
    position: "absolute",
    right: 0,
    top: "8%",
    bottom: "8%",
    width: 3,
  },
  rightBorder: {
    flex: 1,
    borderRadius: 1.5,
  },
  rightBorderGlow: {
    position: "absolute",
    right: -2,
    top: "20%",
    bottom: "20%",
    width: 6,
    backgroundColor: "rgba(139, 92, 246, 0.3)",
    borderRadius: 3,
  },
  cornerAccentTop: {
    position: "absolute",
    top: 0,
    right: 0,
    width: 30,
    height: 30,
  },
  cornerAccentBottom: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 30,
    height: 30,
  },
  categoryButton: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 6,
    paddingHorizontal: 4,
    borderRadius: BorderRadius.md,
    position: "relative",
  },
  categoryButtonContent: {
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
  },
  buttonGlow: {
    position: "absolute",
    top: 2,
    left: 6,
    right: 6,
    bottom: 2,
    borderRadius: BorderRadius.md,
  },
  buttonBackground: {
    position: "absolute",
    top: 2,
    left: 6,
    right: 6,
    bottom: 2,
    borderRadius: BorderRadius.md,
    overflow: "hidden",
  },
  buttonGradient: {
    flex: 1,
    borderRadius: BorderRadius.md,
  },
  buttonBorderInner: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  borderGlowOverlay: {
    position: "absolute",
    top: 2,
    left: 6,
    right: 6,
    bottom: 2,
    borderRadius: BorderRadius.md,
    overflow: "hidden",
  },
  iconWrapper: {
    width: 48,
    height: 48,
    backgroundColor: "transparent",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  iconGradient: {
    flex: 1,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
  },
  iconImage: {
    width: 44,
    height: 44,
  },
  iconInnerGlow: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 10,
  },
  subtleGlowRing: {
    position: "absolute",
    top: -2,
    left: -2,
    right: -2,
    bottom: -2,
    borderRadius: 12,
    borderWidth: 0,
  },
  label: {
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.5,
    textAlign: "center",
  },
  activeIndicatorContainer: {
    position: "absolute",
    left: 0,
    top: "25%",
    bottom: "25%",
    width: 4,
  },
  activeIndicator: {
    flex: 1,
    width: 3,
    borderTopRightRadius: 3,
    borderBottomRightRadius: 3,
  },
  activeIndicatorGlow: {
    position: "absolute",
    left: 0,
    top: "20%",
    bottom: "20%",
    width: 8,
    borderRadius: 4,
    opacity: 0.6,
  },
  portraitLogoContainer: {
    width: "100%",
    alignItems: "center",
    paddingVertical: 8,
    marginBottom: 4,
  },
  portraitLogo: {
    width: 60,
    height: 20,
  },
  holographicShimmer: {
    position: "absolute",
    top: 0,
    left: -50,
    right: -50,
    bottom: 0,
    width: 200,
  },
  particlesContainer: {
    position: "absolute",
    top: 10,
    left: 10,
    right: 10,
    bottom: 10,
  },
  scanLine: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 50,
    top: 0,
  },
  borderFlow: {
    position: "absolute",
    right: -1,
    top: -100,
    width: 3,
    height: 100,
  },
});