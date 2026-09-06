import React, { useEffect, useState, useCallback, useRef, useMemo } from "react";
import {
  View,
  StyleSheet,
  Modal,
  Pressable,
  Platform,
  useWindowDimensions,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { Image } from "expo-image";
import Svg, { G, Path, Text as SvgText } from "react-native-svg";

const wheelFrameImage = require("@/assets/images/hourly-wheel-frame.png");
const wheelFrameImagePortrait = require("@/assets/images/hourly-wheel-frame-portrait.png");
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
  runOnJS,
  cancelAnimation,
  useAnimatedReaction,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ThemedText } from "@/components/ThemedText";
import { useSpinWheel } from "@/contexts/SpinWheelContext";
import { useNotifications } from "@/contexts/NotificationsContext";
import { usePushNotifications } from "@/contexts/PushNotificationsContext";
import { useAuth } from "@/contexts/AuthContext";
import { NeonColors, Spacing, BorderRadius, WheelTierColors } from "@/constants/theme";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const SEGMENT_COLORS_POOL = [
  "#E63946", "#2A9D8F", "#F4A261", "#9B5DE5",
  "#00BBF9", "#F15BB5", "#FEE440", "#00F5D4",
  "#FF6B6B", "#4ECDC4", "#FFD93D", "#A855F7",
  "#10B981", "#3B82F6", "#F97316", "#EC4899",
];

interface WheelPrize {
  label: string;
  amount: number;
  color: string;
}

interface ConfettiPieceProps {
  delay: number;
  startX: number;
  color: string;
  screenHeight: number;
}

function ConfettiPiece({ delay, startX, color, screenHeight }: ConfettiPieceProps) {
  const translateY = useSharedValue(-20);
  const translateX = useSharedValue(startX);
  const rotation = useSharedValue(0);
  const opacity = useSharedValue(1);
  const scale = useSharedValue(1);

  useEffect(() => {
    const randomX = (Math.random() - 0.5) * 200;
    const duration = 2000 + Math.random() * 1000;

    translateY.value = withDelay(
      delay,
      withTiming(screenHeight * 0.6, {
        duration,
        easing: Easing.out(Easing.quad),
      })
    );
    translateX.value = withDelay(
      delay,
      withTiming(startX + randomX, {
        duration,
        easing: Easing.out(Easing.quad),
      })
    );
    rotation.value = withDelay(
      delay,
      withTiming(360 * (2 + Math.random() * 3), {
        duration,
        easing: Easing.linear,
      })
    );
    opacity.value = withDelay(
      delay + duration * 0.6,
      withTiming(0, { duration: duration * 0.4 })
    );
    scale.value = withDelay(
      delay,
      withSequence(
        withTiming(1.5, { duration: 200 }),
        withTiming(1, { duration: 300 })
      )
    );
  }, [screenHeight]);

  const style = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { rotate: `${rotation.value}deg` },
      { scale: scale.value },
    ],
    opacity: opacity.value,
  }));

  const size = 8 + Math.random() * 8;
  const isCircle = Math.random() > 0.5;

  return (
    <Animated.View
      style={[
        styles.confettiPiece,
        {
          width: size,
          height: isCircle ? size : size * 2,
          borderRadius: isCircle ? size / 2 : 2,
          backgroundColor: color,
        },
        style,
      ]}
    />
  );
}

interface StarburstProps {
  delay: number;
  angle: number;
  color: string;
  centerX: number;
  centerY: number;
}

function StarburstRay({ delay, angle, color, centerX, centerY }: StarburstProps) {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.3);

  useEffect(() => {
    const radians = (angle * Math.PI) / 180;
    const distance = 150 + Math.random() * 100;
    const targetX = Math.cos(radians) * distance;
    const targetY = Math.sin(radians) * distance;

    opacity.value = withDelay(delay, withSequence(
      withTiming(1, { duration: 100 }),
      withTiming(1, { duration: 300 }),
      withTiming(0, { duration: 400 })
    ));
    
    scale.value = withDelay(delay, withSequence(
      withSpring(1.2, { damping: 8, stiffness: 200 }),
      withTiming(0.5, { duration: 500 })
    ));
    
    translateX.value = withDelay(delay, withTiming(targetX, { duration: 800, easing: Easing.out(Easing.quad) }));
    translateY.value = withDelay(delay, withTiming(targetY, { duration: 800, easing: Easing.out(Easing.quad) }));
  }, [angle, delay]);

  const style = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        styles.starburstRay,
        { left: centerX, top: centerY, backgroundColor: color },
        style,
      ]}
    />
  );
}

interface CelebrationSparkleProps {
  delay: number;
  x: number;
  y: number;
  color: string;
}

function CelebrationSparkle({ delay, x, y, color }: CelebrationSparkleProps) {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);
  const rotation = useSharedValue(0);

  useEffect(() => {
    opacity.value = withDelay(delay, withSequence(
      withTiming(1, { duration: 150 }),
      withTiming(1, { duration: 200 }),
      withTiming(0, { duration: 300 })
    ));
    
    scale.value = withDelay(delay, withSequence(
      withSpring(1.5, { damping: 6, stiffness: 300 }),
      withTiming(0, { duration: 400 })
    ));
    
    rotation.value = withDelay(delay, withTiming(180, { duration: 600 }));
  }, [delay]);

  const style = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { rotate: `${rotation.value}deg` },
    ],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[styles.sparkle, { left: x, top: y }, style]}>
      <View style={[styles.sparkleVertical, { backgroundColor: color }]} />
      <View style={[styles.sparkleHorizontal, { backgroundColor: color }]} />
      <View style={[styles.sparkleDiag1, { backgroundColor: color }]} />
      <View style={[styles.sparkleDiag2, { backgroundColor: color }]} />
    </Animated.View>
  );
}

interface WheelSegmentsProps {
  wheelSize: number;
  prizes: WheelPrize[];
}

