import React, { useState, useCallback, useEffect } from "react";
import { View, StyleSheet, Pressable, Platform } from "react-native";
import { Image } from "expo-image";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  withRepeat,
  withSequence,
  Easing,
  cancelAnimation,
  WithSpringConfig,
  interpolate,
  withDelay,
} from "react-native-reanimated";
import { ThemedText } from "@/components/ThemedText";
import { NeonColors, Spacing, BorderRadius, GlassColors, PremiumColors, GradientColors, createBoxShadow, createTextShadow } from "@/constants/theme";
import { Game, getGameImageUrlAlternatives } from "@/services/api";
import { IMAGE_BASE_URL } from "@/services/config";

interface GameCardProps {
  game: Game;
  isFavorite: boolean;
  onPress: () => void;
  onFavoritePress: () => void;
  cardWidth?: number;
  cardHeight?: number;
}

const springConfig: WithSpringConfig = {
  damping: 14,
  mass: 0.3,
  stiffness: 200,
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const DEFAULT_CARD_WIDTH = 180;
const DEFAULT_CARD_HEIGHT = 120;

export function GameCard({
  game,
  isFavorite,
  onPress,
  onFavoritePress,
  cardWidth = DEFAULT_CARD_WIDTH,
  cardHeight = DEFAULT_CARD_HEIGHT,
}: GameCardProps) {
  const scale = useSharedValue(1);
  const glowIntensity = useSharedValue(0);
  const favoriteScale = useSharedValue(1);
  const shimmerProgress = useSharedValue(0);
  const shimmerOpacity = useSharedValue(0.6);
  const borderGlow = useSharedValue(0.3);
  const reflectionY = useSharedValue(0);
  const innerGlow = useSharedValue(0.2);
  const [imageErrorCount, setImageErrorCount] = useState(0);
  const [isImageLoading, setIsImageLoading] = useState(true);

  useEffect(() => {
    setImageErrorCount(0);
    setIsImageLoading(true);
    shimmerOpacity.value = 0.6;
  }, [game.id, game.name]);

  useEffect(() => {
    if (isImageLoading) {
      shimmerProgress.value = withRepeat(
        withTiming(1, { duration: 1000, easing: Easing.linear }),
        -1,
        false
      );
    } else {
      cancelAnimation(shimmerProgress);
      shimmerOpacity.value = withTiming(0, { duration: 200 });
    }
  }, [isImageLoading]);

  useEffect(() => {
    borderGlow.value = withRepeat(
      withSequence(
        withTiming(0.6, { duration: 2500, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.2, { duration: 2500, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );

    reflectionY.value = withRepeat(
      withSequence(
        withTiming(-15, { duration: 3000, easing: Easing.inOut(Easing.ease) }),
        withTiming(15, { duration: 3000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );

    innerGlow.value = withRepeat(
      withSequence(
        withTiming(0.4, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.15, { duration: 2000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowIntensity.value,
  }));

  const borderGlowStyle = useAnimatedStyle(() => ({
    opacity: borderGlow.value,
  }));

  const reflectionStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: reflectionY.value }],
    opacity: interpolate(reflectionY.value, [-15, 0, 15], [0.1, 0.25, 0.1]),
  }));

  const innerGlowStyle = useAnimatedStyle(() => ({
    opacity: innerGlow.value,
  }));

  const shimmerStyle = useAnimatedStyle(() => {
    const translateX = shimmerProgress.value * (cardWidth + 100) - 50;
    return {
      transform: [{ translateX }],
      opacity: shimmerOpacity.value,
    };
  });

  const handlePressIn = () => {
    scale.value = withSpring(0.94, springConfig);
    glowIntensity.value = withTiming(1, { duration: 150 });
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, springConfig);
    glowIntensity.value = withTiming(0, { duration: 200 });
  };

  const handleFavoritePress = (e: any) => {
    e.stopPropagation();
    favoriteScale.value = withSequence(
      withSpring(1.4, { damping: 8 }),
      withSpring(1, { damping: 10 })
    );
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    onFavoritePress();
  };

  const favoriteAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: favoriteScale.value }],
  }));

  const imageUrls = React.useMemo(() => getGameImageUrlAlternatives(game), [game]);
  
  const getImageUrl = useCallback(() => {
    if (imageErrorCount >= imageUrls.length) {
      return null;
    }
    return imageUrls[imageErrorCount];
  }, [imageUrls, imageErrorCount]);

  const imageUrl = getImageUrl();
  const showPlaceholder = imageUrl === null;

  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[
        styles.container,
        {
          width: cardWidth,
          height: cardHeight,
        },
      ]}
    >
      <Animated.View style={[StyleSheet.absoluteFill, animatedStyle, { pointerEvents: "none" }]}>
      <Animated.View style={[styles.glowEffect, glowStyle]}>
        <LinearGradient
          colors={["#D4AF37", "#8B5CF6", "#D4AF37"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>

      <View style={styles.outerFrame}>
        <LinearGradient
          colors={["rgba(212, 175, 55, 0.7)", "rgba(139, 92, 246, 0.5)", "rgba(79, 70, 229, 0.4)", "rgba(139, 92, 246, 0.5)", "rgba(212, 175, 55, 0.7)"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.premiumBorder}
        />
        
        <Animated.View style={[styles.animatedBorderGlow, borderGlowStyle]}>
          <LinearGradient
            colors={["rgba(212, 175, 55, 0.8)", "rgba(255, 255, 255, 0.6)", "rgba(212, 175, 55, 0.8)"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
      </View>
      
      <View style={styles.innerContainer}>
        <View style={styles.imageContainer}>
          {!showPlaceholder && imageUrl ? (
            <Image
              source={{ uri: imageUrl }}
              style={styles.image}
              contentFit="cover"
              onError={() => setImageErrorCount(prev => prev + 1)}
              onLoadStart={() => setIsImageLoading(true)}
              onLoadEnd={() => setIsImageLoading(false)}
              transition={300}
              cachePolicy="memory-disk"
            />
          ) : (
            <LinearGradient
              colors={["#2D1B4E", "#1A0D35", "#0F0620"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.placeholderImage}
            >
              <View style={styles.placeholderContent}>
                <View style={styles.placeholderIconContainer}>
                  <LinearGradient
                    colors={["rgba(212, 175, 55, 0.3)", "rgba(139, 92, 246, 0.2)"]}
                    style={styles.placeholderIconBg}
                  >
                    <Feather name="play" size={24} color="rgba(212, 175, 55, 0.9)" />
                  </LinearGradient>
                </View>
                <View style={styles.placeholderTextContainer}>
                  <ThemedText style={styles.placeholderTitle} numberOfLines={2}>
                    {game.title}
                  </ThemedText>
                </View>
              </View>
              <View style={styles.placeholderShine} />
            </LinearGradient>
          )}
          
          {isImageLoading && !showPlaceholder ? (
            <View style={styles.shimmerContainer}>
              <Animated.View style={[styles.shimmer, shimmerStyle]}>
                <LinearGradient
                  colors={["transparent", "rgba(212, 175, 55, 0.2)", "transparent"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.shimmerGradient}
                />
              </Animated.View>
            </View>
          ) : null}

          <Animated.View style={[styles.reflectionOverlay, reflectionStyle]}>
            <LinearGradient
              colors={["transparent", "rgba(255, 255, 255, 0.15)", "transparent"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
          </Animated.View>

          <Animated.View style={[styles.innerGlowOverlay, innerGlowStyle]}>
            <LinearGradient
              colors={["rgba(212, 175, 55, 0.3)", "transparent", "transparent", "rgba(139, 92, 246, 0.2)"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
          </Animated.View>

          <LinearGradient
            colors={["transparent", "rgba(0, 0, 0, 0.5)"]}
            style={styles.overlay}
          />

          <View style={styles.topEdgeHighlight} />

          <Pressable
            onPress={handleFavoritePress}
            style={styles.favoriteButton}
            hitSlop={12}
          >
            <Animated.View style={favoriteAnimatedStyle}>
              <Feather
                name="heart"
                size={20}
                color={isFavorite ? "#EF4444" : "rgba(255, 255, 255, 0.8)"}
                style={isFavorite ? styles.favoriteActiveIcon : styles.favoriteIcon}
              />
            </Animated.View>
          </Pressable>
        </View>
      </View>

      <View style={styles.bottomEdge}>
        <LinearGradient
          colors={["rgba(212, 175, 55, 0.4)", "rgba(139, 92, 246, 0.3)", "rgba(212, 175, 55, 0.4)"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.bottomEdgeGradient}
        />
      </View>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: BorderRadius.sm,
    position: "relative",
    ...createBoxShadow("#8B5CF6", 0, 4, 0.25, 12, 8),
  },
  glowEffect: {
    position: "absolute",
    top: -8,
    left: -8,
    right: -8,
    bottom: -8,
    borderRadius: BorderRadius.sm + 8,
    overflow: "hidden",
    opacity: 0,
  },
  outerFrame: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: BorderRadius.sm,
    padding: 2,
    overflow: "hidden",
  },
  premiumBorder: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: BorderRadius.sm,
  },
  animatedBorderGlow: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: BorderRadius.sm,
    overflow: "hidden",
  },
  innerContainer: {
    flex: 1,
    borderRadius: BorderRadius.sm - 2,
    overflow: "hidden",
    backgroundColor: "#050208",
    margin: 2,
    borderWidth: 0.5,
    borderColor: "rgba(139, 92, 246, 0.15)",
  },
  imageContainer: {
    flex: 1,
    position: "relative",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  placeholderImage: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  placeholderContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.xs,
  },
  placeholderIconContainer: {
    marginBottom: 6,
  },
  placeholderIconBg: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "rgba(212, 175, 55, 0.4)",
  },
  placeholderTextContainer: {
    paddingHorizontal: 8,
  },
  placeholderTitle: {
    color: "rgba(212, 175, 55, 0.9)",
    fontSize: 11,
    fontWeight: "700",
    textAlign: "center",
    letterSpacing: 0.5,
    ...createTextShadow("rgba(139, 92, 246, 0.6)", 0, 1, 6),
    textTransform: "uppercase",
  },
  placeholderShine: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: "30%",
    backgroundColor: "rgba(255, 255, 255, 0.03)",
  },
  shimmerContainer: {
    ...StyleSheet.absoluteFillObject,
    overflow: "hidden",
  },
  shimmer: {
    width: 50,
    height: "100%",
  },
  shimmerGradient: {
    flex: 1,
  },
  reflectionOverlay: {
    ...StyleSheet.absoluteFillObject,
    pointerEvents: "none",
  },
  innerGlowOverlay: {
    ...StyleSheet.absoluteFillObject,
    pointerEvents: "none",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    pointerEvents: "none",
  },
  topEdgeHighlight: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 1.5,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
  },
  favoriteButton: {
    position: "absolute",
    top: 6,
    right: 16,
    zIndex: 10,
    padding: 4,
  },
  favoriteIcon: {
    ...createTextShadow("rgba(0, 0, 0, 0.8)", 0, 1, 3),
  },
  favoriteActiveIcon: {
    ...createTextShadow("#EF4444", 0, 0, 8),
  },
  bottomEdge: {
    position: "absolute",
    bottom: 0,
    left: 2,
    right: 2,
    height: 3,
    borderBottomLeftRadius: BorderRadius.sm - 2,
    borderBottomRightRadius: BorderRadius.sm - 2,
    overflow: "hidden",
  },
  bottomEdgeGradient: {
    flex: 1,
  },
});

export { DEFAULT_CARD_WIDTH as CARD_WIDTH, DEFAULT_CARD_HEIGHT as CARD_HEIGHT };