function WheelSegments({ wheelSize, prizes }: WheelSegmentsProps) {
  const radius = wheelSize / 2;
  
  if (prizes.length === 0) {
    return (
      <View style={[styles.wheelSegmentsContainer, { width: wheelSize, height: wheelSize }]}>
        <View
          style={[
            styles.conicGradientWheel,
            {
              width: wheelSize,
              height: wheelSize,
              borderRadius: radius,
              backgroundColor: "#3a3a4a",
            },
          ]}
        />
        <View style={styles.loadingWheelContent}>
          <ThemedText style={styles.loadingWheelText}>Loading...</ThemedText>
        </View>
      </View>
    );
  }
  
  const numSegments = prizes.length;
  const segmentAngle = 360 / numSegments;
  
  const segmentColors = useMemo(() => {
    return prizes.map((prize, i) => 
      prize.color || SEGMENT_COLORS_POOL[i % SEGMENT_COLORS_POOL.length]
    );
  }, [prizes]);
  
  const labelFontSize = numSegments > 10 ? 10 : numSegments > 8 ? 12 : 14;
  const labelWidth = numSegments > 10 ? 40 : 50;

  if (Platform.OS === "web") {
    const conicGradient = segmentColors.map((color, i) => {
      const start = (i * segmentAngle);
      const end = ((i + 1) * segmentAngle);
      return `${color} ${start}deg ${end}deg`;
    }).join(', ');
    
    return (
      <View style={[styles.wheelSegmentsContainer, { width: wheelSize, height: wheelSize }]}>
        <View
          style={[
            styles.conicGradientWheel,
            {
              width: wheelSize,
              height: wheelSize,
              borderRadius: radius,
              // @ts-ignore - web-only property
              background: `conic-gradient(from -90deg, ${conicGradient})`,
            },
          ]}
        />
        {prizes.map((prize, index) => {
          const labelAngle = index * segmentAngle + segmentAngle / 2 - 90;
          const labelAngleRad = (labelAngle * Math.PI) / 180;
          const labelDistance = radius * (numSegments > 10 ? 0.7 : 0.65);
          const labelX = Math.cos(labelAngleRad) * labelDistance;
          const labelY = Math.sin(labelAngleRad) * labelDistance;

          return (
            <View
              key={index}
              style={[
                styles.segmentLabel,
                {
                  left: radius + labelX - labelWidth / 2,
                  top: radius + labelY - 12,
                  width: labelWidth,
                },
              ]}
            >
              <ThemedText style={[styles.prizeText, { fontSize: labelFontSize }]}>{prize.label}</ThemedText>
            </View>
          );
        })}
      </View>
    );
  }

  const createSegmentPath = (index: number) => {
    const startAngle = (index * segmentAngle - 90) * (Math.PI / 180);
    const endAngle = ((index + 1) * segmentAngle - 90) * (Math.PI / 180);
    const x1 = radius + radius * Math.cos(startAngle);
    const y1 = radius + radius * Math.sin(startAngle);
    const x2 = radius + radius * Math.cos(endAngle);
    const y2 = radius + radius * Math.sin(endAngle);
    const largeArcFlag = segmentAngle > 180 ? 1 : 0;
    return `M ${radius} ${radius} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;
  };

  return (
    <View style={[styles.wheelSegmentsContainer, { width: wheelSize, height: wheelSize }]}>
      <Svg width={wheelSize} height={wheelSize}>
        <G>
          {prizes.map((prize, index) => (
            <Path
              key={index}
              d={createSegmentPath(index)}
              fill={segmentColors[index]}
            />
          ))}
          {prizes.map((prize, index) => {
            const labelAngle = index * segmentAngle + segmentAngle / 2 - 90;
            const labelAngleRad = (labelAngle * Math.PI) / 180;
            const labelDistance = radius * (numSegments > 10 ? 0.7 : 0.65);
            const labelX = radius + Math.cos(labelAngleRad) * labelDistance;
            const labelY = radius + Math.sin(labelAngleRad) * labelDistance;
            return (
              <SvgText
                key={`label-${index}`}
                x={labelX}
                y={labelY}
                fill="#FFFFFF"
                fontSize={labelFontSize}
                fontWeight="bold"
                textAnchor="middle"
                alignmentBaseline="middle"
              >
                {prize.label}
              </SvgText>
            );
          })}
        </G>
      </Svg>
    </View>
  );
}

const TIER_COLORS = WheelTierColors;

function getWheelColors(wheelNumber: number) {
  return wheelNumber === 1 
    ? TIER_COLORS.bronze 
    : wheelNumber === 2 
      ? TIER_COLORS.silver 
      : TIER_COLORS.gold;
}

const TIER_NAMES = ["BRONZE", "SILVER", "GOLD"];
const TIER_ICONS: ("star" | "award" | "zap")[] = ["star", "award", "zap"];

interface SparkleProps {
  delay: number;
  size: number;
  color: string;
  x: number;
  y: number;
}

function Sparkle({ delay, size, color, x, y }: SparkleProps) {
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0);

  useEffect(() => {
    const animate = () => {
      opacity.value = withDelay(
        delay,
        withRepeat(
          withSequence(
            withTiming(1, { duration: 400, easing: Easing.out(Easing.ease) }),
            withTiming(0, { duration: 600, easing: Easing.in(Easing.ease) }),
            withDelay(Math.random() * 2000, withTiming(0, { duration: 0 }))
          ),
          -1,
          false
        )
      );
      scale.value = withDelay(
        delay,
        withRepeat(
          withSequence(
            withTiming(1, { duration: 400, easing: Easing.out(Easing.back(2)) }),
            withTiming(0.5, { duration: 600, easing: Easing.in(Easing.ease) }),
            withDelay(Math.random() * 2000, withTiming(0, { duration: 0 }))
          ),
          -1,
          false
        )
      );
    };
    animate();
  }, [delay]);

  const sparkleStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View
      style={[
        {
          position: "absolute",
          left: x,
          top: y,
          width: size,
          height: size,
        },
        sparkleStyle,
      ]}
    >
      <Feather name="star" size={size} color={color} />
    </Animated.View>
  );
}

interface WheelSelectorProps {
  wheels: { wheelNumber: number; name: string; isUnlocked: boolean }[];
  selectedWheel: number;
  unlockedWheels: number[];
  onSelect: (wheelNumber: number) => void;
}

function MiniWheel({ 
  wheelNumber, 
  size, 
  isLocked, 
  isSelected,
  onPress 
}: { 
  wheelNumber: number; 
  size: number; 
  isLocked: boolean; 
  isSelected: boolean;
  onPress: () => void;
}) {
  const colors = getWheelColors(wheelNumber);
  const rotation = useSharedValue(0);
  const scale = useSharedValue(1);
  const glowOpacity = useSharedValue(0.2);
  const shimmerPosition = useSharedValue(-1);
  const ringPulse = useSharedValue(1);
  
  useEffect(() => {
    if (!isLocked) {
      rotation.value = withRepeat(
        withTiming(360, { duration: 6000 + wheelNumber * 1500, easing: Easing.linear }),
        -1,
        false
      );
      
      shimmerPosition.value = withRepeat(
        withSequence(
          withTiming(1.5, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
          withDelay(1000, withTiming(-1, { duration: 0 }))
        ),
        -1,
        false
      );
      
      if (isSelected) {
        scale.value = withRepeat(
          withSequence(
            withTiming(1.08, { duration: 800, easing: Easing.inOut(Easing.ease) }),
            withTiming(1, { duration: 800, easing: Easing.inOut(Easing.ease) })
          ),
          -1,
          true
        );
        glowOpacity.value = withRepeat(
          withSequence(
            withTiming(0.9, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
            withTiming(0.4, { duration: 1000, easing: Easing.inOut(Easing.ease) })
          ),
          -1,
          true
        );
        ringPulse.value = withRepeat(
          withSequence(
            withTiming(1.15, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
            withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.ease) })
          ),
          -1,
          true
        );
      } else {
        scale.value = withTiming(1, { duration: 300 });
        glowOpacity.value = withTiming(0.2, { duration: 300 });
        ringPulse.value = withTiming(1, { duration: 300 });
      }
    }
  }, [isLocked, isSelected, wheelNumber]);
  
  const wheelStyle = useAnimatedStyle(() => ({
    transform: [
      { rotate: `${rotation.value}deg` },
      { scale: scale.value },
    ],
  }));
  
  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
    transform: [{ scale: ringPulse.value }],
  }));

  const shimmerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shimmerPosition.value * size }],
  }));
  
  const segmentCount = 8;
  const segments = Array.from({ length: segmentCount }, (_, i) => i);
  
  const sparkles = isSelected && !isLocked ? [
    { x: -8, y: -5, size: 10, delay: 0 },
    { x: size + 4, y: 10, size: 8, delay: 400 },
    { x: size / 2, y: -12, size: 12, delay: 800 },
    { x: -5, y: size - 10, size: 9, delay: 1200 },
  ] : [];

  const tierName = TIER_NAMES[wheelNumber - 1];
  const tierIcon = TIER_ICONS[wheelNumber - 1];
  
  return (
    <Pressable 
      onPress={onPress} 
      disabled={isLocked}
      style={[tierStyles.wheelContainer, { width: size + 32, height: size + 60 }]}
    >
      {isSelected && !isLocked && (
        <>
          <Animated.View 
            style={[
              tierStyles.glowEffect, 
              { 
                width: size + 40, 
                height: size + 40, 
                borderRadius: (size + 40) / 2,
                backgroundColor: colors.primary,
                shadowColor: colors.primary,
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 1,
                shadowRadius: 20,
              },
              glowStyle
            ]} 
          />
          <Animated.View 
            style={[
              tierStyles.outerGlow, 
              { 
                width: size + 28, 
                height: size + 28, 
                borderRadius: (size + 28) / 2,
                borderColor: colors.primary,
              },
              glowStyle
            ]} 
          />
        </>
      )}
      
      {sparkles.map((sparkle, i) => (
        <Sparkle
          key={i}
          x={sparkle.x + 8}
          y={sparkle.y + 8}
          size={sparkle.size}
          color={colors.primary}
          delay={sparkle.delay}
        />
      ))}
      
      <View style={[tierStyles.outerRing, { 
        width: size + 12, 
        height: size + 12, 
        borderRadius: (size + 12) / 2,
        borderColor: isLocked ? "rgba(255,255,255,0.1)" : colors.primary,
        borderWidth: isSelected ? 3 : 2,
        backgroundColor: isLocked ? "rgba(20,20,35,0.8)" : "rgba(0,0,0,0.3)",
      }]}>
        <LinearGradient
          colors={isLocked ? ["#1a1a2e", "#0d0d1a"] : [colors.primary + "40", colors.secondary + "40"]}
          style={[tierStyles.ringGradient, { 
            width: size + 8, 
            height: size + 8, 
            borderRadius: (size + 8) / 2 
          }]}
        >
          <Animated.View 
            style={[
              tierStyles.miniWheel, 
              { 
                width: size, 
                height: size, 
                borderRadius: size / 2,
              },
              !isLocked && wheelStyle
            ]}
          >
            {segments.map((i) => {
              const angle = (i * 360) / segmentCount;
              const segmentColor = isLocked 
                ? (i % 2 === 0 ? "#2a2a3e" : "#1f1f2e")
                : (i % 2 === 0 ? colors.primary : colors.secondary);
              
              return (
                <View
                  key={i}
                  style={[
                    tierStyles.segment,
                    {
                      backgroundColor: segmentColor,
                      transform: [{ rotate: `${angle}deg` }],
                    },
                  ]}
                />
              );
            })}
            
            {!isLocked && (
              <Animated.View 
                style={[
                  tierStyles.shimmer,
                  { width: size * 0.3, height: size * 1.5 },
                  shimmerStyle
                ]} 
              />
            )}
            
            <LinearGradient
              colors={isLocked ? ["#1a1a2e", "#0d0d1a"] : [colors.primary, colors.secondary]}
              style={[tierStyles.centerDot, { 
                borderColor: isLocked ? "rgba(255,255,255,0.2)" : "#FFFFFF",
                width: size * 0.45,
                height: size * 0.45,
              }]}
            >
              {isLocked ? (
                <Feather name="lock" size={size * 0.18} color="rgba(255,255,255,0.5)" />
              ) : (
                <Feather name={tierIcon} size={size * 0.2} color="#FFFFFF" />
              )}
            </LinearGradient>
          </Animated.View>
        </LinearGradient>
      </View>
      
      {isLocked && (
        <View style={[tierStyles.lockedOverlay, { top: 6 }]}>
          <LinearGradient
            colors={["rgba(0,0,0,0.7)", "rgba(0,0,0,0.5)"]}
            style={[tierStyles.lockOverlayGradient, { width: size, height: size, borderRadius: size / 2 }]}
          >
            <Feather name="lock" size={size * 0.35} color="rgba(255,255,255,0.6)" />
          </LinearGradient>
        </View>
      )}
      
      <View style={tierStyles.labelContainer}>
        <LinearGradient
          colors={isLocked ? ["#2a2a3e", "#1a1a2e"] : [...colors.gradient]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            tierStyles.label,
            { minWidth: size + 10 },
            isSelected && !isLocked && { 
              borderColor: colors.primary, 
              borderWidth: 2,
              shadowColor: colors.primary,
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.5,
              shadowRadius: 4,
            },
          ]}
        >
          <ThemedText style={[
            tierStyles.tierName, 
            { 
              color: isLocked ? "rgba(255,255,255,0.5)" : "#FFFFFF",
              fontSize: wheelNumber === 3 ? 11 : 10,
            }
          ]}>
            {tierName}
          </ThemedText>
        </LinearGradient>
      </View>
    </Pressable>
  );
}

function WheelSelector({ wheels, selectedWheel, unlockedWheels, onSelect }: WheelSelectorProps) {
  const WHEEL_SIZES = { 1: 55, 2: 70, 3: 88 };
  const headerGlow = useSharedValue(0.5);
  
  useEffect(() => {
    headerGlow.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.5, { duration: 2000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, []);
  
  const headerGlowStyle = useAnimatedStyle(() => ({
    opacity: headerGlow.value,
  }));
  
  return (
    <View style={tierStyles.selectorWrapper}>
      <View style={tierStyles.headerContainer}>
        <Animated.View style={[tierStyles.headerGlow, headerGlowStyle]} />
        <LinearGradient
          colors={["rgba(255,215,0,0.15)", "rgba(255,215,0,0.05)", "transparent"]}
          style={tierStyles.headerGradient}
        >
          <View style={tierStyles.headerContent}>
            <View style={tierStyles.headerLine} />
            <View style={tierStyles.headerTextContainer}>
              <Feather name="zap" size={14} color="#FFD700" style={{ marginRight: 6 }} />
              <ThemedText style={tierStyles.headerText}>SELECT YOUR WHEEL</ThemedText>
              <Feather name="zap" size={14} color="#FFD700" style={{ marginLeft: 6 }} />
            </View>
            <View style={tierStyles.headerLine} />
          </View>
        </LinearGradient>
      </View>
      
      <View style={tierStyles.container}>
        {wheels.map((wheel) => {
          const isLocked = !wheel.isUnlocked;
          const size = WHEEL_SIZES[wheel.wheelNumber as keyof typeof WHEEL_SIZES] || 55;
          
          return (
            <MiniWheel
              key={wheel.wheelNumber}
              wheelNumber={wheel.wheelNumber}
              size={size}
              isLocked={isLocked}
              isSelected={selectedWheel === wheel.wheelNumber}
              onPress={() => onSelect(wheel.wheelNumber)}
            />
          );
        })}
      </View>
      
      <View style={tierStyles.progressContainer}>
        {[1, 2, 3].map((tier, index) => {
          const isUnlocked = unlockedWheels.includes(tier);
          const colors = getWheelColors(tier);
          return (
            <React.Fragment key={tier}>
              <View style={[
                tierStyles.progressDot,
                { backgroundColor: isUnlocked ? colors.primary : "rgba(255,255,255,0.2)" }
              ]} />
              {index < 2 && (
                <View style={[
                  tierStyles.progressLine,
                  { backgroundColor: unlockedWheels.includes(tier + 1) ? getWheelColors(tier + 1).primary : "rgba(255,255,255,0.1)" }
                ]} />
              )}
            </React.Fragment>
          );
        })}
      </View>
    </View>
  );
}

const tierStyles = StyleSheet.create({
  selectorWrapper: {
    marginBottom: Spacing.md,
  },
  headerContainer: {
    marginBottom: Spacing.sm,
    position: "relative",
  },
  headerGlow: {
    position: "absolute",
    top: 0,
    left: "20%",
    right: "20%",
    height: 30,
    backgroundColor: "#FFD700",
    borderRadius: 15,
  },
  headerGradient: {
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTextContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.sm,
  },
  headerText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#FFD700",
    letterSpacing: 1.5,
  },
  headerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "rgba(255,215,0,0.3)",
  },
  container: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "flex-end",
    gap: 8,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xs,
  },
  wheelContainer: {
    alignItems: "center",
    justifyContent: "flex-end",
  },
  glowEffect: {
    position: "absolute",
    top: 8,
  },
  outerGlow: {
    position: "absolute",
    top: 14,
    borderWidth: 2,
  },
  outerRing: {
    alignItems: "center",
    justifyContent: "center",
  },
  ringGradient: {
    alignItems: "center",
    justifyContent: "center",
  },
  miniWheel: {
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  segment: {
    position: "absolute",
    width: "50%",
    height: "50%",
    top: 0,
    left: "25%",
    transformOrigin: "bottom center",
  },
  shimmer: {
    position: "absolute",
    backgroundColor: "rgba(255,255,255,0.2)",
    transform: [{ rotate: "25deg" }],
  },
  centerDot: {
    position: "absolute",
    borderRadius: 100,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
  lockedOverlay: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
  },
  lockOverlayGradient: {
    alignItems: "center",
    justifyContent: "center",
  },
  labelContainer: {
    marginTop: 8,
  },
  label: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
  },
  tierName: {
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  progressContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: Spacing.sm,
    paddingHorizontal: Spacing.xl,
  },
  progressDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  progressLine: {
    width: 40,
    height: 2,
    marginHorizontal: 4,
  },
});

export function SpinWheelModal() {
  const { 
    canSpin, 
    isLoading, 
    isModalVisible, 
    hideModal, 
    spinWheel, 
    checkSpinEligibility, 
    timeUntilNextSpin, 
    wheelPrizes,
  } = useSpinWheel();
  const { notifySpinResult } = useNotifications();
  const { scheduleSpinWheelReminder, isEnabled: pushEnabled } = usePushNotifications();
  const { refreshBalance } = useAuth();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [showInfo, setShowInfo] = useState(false);

  const isLandscape = screenWidth > screenHeight;
  
  const { modalWidth, modalHeight, wheelSize } = useMemo(() => {
    if (isLandscape) {
      const availableHeight = screenHeight - insets.top - insets.bottom - 40;
      const availableWidth = screenWidth * 0.5;
      const maxWheelSize = Math.min(availableHeight * 0.7, availableWidth * 0.6, 280);
      const calculatedModalWidth = Math.min(screenWidth * 0.92, 800);
      const calculatedModalHeight = Math.min(availableHeight, 400);
      return {
        modalWidth: calculatedModalWidth,
        modalHeight: calculatedModalHeight,
        wheelSize: maxWheelSize,
      };
    } else {
      const calculatedModalWidth = Math.min(screenWidth * 0.92, 400);
      const calculatedWheelSize = Math.min(calculatedModalWidth - 60, 300);
      return {
        modalWidth: calculatedModalWidth,
        modalHeight: undefined,
        wheelSize: calculatedWheelSize,
      };
    }
  }, [screenWidth, screenHeight, insets, isLandscape]);

  const currentTierColors = useMemo(() => {
    return { primary: "#10B981", secondary: "#059669", gradient: ["#10B981", "#059669"] as const };
  }, []);

  const [isSpinning, setIsSpinning] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [wonPrize, setWonPrize] = useState<string | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const lastTickRef = useRef(0);

  const modalScale = useSharedValue(0.8);
  const modalOpacity = useSharedValue(0);
  const wheelRotation = useSharedValue(0);
  const buttonScale = useSharedValue(1);
  const buttonGlow = useSharedValue(0.5);
  const resultScale = useSharedValue(0.5);
  const resultOpacity = useSharedValue(0);
  const pointerBounce = useSharedValue(0);
  const centerPulse = useSharedValue(1);
  const celebrationGlow = useSharedValue(0);
  const celebrationBounce = useSharedValue(0);

  const triggerTickHaptic = useCallback(() => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, []);

  const numSegments = wheelPrizes.length || 1;
  const segmentAngle = 360 / numSegments;

  useAnimatedReaction(
    () => wheelRotation.value,
    (currentRotation) => {
      const normalizedRotation = ((currentRotation % 360) + 360) % 360;
      const currentSegment = Math.floor(normalizedRotation / segmentAngle);
      if (currentSegment !== lastTickRef.current && isSpinning) {
        lastTickRef.current = currentSegment;
        runOnJS(triggerTickHaptic)();
      }
    },
    [isSpinning, segmentAngle]
  );

  useEffect(() => {
    if (isModalVisible) {
      checkSpinEligibility();
      modalScale.value = withSpring(1, { damping: 12, stiffness: 120 });
      modalOpacity.value = withTiming(1, { duration: 300 });
      
      buttonGlow.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.4, { duration: 1200, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );

      centerPulse.value = withRepeat(
        withSequence(
          withTiming(1.08, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );
    } else {
      cancelAnimation(buttonGlow);
      cancelAnimation(centerPulse);
      
      modalScale.value = 0.8;
      modalOpacity.value = 0;
      setShowResult(false);
      setShowError(false);
      setErrorMessage("");
      setWonPrize(null);
      setShowConfetti(false);
      wheelRotation.value = 0;
      resultOpacity.value = 0;
      resultScale.value = 0.5;
    }
  }, [isModalVisible]);

  const handleSpinComplete = useCallback((prize: string, prizeAmount?: number, wheelUnlocked?: number | null, serverMessage?: string) => {
    const isWin = (prizeAmount !== undefined && prizeAmount > 0) || wheelUnlocked;
    
    if (wheelUnlocked) {
      setWonPrize(`Wheel ${wheelUnlocked} Unlocked!`);
    } else if (prizeAmount !== undefined && prizeAmount > 0) {
      setWonPrize(`$${prizeAmount}`);
    } else {
      setWonPrize("Try again in 60 minutes");
    }
    setShowResult(true);
    setIsSpinning(false);
    
    if (isWin) {
      setShowConfetti(true);
      notifySpinResult(prize, prizeAmount || 0);
    }

    resultScale.value = withSequence(
      withSpring(1.3, { damping: 6, stiffness: 150 }),
      withSpring(1, { damping: 10, stiffness: 100 })
    );
    resultOpacity.value = withTiming(1, { duration: 300 });
    
    if (isWin) {
      celebrationGlow.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 400, easing: Easing.out(Easing.ease) }),
          withTiming(0.3, { duration: 400, easing: Easing.in(Easing.ease) })
        ),
        6,
        true
      );
      
      celebrationBounce.value = withRepeat(
        withSequence(
          withTiming(-8, { duration: 200, easing: Easing.out(Easing.quad) }),
          withTiming(0, { duration: 200, easing: Easing.in(Easing.quad) })
        ),
        3,
        true
      );

      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      setTimeout(() => {
        setShowConfetti(false);
        celebrationGlow.value = 0;
      }, 3500);
    }
  }, [notifySpinResult]);

  const handleSpinError = useCallback((message: string) => {
    setErrorMessage(message);
    setShowError(true);
    setIsSpinning(false);

    resultScale.value = withSpring(1, { damping: 10 });
    resultOpacity.value = withTiming(1, { duration: 300 });

    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  }, []);

  const handleSpin = async () => {
    if (isSpinning) return;
    
    if (!canSpin) {
      handleSpinError(`Next spin available in ${timeUntilNextSpin}`);
      return;
    }

    wheelRotation.value = 0;

    setIsSpinning(true);
    setShowResult(false);
    setShowError(false);
    resultOpacity.value = 0;
    resultScale.value = 0.5;

    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }

    buttonScale.value = withSequence(
      withTiming(0.9, { duration: 100 }),
      withSpring(1, { damping: 10 })
    );

    pointerBounce.value = withRepeat(
      withSequence(
        withTiming(-6, { duration: 60 }),
        withSpring(0, { damping: 4, stiffness: 500 })
      ),
      20,
      false
    );

    const result = await spinWheel();

    if (result.success && result.prizeIndex !== undefined) {
      const actualIndex = result.prizeIndex;

      if (pushEnabled) {
        const SPIN_COOLDOWN_MS = 60 * 60 * 1000;
        scheduleSpinWheelReminder(SPIN_COOLDOWN_MS);
      }

      const targetAngle = -(actualIndex * segmentAngle) - segmentAngle / 2;
      const extraSpins = 360 * (5 + Math.floor(Math.random() * 3));
      const totalRotation = extraSpins + targetAngle;

      wheelRotation.value = withTiming(
        totalRotation,
        {
          duration: 4500,
          easing: Easing.bezier(0.12, 0.8, 0.22, 1),
        },
        () => {
          runOnJS(handleSpinComplete)(result.prize || "", result.amount, null, result.message);
        }
      );
    } else {
      wheelRotation.value = withTiming(
        360 * 2,
        {
          duration: 2000,
          easing: Easing.out(Easing.cubic),
        },
        () => {
          runOnJS(handleSpinError)(
            result.message || "Unable to spin. Please try again."
          );
        }
      );
    }
  };

  const handleClose = () => {
    modalScale.value = withTiming(0.8, { duration: 200 });
    modalOpacity.value = withTiming(0, { duration: 200 });
    setTimeout(() => {
      hideModal();
      if (refreshBalance) {
        refreshBalance();
      }
    }, 200);
  };

  const modalStyle = useAnimatedStyle(() => ({
    transform: [{ scale: modalScale.value }],
    opacity: modalOpacity.value,
  }));

  const wheelStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${wheelRotation.value}deg` }],
  }));

  const buttonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  const buttonGlowStyle = useAnimatedStyle(() => ({
    opacity: canSpin ? buttonGlow.value : 0,
  }));

  const resultStyle = useAnimatedStyle(() => ({
    opacity: resultOpacity.value,
    transform: [
      { scale: resultScale.value },
      { translateY: celebrationBounce.value },
    ],
  }));

  const celebrationGlowStyle = useAnimatedStyle(() => ({
    opacity: celebrationGlow.value,
    transform: [{ scale: 1 + celebrationGlow.value * 0.15 }],
  }));

  const pointerStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: pointerBounce.value }],
  }));

  const centerPulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: centerPulse.value }],
  }));

  const confettiColors = [
    "#FFD700",
    "#E63946",
    "#2A9D8F",
    "#9B5DE5",
    "#00BBF9",
    "#F15BB5",
    "#FEE440",
    "#00F5D4",
  ];

  return (
    <Modal
      visible={isModalVisible}
      transparent
      animationType="none"
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <BlurView intensity={60} tint="dark" style={StyleSheet.absoluteFill} />

        {showConfetti && (
          <>
            {Array.from({ length: 60 }).map((_, i) => (
              <ConfettiPiece
                key={`confetti-${i}`}
                delay={i * 30}
                startX={screenWidth * 0.5 + (Math.random() - 0.5) * 200}
                color={confettiColors[i % confettiColors.length]}
                screenHeight={screenHeight}
              />
            ))}
            {Array.from({ length: 16 }).map((_, i) => (
              <StarburstRay
                key={`starburst-${i}`}
                delay={i * 25}
                angle={i * 22.5}
                color={confettiColors[i % confettiColors.length]}
                centerX={screenWidth * 0.5}
                centerY={screenHeight * 0.4}
              />
            ))}
            {Array.from({ length: 12 }).map((_, i) => (
              <CelebrationSparkle
                key={`sparkle-${i}`}
                delay={100 + i * 80}
                x={screenWidth * 0.5 + (Math.random() - 0.5) * 300}
                y={screenHeight * 0.3 + (Math.random() - 0.5) * 200}
                color={confettiColors[i % confettiColors.length]}
              />
            ))}
          </>
        )}

        <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} />

        <Animated.View style={[styles.modalWrapper, modalStyle]}>
          <Pressable onPress={(e) => e.stopPropagation()}>
            <View style={[styles.modalContainer, { width: modalWidth, maxHeight: modalHeight, borderColor: currentTierColors.primary }]}>
              <LinearGradient
                colors={["#1a1a2e", "#16213e", "#0f0f23"]}
                style={[styles.modalGradient, isLandscape && styles.modalGradientLandscape]}
              >
                <View style={styles.headerButtons}>
                  <Pressable style={styles.closeButton} onPress={handleClose}>
                    <View style={styles.closeButtonInner}>
                      <Feather name="x" size={20} color="#FFFFFF" />
                    </View>
                  </Pressable>
                </View>

                <View style={[styles.titleContainer, isLandscape && styles.titleContainerLandscape]}>
                  <Feather name="clock" size={isLandscape ? 18 : 26} color={currentTierColors.primary} />
                  <ThemedText style={[styles.titleText, isLandscape && styles.titleTextLandscape, { color: currentTierColors.primary }]}>
                    Hourly Spin
                  </ThemedText>
                  <Feather name="clock" size={isLandscape ? 18 : 26} color={currentTierColors.primary} />
                </View>

                {isLandscape ? (
                  <View style={styles.landscapeContent}>
                    <View style={styles.landscapeLeft}>
                      <View style={styles.hourlySpinInfo}>
                        <Feather name="clock" size={24} color="#10B981" />
                        <ThemedText style={styles.hourlySpinTitle}>Free Hourly Spin</ThemedText>
                        <ThemedText style={styles.hourlySpinSubtitle}>Win up to $5.00!</ThemedText>
                      </View>
                    </View>
                    <View style={styles.landscapeCenter}>
                      <View style={styles.wheelContainer}>
                        <Animated.View style={[styles.pointer, pointerStyle]}>
                          <View style={[styles.pointerTriangleDown, styles.pointerSmall, { borderTopColor: currentTierColors.primary }]} />
                        </Animated.View>

                        <View style={styles.wheelWrapper}>
                          <Animated.View
                            style={[
                              styles.wheel,
                              { width: wheelSize, height: wheelSize, borderRadius: wheelSize / 2 },
                              wheelStyle,
                            ]}
                          >
                            <View style={[styles.wheelInner, { width: wheelSize, height: wheelSize, borderRadius: wheelSize / 2 }]}>
                              <WheelSegments wheelSize={wheelSize} prizes={wheelPrizes} />
                            </View>
                          </Animated.View>

                          <AnimatedPressable
                            style={[styles.centerCircle, styles.centerCircleLandscape, centerPulseStyle, { borderColor: currentTierColors.primary }]}
                            onPress={handleSpin}
                            disabled={isSpinning || !canSpin}
                          >
                            <LinearGradient
                              colors={canSpin ? currentTierColors.gradient : ["#4a4a5a", "#3a3a4a"]}
                              style={[styles.centerGradient, styles.centerGradientLandscape]}
                            >
                              <ThemedText style={[styles.centerText, styles.centerTextLandscape]}>
                                {isSpinning ? "..." : "SPIN"}
                              </ThemedText>
                            </LinearGradient>
                          </AnimatedPressable>
                        </View>
                      </View>
                    </View>
                    <View style={styles.landscapeRight}>
                      {showResult ? (
                        <Animated.View style={[styles.resultContainerLandscape, resultStyle]}>
                          <Animated.View 
                            style={[
                              styles.celebrationGlow, 
                              celebrationGlowStyle,
                              { backgroundColor: currentTierColors.primary }
                            ]} 
                          />
                          <View style={[styles.resultBoxLandscape, { borderColor: currentTierColors.primary }]}>
                            <View style={styles.starContainer}>
                              <Feather name="star" size={16} color={currentTierColors.primary} style={styles.starLeft} />
                              <Feather name="award" size={28} color={currentTierColors.primary} />
                              <Feather name="star" size={16} color={currentTierColors.primary} style={styles.starRight} />
                            </View>
                            <ThemedText style={[styles.congratsTextLandscape, { color: currentTierColors.primary }]}>
                              You won
                            </ThemedText>
                            <ThemedText style={[styles.prizeAmountLandscape, { color: currentTierColors.primary }]}>
                              {wonPrize}
                            </ThemedText>
                          </View>
                        </Animated.View>
                      ) : showError ? (
                        <Animated.View style={[styles.resultContainerLandscape, resultStyle]}>
                          <View style={styles.errorBoxLandscape}>
                            <Feather name="alert-circle" size={24} color="#EF4444" />
                            <ThemedText style={styles.errorTextLandscape}>
                              {errorMessage}
                            </ThemedText>
                          </View>
                        </Animated.View>
                      ) : (
                        <View style={styles.buttonWrapperLandscape}>
                          <Animated.View
                            style={[styles.buttonGlowEffectLandscape, buttonGlowStyle, { backgroundColor: currentTierColors.primary, shadowColor: currentTierColors.primary }]}
                          />
                          <AnimatedPressable
                            style={[
                              styles.spinButtonLandscape,
                              !canSpin && styles.spinButtonDisabled,
                              buttonStyle,
                            ]}
                            onPress={handleSpin}
                            disabled={isSpinning}
                          >
                            <LinearGradient
                              colors={
                                canSpin
                                  ? currentTierColors.gradient
                                  : ["#4a4a5a", "#3a3a4a"]
                              }
                              start={{ x: 0, y: 0 }}
                              end={{ x: 1, y: 0 }}
                              style={styles.spinButtonGradientLandscape}
                            >
                              {isLoading ? (
                                <ThemedText style={styles.spinButtonTextLandscape}>
                                  Loading...
                                </ThemedText>
                              ) : isSpinning ? (
                                <ThemedText style={styles.spinButtonTextLandscape}>
                                  Spinning...
                                </ThemedText>
                              ) : (
                                <View style={styles.spinButtonContent}>
                                  <ThemedText
                                    style={[
                                      styles.spinButtonTextLandscape,
                                      !canSpin && styles.spinButtonTextDisabled,
                                    ]}
                                  >
                                    {canSpin ? "SPIN FREE" : "Wait"}
                                  </ThemedText>
                                </View>
                              )}
                            </LinearGradient>
                          </AnimatedPressable>
                          {!canSpin && !isLoading && (
                            <ThemedText style={styles.noSpinHintLandscape}>
                              {timeUntilNextSpin}
                            </ThemedText>
                          )}
                        </View>
                      )}
                    </View>
                  </View>
                ) : (
                  <>
                <View style={styles.wheelContainer}>
                  <Animated.View style={[styles.pointer, pointerStyle]}>
                    <View style={[styles.pointerTriangleDown, { borderTopColor: currentTierColors.primary }]} />
                  </Animated.View>

                  <View style={styles.wheelWrapper}>
                    <Animated.View
                      style={[
                        styles.wheel,
                        { width: wheelSize, height: wheelSize, borderRadius: wheelSize / 2 },
                        wheelStyle,
                      ]}
                    >
                      <View style={[styles.wheelInner, { width: wheelSize, height: wheelSize, borderRadius: wheelSize / 2 }]}>
                        <WheelSegments wheelSize={wheelSize} prizes={wheelPrizes} />
                      </View>
                    </Animated.View>

                    <AnimatedPressable
                      style={[styles.centerCircle, centerPulseStyle, { borderColor: currentTierColors.primary }]}
                      onPress={handleSpin}
                      disabled={isSpinning || !canSpin}
                    >
                      <LinearGradient
                        colors={canSpin ? currentTierColors.gradient : ["#4a4a5a", "#3a3a4a"]}
                        style={styles.centerGradient}
                      >
                        <ThemedText style={styles.centerText}>
                          {isSpinning ? "..." : "SPIN"}
                        </ThemedText>
                      </LinearGradient>
                    </AnimatedPressable>
                  </View>
                </View>

                {showResult ? (
                  <Animated.View style={[styles.resultContainer, resultStyle]}>
                    <Animated.View 
                      style={[
                        styles.celebrationGlow, 
                        styles.celebrationGlowPortrait,
                        celebrationGlowStyle,
                        { backgroundColor: currentTierColors.primary }
                      ]} 
                    />
                    <View style={[styles.resultBox, { borderColor: currentTierColors.primary }]}>
                      <View style={styles.starContainer}>
                        <Feather name="star" size={20} color={currentTierColors.primary} style={styles.starLeft} />
                        <Feather name="award" size={40} color={currentTierColors.primary} />
                        <Feather name="star" size={20} color={currentTierColors.primary} style={styles.starRight} />
                      </View>
                      <ThemedText style={[styles.congratsText, { color: currentTierColors.primary }]}>
                        Congratulations!
                      </ThemedText>
                      <ThemedText style={styles.wonText}>You won</ThemedText>
                      <ThemedText style={[styles.prizeAmount, { color: currentTierColors.primary }]}>
                        {wonPrize}
                      </ThemedText>
                    </View>
                  </Animated.View>
                ) : showError ? (
                  <Animated.View style={[styles.resultContainer, resultStyle]}>
                    <View style={styles.errorBox}>
                      <Feather name="alert-circle" size={32} color="#EF4444" />
                      <ThemedText style={styles.errorText}>
                        {errorMessage}
                      </ThemedText>
                    </View>
                  </Animated.View>
                ) : (
                  !canSpin && !isLoading ? (
                    <View style={styles.timeHintContainer}>
                      <ThemedText style={styles.noSpinHint}>
                        Next spin in {timeUntilNextSpin}
                      </ThemedText>
                    </View>
                  ) : null
                )}
                  </>
                )}
              </LinearGradient>
            </View>
          </Pressable>
        </Animated.View>

        {showInfo && (
          <View style={styles.infoOverlay}>
            <Pressable style={StyleSheet.absoluteFill} onPress={() => setShowInfo(false)} />
            <View style={styles.infoModal}>
              <LinearGradient
                colors={["#1a1a2e", "#16213e", "#0f0f23"]}
                style={styles.infoModalGradient}
              >
                <Pressable style={styles.infoCloseButton} onPress={() => setShowInfo(false)}>
                  <View style={styles.closeButtonInner}>
                    <Feather name="x" size={20} color="#FFFFFF" />
                  </View>
                </Pressable>

                <View style={styles.infoHeader}>
                  <Feather name="info" size={28} color="#FFD700" />
                  <ThemedText style={styles.infoTitle}>How It Works</ThemedText>
                </View>

                <View style={styles.infoContent}>
                  <View style={styles.infoItem}>
                    <View style={[styles.infoIcon, { backgroundColor: "#10B981" }]}>
                      <Feather name="clock" size={16} color="#FFFFFF" />
                    </View>
                    <View style={styles.infoTextContainer}>
                      <ThemedText style={styles.infoItemTitle}>Free Hourly Spin</ThemedText>
                      <ThemedText style={styles.infoItemText}>Spin once every hour completely free!</ThemedText>
                    </View>
                  </View>

                  <View style={styles.infoItem}>
                    <View style={[styles.infoIcon, { backgroundColor: "#8B5CF6" }]}>
                      <Feather name="gift" size={16} color="#FFFFFF" />
                    </View>
                    <View style={styles.infoTextContainer}>
                      <ThemedText style={styles.infoItemTitle}>Win Cash Prizes</ThemedText>
                      <ThemedText style={styles.infoItemText}>Win between $0.25 and $5.00 on each spin!</ThemedText>
                    </View>
                  </View>

                  <View style={styles.infoDivider} />

                  <View style={styles.infoItem}>
                    <View style={[styles.infoIcon, { backgroundColor: "#4A5568" }]}>
                      <Feather name="thumbs-up" size={16} color="#FFFFFF" />
                    </View>
                    <View style={styles.infoTextContainer}>
                      <ThemedText style={styles.infoItemTitle}>Good Luck</ThemedText>
                      <ThemedText style={styles.infoItemText}>Land on "Good Luck" and try again next hour!</ThemedText>
                    </View>
                  </View>

                  <View style={styles.infoItem}>
                    <View style={[styles.infoIcon, { backgroundColor: "#3B82F6" }]}>
                      <Feather name="dollar-sign" size={16} color="#FFFFFF" />
                    </View>
                    <View style={styles.infoTextContainer}>
                      <ThemedText style={styles.infoItemTitle}>Instant Credits</ThemedText>
                      <ThemedText style={styles.infoItemText}>Winnings are added to your balance instantly!</ThemedText>
                    </View>
                  </View>
                </View>

                <Pressable style={styles.infoGotItButton} onPress={() => setShowInfo(false)}>
                  <LinearGradient
                    colors={["#FFD700", "#FFA500"]}
                    style={styles.infoGotItGradient}
                  >
                    <ThemedText style={styles.infoGotItText}>Got It!</ThemedText>
                  </LinearGradient>
                </Pressable>
              </LinearGradient>
            </View>
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalWrapper: {
    alignItems: "center",
    justifyContent: "center",
  },
  modalContainer: {
    borderRadius: 24,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "#FFD700",
  },
  modalGradient: {
    borderRadius: 22,
    padding: Spacing.lg,
    paddingTop: Spacing.xl,
    alignItems: "center",
  },
  modalGradientLandscape: {
    padding: Spacing.md,
    paddingTop: Spacing.lg,
  },
  closeButton: {
    position: "absolute",
    top: 12,
    right: 12,
    zIndex: 10,
  },
  closeButtonInner: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.lg,
    gap: Spacing.sm,
  },
  titleContainerLandscape: {
    marginBottom: Spacing.sm,
  },
  titleText: {
    fontSize: 28,
    fontWeight: "800",
    color: "#FFD700",
    letterSpacing: 1,
  },
  titleTextLandscape: {
    fontSize: 22,
  },
  wheelFrameContainer: {
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  wheelFrame: {
    position: "absolute",
    zIndex: 10,
    pointerEvents: "none",
  },
  wheelFramePortrait: {
    borderRadius: 20,
  },
  wheelContainer: {
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  wheelContainerWithFrame: {
    marginTop: 20,
  },
  wheelContainerWithFramePortrait: {
    marginTop: 35,
  },
  timeHintContainer: {
    alignItems: "center",
    marginTop: Spacing.md,
  },
  pointer: {
    position: "absolute",
    top: -8,
    zIndex: 20,
    alignItems: "center",
  },
  pointerTriangleDown: {
    width: 0,
    height: 0,
    borderLeftWidth: 14,
    borderRightWidth: 14,
    borderTopWidth: 24,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderTopColor: "#FFD700",
  },
  wheelWrapper: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 12,
  },
  wheelOuterRing: {
    position: "absolute",
    overflow: "hidden",
    zIndex: 1,
  },
  wheelOuterGradient: {
    flex: 1,
    borderRadius: 999,
  },
  wheel: {
    overflow: "hidden",
    backgroundColor: "#1a1a2e",
    zIndex: 5,
  },
  wheelInner: {
    overflow: "hidden",
    position: "relative",
  },
  wheelSegmentsContainer: {
    position: "relative",
  },
  conicGradientWheel: {
    position: "absolute",
    top: 0,
    left: 0,
  },
  segmentLabel: {
    position: "absolute",
    width: 50,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
  prizeText: {
    fontSize: 14,
    fontWeight: "900",
    color: "#FFFFFF",
    textShadowColor: "rgba(0, 0, 0, 0.8)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  loadingWheelContent: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingWheelText: {
    fontSize: 16,
    fontWeight: "600",
    color: "rgba(255, 255, 255, 0.5)",
  },
  centerCircle: {
    position: "absolute",
    width: 60,
    height: 60,
    borderRadius: 30,
    overflow: "hidden",
    zIndex: 15,
    borderWidth: 3,
    borderColor: "#FFD700",
  },
  centerCircleLandscape: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  centerGradient: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 30,
  },
  centerGradientLandscape: {
    borderRadius: 25,
  },
  centerText: {
    fontSize: 14,
    fontWeight: "900",
    color: "#1a1a2e",
    letterSpacing: 1,
  },
  centerTextLandscape: {
    fontSize: 12,
  },
  resultContainer: {
    width: "100%",
    marginTop: Spacing.lg,
  },
  resultBox: {
    alignItems: "center",
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xl,
    borderRadius: 16,
    backgroundColor: "rgba(255, 215, 0, 0.15)",
    borderWidth: 2,
    borderColor: "rgba(255, 215, 0, 0.3)",
  },
  celebrationGlow: {
    position: "absolute",
    top: "50%",
    left: "50%",
    width: 120,
    height: 120,
    marginLeft: -60,
    marginTop: -60,
    borderRadius: 60,
    opacity: 0,
  },
  celebrationGlowPortrait: {
    width: 150,
    height: 150,
    marginLeft: -75,
    marginTop: -75,
    borderRadius: 75,
  },
  starContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.xs,
  },
  starLeft: {
    marginRight: Spacing.sm,
    opacity: 0.8,
  },
  starRight: {
    marginLeft: Spacing.sm,
    opacity: 0.8,
  },
  congratsText: {
    fontSize: 22,
    fontWeight: "800",
    color: "#FFD700",
    marginTop: Spacing.sm,
  },
  wonText: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.7)",
    marginTop: Spacing.xs,
  },
  prizeAmount: {
    fontSize: 42,
    fontWeight: "900",
    color: "#FFD700",
    marginTop: Spacing.xs,
  },
  errorBox: {
    alignItems: "center",
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xl,
    borderRadius: 16,
    backgroundColor: "rgba(239, 68, 68, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.3)",
  },
  errorText: {
    fontSize: 15,
    color: "#EF4444",
    textAlign: "center",
    marginTop: Spacing.sm,
  },
  buttonWrapper: {
    width: "100%",
    marginTop: Spacing.lg,
    position: "relative",
    alignItems: "center",
  },
  buttonGlowEffect: {
    position: "absolute",
    top: -6,
    left: -6,
    right: -6,
    bottom: -6,
    borderRadius: 18,
    backgroundColor: "#FFD700",
    shadowColor: "#FFD700",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 15,
  },
  spinButton: {
    width: "100%",
    borderRadius: 12,
    overflow: "hidden",
  },
  spinButtonDisabled: {
    opacity: 0.9,
  },
  spinButtonGradient: {
    paddingVertical: Spacing.md,
    borderRadius: 12,
    alignItems: "center",
  },
  spinButtonContent: {
    alignItems: "center",
  },
  spinButtonText: {
    fontSize: 18,
    fontWeight: "800",
    color: "#1a1a2e",
    letterSpacing: 2,
  },
  spinButtonTextDisabled: {
    color: "rgba(255, 255, 255, 0.6)",
  },
  wagerText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#1a1a2e",
    opacity: 0.8,
    marginTop: 2,
  },
  noSpinHint: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.5)",
    marginTop: Spacing.sm,
    textAlign: "center",
  },
  confettiPiece: {
    position: "absolute",
    top: 0,
    zIndex: 100,
  },
  starburstRay: {
    position: "absolute",
    width: 4,
    height: 20,
    borderRadius: 2,
    zIndex: 99,
  },
  sparkle: {
    position: "absolute",
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 100,
  },
  sparkleVertical: {
    position: "absolute",
    width: 3,
    height: 24,
    borderRadius: 1.5,
  },
  sparkleHorizontal: {
    position: "absolute",
    width: 24,
    height: 3,
    borderRadius: 1.5,
  },
  sparkleDiag1: {
    position: "absolute",
    width: 3,
    height: 16,
    borderRadius: 1.5,
    transform: [{ rotate: "45deg" }],
  },
  sparkleDiag2: {
    position: "absolute",
    width: 3,
    height: 16,
    borderRadius: 1.5,
    transform: [{ rotate: "-45deg" }],
  },
  headerButtons: {
    position: "absolute",
    top: 12,
    left: 12,
    right: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    zIndex: 10,
  },
  infoButton: {
    zIndex: 10,
  },
  infoButtonInner: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  landscapeContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    gap: Spacing.md,
  },
  landscapeLeft: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  landscapeCenter: {
    flex: 1.2,
    alignItems: "center",
    justifyContent: "center",
  },
  landscapeRight: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.sm,
  },
  pointerSmall: {
    borderLeftWidth: 10,
    borderRightWidth: 10,
    borderTopWidth: 18,
  },
  resultContainerLandscape: {
    width: "100%",
  },
  resultBoxLandscape: {
    alignItems: "center",
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderRadius: 12,
    backgroundColor: "rgba(255, 215, 0, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(255, 215, 0, 0.3)",
  },
  congratsTextLandscape: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFD700",
    marginTop: Spacing.xs,
  },
  prizeAmountLandscape: {
    fontSize: 28,
    fontWeight: "900",
    color: "#FFD700",
    marginTop: 2,
  },
  errorBoxLandscape: {
    alignItems: "center",
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderRadius: 12,
    backgroundColor: "rgba(239, 68, 68, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.3)",
  },
  errorTextLandscape: {
    fontSize: 12,
    color: "#EF4444",
    textAlign: "center",
    marginTop: Spacing.xs,
  },
  buttonWrapperLandscape: {
    width: "100%",
    position: "relative",
    alignItems: "center",
  },
  buttonGlowEffectLandscape: {
    position: "absolute",
    top: -4,
    left: -4,
    right: -4,
    bottom: -4,
    borderRadius: 14,
    backgroundColor: "#FFD700",
    shadowColor: "#FFD700",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 10,
  },
  spinButtonLandscape: {
    width: "100%",
    borderRadius: 10,
    overflow: "hidden",
  },
  spinButtonGradientLandscape: {
    paddingVertical: Spacing.sm,
    borderRadius: 10,
    alignItems: "center",
  },
  spinButtonTextLandscape: {
    fontSize: 14,
    fontWeight: "800",
    color: "#1a1a2e",
    letterSpacing: 1,
  },
  wagerTextLandscape: {
    fontSize: 10,
    fontWeight: "600",
    color: "#1a1a2e",
    opacity: 0.8,
  },
  noSpinHintLandscape: {
    fontSize: 10,
    color: "rgba(255, 255, 255, 0.5)",
    marginTop: Spacing.xs,
    textAlign: "center",
  },
  infoOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 200,
  },
  infoModal: {
    width: "85%",
    maxWidth: 340,
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "#FFD700",
  },
  infoModalGradient: {
    padding: Spacing.lg,
    paddingTop: Spacing.xl,
  },
  infoCloseButton: {
    position: "absolute",
    top: 10,
    right: 10,
    zIndex: 10,
  },
  infoHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.lg,
    gap: Spacing.sm,
  },
  infoTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#FFD700",
  },
  infoContent: {
    gap: Spacing.md,
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.sm,
  },
  infoIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  infoTextContainer: {
    flex: 1,
  },
  infoItemTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  infoItemText: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.7)",
    marginTop: 2,
  },
  infoDivider: {
    height: 1,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    marginVertical: Spacing.xs,
  },
  whIcon: {
    fontSize: 10,
    fontWeight: "900",
    color: "#FFFFFF",
  },
  infoGotItButton: {
    marginTop: Spacing.lg,
    borderRadius: 12,
    overflow: "hidden",
  },
  infoGotItGradient: {
    paddingVertical: Spacing.md,
    alignItems: "center",
    borderRadius: 12,
  },
  infoGotItText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#1a1a2e",
    letterSpacing: 1,
  },
  hourlySpinInfo: {
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.lg,
  },
  hourlySpinTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#10B981",
    marginTop: Spacing.xs,
  },
  hourlySpinSubtitle: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.7)",
  },
  hourlySpinInfoPortrait: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  hourlySpinTitlePortrait: {
    fontSize: 14,
    fontWeight: "600",
    color: "#10B981",
  },
});
