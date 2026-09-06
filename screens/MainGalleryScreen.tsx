import React, { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { View, StyleSheet, ScrollView, ActivityIndicator, RefreshControl, useWindowDimensions, Pressable } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  withDelay,
  Easing,
} from "react-native-reanimated";
import { Feather } from "@expo/vector-icons";
import { Image } from "expo-image";
import { Sidebar } from "@/components/Sidebar";
import { BottomActionBar } from "@/components/BottomActionBar";
import { TopHeaderBar } from "@/components/TopHeaderBar";
import { GameCard } from "@/components/GameCard";
import { ThemedText } from "@/components/ThemedText";
import { UpdateModal } from "@/components/UpdateModal";
import { useAuth } from "@/contexts/AuthContext";
import { useGames, CategoryFilter } from "@/contexts/GamesContext";
import { useAudio } from "@/contexts/AudioContext";
import { useDailyBonus } from "@/contexts/DailyBonusContext";
import { useSpinWheel } from "@/contexts/SpinWheelContext";
import { useNotifications } from "@/contexts/NotificationsContext";
import { Game } from "@/services/api";
import { checkForUpdates, UpdateInfo } from "@/services/updateChecker";
import { NeonColors, Spacing, GradientColors, BorderRadius, PremiumColors, GlassColors, PremiumBorderColors, createBoxShadow, createTextShadow } from "@/constants/theme";
import { RootStackParamList } from "@/navigation/RootNavigator";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const SIDEBAR_WIDTH_LANDSCAPE = 100;
const SIDEBAR_WIDTH_PORTRAIT = 70;
const BOTTOM_BAR_HEIGHT_LANDSCAPE = 80;
const BOTTOM_BAR_HEIGHT_PORTRAIT = 65;
const CARD_WIDTH = 140;
const CARD_HEIGHT = 100;
const MIN_GIF_WIDTH = 150;
const MAX_GIF_WIDTH = 260;

interface FloatingOrbProps {
  delay: number;
  xPercent: number;
  yPercent: number;
  size: number;
  color: string;
  duration: number;
  screenWidth: number;
  screenHeight: number;
}

function FloatingOrb({ delay, xPercent, yPercent, size, color, duration, screenWidth, screenHeight }: FloatingOrbProps) {
  const translateY = useSharedValue(0);
  const translateX = useSharedValue(0);
  const opacity = useSharedValue(0.15);
  const startX = screenWidth * xPercent;
  const startY = screenHeight * yPercent;

  useEffect(() => {
    translateY.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(-20, { duration: duration, easing: Easing.inOut(Easing.ease) }),
          withTiming(20, { duration: duration, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      )
    );
    translateX.value = withDelay(
      delay + 500,
      withRepeat(
        withSequence(
          withTiming(15, { duration: duration * 1.2, easing: Easing.inOut(Easing.ease) }),
          withTiming(-15, { duration: duration * 1.2, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      )
    );
    opacity.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(0.25, { duration: duration * 0.6, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.1, { duration: duration * 0.6, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      )
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
    ],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        {
          position: "absolute",
          left: startX,
          top: startY,
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
          boxShadow: `0px 0px ${size / 3}px ${color}80`,
        },
        animatedStyle,
      ]}
    />
  );
}

const orbConfigs = [
  { delay: 0, xPercent: 0.15, yPercent: 0.12, size: 90, color: "#8B5CF6", duration: 6000 },
  { delay: 600, xPercent: 0.78, yPercent: 0.08, size: 70, color: "#D4AF37", duration: 5500 },
  { delay: 1200, xPercent: 0.65, yPercent: 0.55, size: 110, color: "#A855F7", duration: 7000 },
  { delay: 1800, xPercent: 0.08, yPercent: 0.65, size: 80, color: "#6366F1", duration: 6500 },
  { delay: 2400, xPercent: 0.45, yPercent: 0.3, size: 60, color: "#D4AF37", duration: 5000 },
  { delay: 3000, xPercent: 0.85, yPercent: 0.75, size: 50, color: "#8B5CF6", duration: 4500 },
];

interface SparkleProps {
  delay: number;
  xPercent: number;
  yPercent: number;
  size: number;
  screenWidth: number;
  screenHeight: number;
}

function Sparkle({ delay, xPercent, yPercent, size, screenWidth, screenHeight }: SparkleProps) {
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0);
  const rotation = useSharedValue(0);
  const startX = screenWidth * xPercent;
  const startY = screenHeight * yPercent;

  useEffect(() => {
    opacity.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(0.9, { duration: 400, easing: Easing.out(Easing.ease) }),
          withTiming(0.4, { duration: 600, easing: Easing.in(Easing.ease) }),
          withTiming(0, { duration: 300, easing: Easing.in(Easing.ease) }),
          withTiming(0, { duration: 1500 })
        ),
        -1
      )
    );
    scale.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 400, easing: Easing.out(Easing.ease) }),
          withTiming(0.7, { duration: 600, easing: Easing.in(Easing.ease) }),
          withTiming(0, { duration: 300, easing: Easing.in(Easing.ease) }),
          withTiming(0, { duration: 1500 })
        ),
        -1
      )
    );
    rotation.value = withDelay(
      delay,
      withRepeat(
        withTiming(180, { duration: 2800, easing: Easing.linear }),
        -1
      )
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { scale: scale.value },
      { rotate: `${rotation.value}deg` },
    ],
  }));

  return (
    <Animated.View
      style={[
        {
          position: "absolute",
          left: startX,
          top: startY,
          width: size,
          height: size,
        },
        animatedStyle,
      ]}
    >
      <View style={{
        position: "absolute",
        left: size * 0.35,
        top: 0,
        width: size * 0.3,
        height: size,
        backgroundColor: "#D4AF37",
        borderRadius: size * 0.15,
        boxShadow: `0px 0px ${size * 0.3}px rgba(212, 175, 55, 0.8)`,
      }} />
      <View style={{
        position: "absolute",
        left: 0,
        top: size * 0.35,
        width: size,
        height: size * 0.3,
        backgroundColor: "#D4AF37",
        borderRadius: size * 0.15,
        boxShadow: `0px 0px ${size * 0.3}px rgba(212, 175, 55, 0.8)`,
      }} />
      <View style={{
        position: "absolute",
        left: size * 0.3,
        top: size * 0.3,
        width: size * 0.4,
        height: size * 0.4,
        backgroundColor: "#FFF8DC",
        borderRadius: size * 0.2,
        boxShadow: `0px 0px ${size * 0.2}px rgba(255, 248, 220, 1)`,
      }} />
    </Animated.View>
  );
}

const sparkleConfigs = [
  { delay: 0, xPercent: 0.92, yPercent: 0.15, size: 12 },
  { delay: 800, xPercent: 0.25, yPercent: 0.85, size: 10 },
  { delay: 1600, xPercent: 0.55, yPercent: 0.25, size: 8 },
  { delay: 2400, xPercent: 0.75, yPercent: 0.65, size: 11 },
  { delay: 3200, xPercent: 0.35, yPercent: 0.45, size: 9 },
  { delay: 4000, xPercent: 0.88, yPercent: 0.45, size: 10 },
  { delay: 4800, xPercent: 0.18, yPercent: 0.25, size: 8 },
  { delay: 5600, xPercent: 0.68, yPercent: 0.85, size: 12 },
];

const landscapeSlides = [
  { source: require("../attached_assets/IMG_5695_1764894485554.gif"), aspectRatio: 600 / 400 },
  { source: require("../attached_assets/IMG_5698_1764894485554.gif"), aspectRatio: 600 / 400 },
  { source: require("../attached_assets/IMG_5699_1764894485554.gif"), aspectRatio: 600 / 400 },
  { source: require("../attached_assets/IMG_5700_1764894485554.gif"), aspectRatio: 600 / 400 },
  { source: require("../attached_assets/IMG_5476_1766107613302.gif"), aspectRatio: 600 / 400 },
  { source: require("../attached_assets/IMG_5838_1766109581836.gif"), aspectRatio: 600 / 400 },
];

const portraitSlides = [
  { source: require("../attached_assets/IMG_5476_1766108207481.gif"), aspectRatio: 600 / 400 },
  { source: require("../attached_assets/IMG_5479_1766108207481.gif"), aspectRatio: 600 / 400 },
  { source: require("../attached_assets/IMG_5490_1766108207481.gif"), aspectRatio: 600 / 400 },
  { source: require("../attached_assets/IMG_5837_1766109532753.gif"), aspectRatio: 600 / 400 },
];

const SLIDESHOW_INTERVAL = 4000;

interface SlideImage {
  source: any;
  aspectRatio: number;
}

interface GifSlideshowProps {
  width: number;
  height: number;
  slides: SlideImage[];
  isPortrait?: boolean;
}

interface FloatingParticleProps {
  delay: number;
  size: number;
  startX: number;
  startY: number;
  containerWidth: number;
  containerHeight: number;
  color: string;
}

function FloatingParticle({ delay, size, startX, startY, containerWidth, containerHeight, color }: FloatingParticleProps) {
  const translateY = useSharedValue(startY);
  const translateX = useSharedValue(startX);
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.5);

  useEffect(() => {
    const animate = () => {
      opacity.value = withDelay(delay, withSequence(
        withTiming(0.8, { duration: 1000 }),
        withTiming(0.3, { duration: 2000 }),
        withTiming(0.8, { duration: 1000 }),
        withTiming(0, { duration: 1000 })
      ));
      translateY.value = withDelay(delay, withTiming(
        startY - containerHeight * 0.4,
        { duration: 5000, easing: Easing.out(Easing.ease) }
      ));
      translateX.value = withDelay(delay, withSequence(
        withTiming(startX + 15, { duration: 2500 }),
        withTiming(startX - 15, { duration: 2500 })
      ));
      scale.value = withDelay(delay, withSequence(
        withTiming(1, { duration: 1500 }),
        withTiming(0.6, { duration: 2000 }),
        withTiming(1, { duration: 1500 })
      ));
    };
    animate();
    const interval = setInterval(() => {
      translateY.value = startY;
      translateX.value = startX;
      animate();
    }, 5000 + delay);
    return () => clearInterval(interval);
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
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
        {
          position: "absolute",
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
          boxShadow: `0px 0px ${size}px ${color}`,
        },
        animatedStyle,
      ]}
    />
  );
}

function SlideshowBackground({ width, height }: { width: number; height: number }) {
  const gradientPulse = useSharedValue(0);
  
  useEffect(() => {
    gradientPulse.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 3000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 3000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, []);

  const pulseStyle = useAnimatedStyle(() => ({
    opacity: 0.3 + gradientPulse.value * 0.2,
  }));

  const particles = [
    { delay: 0, size: 4, startX: width * 0.1, startY: height * 0.8, color: "#50C878" },
    { delay: 500, size: 3, startX: width * 0.3, startY: height * 0.9, color: "#FFD700" },
    { delay: 1000, size: 5, startX: width * 0.5, startY: height * 0.85, color: "#8B5CF6" },
    { delay: 1500, size: 3, startX: width * 0.7, startY: height * 0.9, color: "#EC4899" },
    { delay: 2000, size: 4, startX: width * 0.9, startY: height * 0.8, color: "#3B82F6" },
    { delay: 2500, size: 3, startX: width * 0.2, startY: height * 0.95, color: "#10B981" },
    { delay: 3000, size: 4, startX: width * 0.6, startY: height * 0.9, color: "#F59E0B" },
    { delay: 3500, size: 3, startX: width * 0.8, startY: height * 0.85, color: "#EF4444" },
  ];

  return (
    <View style={[StyleSheet.absoluteFill, { overflow: "hidden", borderRadius: 12 }]}>
      <LinearGradient
        colors={["#0a1a0f", "#0d2818", "#051a0d", "#0a0f1a"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <Animated.View style={[StyleSheet.absoluteFill, pulseStyle]}>
        <LinearGradient
          colors={["transparent", "#50C87815", "transparent"]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
      <View style={[StyleSheet.absoluteFill, { opacity: 0.15 }]}>
        <LinearGradient
          colors={["#50C87830", "transparent", "#FFD70020"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      </View>
      {particles.map((p, i) => (
        <FloatingParticle
          key={i}
          {...p}
          containerWidth={width}
          containerHeight={height}
        />
      ))}
      <View style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        height: 1,
        backgroundColor: "#50C87840",
      }} />
      <View style={{
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        height: 1,
        backgroundColor: "#50C87830",
      }} />
    </View>
  );
}

function GifSlideshow({ width, height, slides, isPortrait = false }: GifSlideshowProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [colorIndex, setColorIndex] = useState(0);
  const opacity = useSharedValue(1);
  const borderGlow = useSharedValue(0.8);
  const strobeIntensity = useSharedValue(1);
  const prevSlidesLengthRef = useRef(slides.length);

  useEffect(() => {
    if (slides.length !== prevSlidesLengthRef.current) {
      setCurrentIndex((prev) => prev % slides.length);
      prevSlidesLengthRef.current = slides.length;
    }
  }, [slides.length]);

  const safeIndex = currentIndex % slides.length;
  const currentGif = slides[safeIndex];
  const gifAspectRatio = currentGif.aspectRatio;
  
  let finalWidth: number;
  let finalHeight: number;
  
  if (width / height > gifAspectRatio) {
    finalHeight = height;
    finalWidth = height * gifAspectRatio;
  } else {
    finalWidth = width;
    finalHeight = width / gifAspectRatio;
  }

  useEffect(() => {
    const interval = setInterval(() => {
      opacity.value = withSequence(
        withTiming(0, { duration: 300 }),
        withTiming(1, { duration: 300 })
      );
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % slides.length);
      }, 300);
    }, SLIDESHOW_INTERVAL);

    const colorInterval = setInterval(() => {
      setColorIndex((prev) => (prev + 1) % PremiumBorderColors.length);
    }, 200);

    borderGlow.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 100, easing: Easing.linear }),
        withTiming(0.4, { duration: 100, easing: Easing.linear })
      ),
      -1,
      true
    );

    strobeIntensity.value = withRepeat(
      withSequence(
        withTiming(1.2, { duration: 80, easing: Easing.linear }),
        withTiming(0.6, { duration: 80, easing: Easing.linear })
      ),
      -1,
      true
    );

    return () => {
      clearInterval(interval);
      clearInterval(colorInterval);
    };
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const currentColor = PremiumBorderColors[colorIndex];
  const nextColor = PremiumBorderColors[(colorIndex + 1) % PremiumBorderColors.length];

  const glowStyle = useAnimatedStyle(() => ({
    opacity: borderGlow.value * strobeIntensity.value,
  }));

  return (
    <View style={[slideshowStyles.outerContainer, { width, height }]}>
      <Animated.View 
        style={[
          slideshowStyles.glowBorder, 
          glowStyle,
          { 
            backgroundColor: currentColor + "30",
            boxShadow: `0px 0px 20px ${currentColor}`,
            borderColor: currentColor,
          }
        ]} 
      />
      <LinearGradient
        colors={[currentColor, nextColor, PremiumBorderColors[(colorIndex + 2) % PremiumBorderColors.length]]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={slideshowStyles.rainbowBorder}
      >
        <View style={slideshowStyles.imageBorderInner}>
          <Animated.View style={[slideshowStyles.imageWrapper, animatedStyle]}>
            <Image
              source={currentGif.source}
              style={slideshowStyles.image}
              contentFit={isPortrait ? "cover" : "contain"}
              transition={200}
            />
          </Animated.View>
        </View>
      </LinearGradient>
      <View style={slideshowStyles.dotsContainer}>
        {slides.map((_, index) => (
          <Pressable
            key={index}
            onPress={() => setCurrentIndex(index)}
            style={[
              slideshowStyles.dot,
              currentIndex === index && slideshowStyles.dotActive,
            ]}
          />
        ))}
      </View>
    </View>
  );
}

const slideshowStyles = StyleSheet.create({
  outerContainer: {
    borderRadius: 12,
    overflow: "hidden",
  },
  imageContainer: {
    position: "relative",
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  glowBorder: {
    position: "absolute",
    top: -4,
    left: -4,
    right: -4,
    bottom: -4,
    borderRadius: 14,
    borderWidth: 2,
  },
  rainbowBorder: {
    width: "100%",
    height: "100%",
    padding: 2,
    borderRadius: 12,
  },
  imageBorderInner: {
    flex: 1,
    borderRadius: 10,
    overflow: "hidden",
    backgroundColor: "#0A0514",
  },
  imageWrapper: {
    flex: 1,
  },
  image: {
    width: "100%",
    height: "100%",
  },
  dotsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 8,
    gap: 8,
    position: "absolute",
    bottom: 10,
    left: 0,
    right: 0,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(212, 175, 55, 0.3)",
    borderWidth: 1,
    borderColor: "rgba(212, 175, 55, 0.2)",
  },
  dotActive: {
    backgroundColor: "#D4AF37",
    width: 18,
    boxShadow: "0px 0px 4px rgba(212, 175, 55, 0.6)",
  },
});

interface GameColumn {
  top: Game | null;
  middle: Game | null;
  bottom: Game | null;
}

function isValidGame(game: Game | null | undefined): game is Game {
  return game !== null && game !== undefined && !!game.name;
}

function buildGameColumns(games: Game[], rowCount: number = 2): GameColumn[] {
  const validGames = games.filter(isValidGame);
  if (validGames.length === 0) return [];
  
  const columns: GameColumn[] = [];
  
  for (let i = 0; i < validGames.length; i += rowCount) {
    const top = validGames[i];
    const middle = rowCount >= 3 ? validGames[i + 1] : null;
    const bottom = rowCount >= 3 ? validGames[i + 2] : validGames[i + 1];
    if (isValidGame(top) || isValidGame(middle) || isValidGame(bottom)) {
      columns.push({
        top: isValidGame(top) ? top : null,
        middle: isValidGame(middle) ? middle : null,
        bottom: isValidGame(bottom) ? bottom : null,
      });
    }
  }
  
  return columns;
}

export default function MainGalleryScreen() {
  const insets = useSafeAreaInsets();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const isLandscape = screenWidth > screenHeight;
  const navigation = useNavigation<NavigationProp>();
  const { user, refreshBalance } = useAuth();
  const { playDashboardMusic } = useAudio();
  const { showModal: showDailyBonus, canClaimToday, isLoading: isBonusLoading } = useDailyBonus();
  const { showModal: showSpinWheel } = useSpinWheel();
  const { showModal: showNotifications, unreadCount } = useNotifications();
  const {
    games,
    favorites,
    isLoading,
    error,
    selectedCategory,
    setSelectedCategory,
    toggleFavorite,
    getFilteredGames,
    refreshGames,
  } = useGames();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);

  const SIDEBAR_WIDTH = isLandscape ? SIDEBAR_WIDTH_LANDSCAPE : SIDEBAR_WIDTH_PORTRAIT;
  const BOTTOM_BAR_HEIGHT = isLandscape ? BOTTOM_BAR_HEIGHT_LANDSCAPE : BOTTOM_BAR_HEIGHT_PORTRAIT;

  const contentWidth = screenWidth - SIDEBAR_WIDTH - insets.left - Spacing.md * 2;
  const contentHeight = screenHeight - insets.top - BOTTOM_BAR_HEIGHT - Spacing.md * 2 - insets.bottom;

  const { gifWidth, gifHeight, gamesAreaWidth, gamesAreaHeight, showGif, rowCount, isVerticalLayout, isPortraitMode, portraitCardWidth, portraitCardHeight } = useMemo(() => {
    if (!isLandscape) {
      const gifAspectRatio = 3 / 2;
      const portraitGifWidth = contentWidth * 0.95;
      const portraitGifHeight = Math.min(contentHeight * 0.55, portraitGifWidth / gifAspectRatio) * 1.215;
      const portraitGamesHeight = contentHeight - portraitGifHeight - Spacing.md;
      const numColumns = Math.max(2, Math.floor(contentWidth / (CARD_WIDTH + Spacing.sm)));
      const availableCardWidth = (contentWidth - (numColumns + 1) * Spacing.sm) / numColumns;
      const portraitCardW = Math.min(CARD_WIDTH, availableCardWidth);
      const portraitCardH = Math.floor(portraitCardW / 1.4);
      return {
        gifWidth: portraitGifWidth,
        gifHeight: portraitGifHeight,
        gamesAreaWidth: contentWidth,
        gamesAreaHeight: portraitGamesHeight,
        showGif: true,
        rowCount: 2,
        isVerticalLayout: true,
        isPortraitMode: true,
        portraitCardWidth: portraitCardW,
        portraitCardHeight: portraitCardH,
      };
    }
    
    const rows = 2;
    
    const rowHeight = contentHeight / rows - Spacing.sm;
    const estimatedCardHeight = Math.min(CARD_HEIGHT, rowHeight - 10);
    const estimatedCardWidth = Math.floor(estimatedCardHeight * 1.4);
    
    const landscapeGifHeight = (estimatedCardHeight * 2) + Spacing.sm;
    const gif = estimatedCardWidth;
    
    const minTotalForSideBySide = gif + 200 + Spacing.md;
    
    if (contentWidth < minTotalForSideBySide) {
      return { 
        gifWidth: 0, 
        gifHeight: 0,
        gamesAreaWidth: contentWidth, 
        gamesAreaHeight: contentHeight,
        showGif: false,
        rowCount: rows,
        isVerticalLayout: false,
        isPortraitMode: false,
        portraitCardWidth: undefined,
        portraitCardHeight: undefined,
      };
    }
    
    let gamesArea = contentWidth - gif - Spacing.md;
    
    return { 
      gifWidth: gif, 
      gifHeight: landscapeGifHeight,
      gamesAreaWidth: gamesArea, 
      gamesAreaHeight: contentHeight,
      showGif: true,
      rowCount: rows,
      isVerticalLayout: false,
      isPortraitMode: false,
      portraitCardWidth: undefined,
      portraitCardHeight: undefined,
    };
  }, [contentWidth, contentHeight, isLandscape]);

  useEffect(() => {
    playDashboardMusic();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      if (user) {
        refreshBalance();
      }
    }, [user])
  );

  useEffect(() => {
    if (!isBonusLoading && canClaimToday) {
      const timer = setTimeout(() => {
        showDailyBonus();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isBonusLoading, canClaimToday]);

  useEffect(() => {
    async function checkAppUpdates() {
      const result = await checkForUpdates();
      if (result.updateAvailable && result.updateInfo) {
        setUpdateInfo(result.updateInfo);
        setShowUpdateModal(true);
      }
    }
    const timer = setTimeout(() => {
      checkAppUpdates();
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([refreshGames(), refreshBalance()]);
    setIsRefreshing(false);
  };

  const [isRetrying, setIsRetrying] = useState(false);

  const handleRetry = async () => {
    setIsRetrying(true);
    await refreshGames();
    setIsRetrying(false);
  };

  const handleGamePress = (game: Game) => {
    navigation.navigate("Game", { game });
  };

  const handleSettingsPress = () => {
    navigation.navigate("Settings");
  };

  const handleProfilePress = () => {
    navigation.navigate("Profile");
  };


  const filteredGames = getFilteredGames();
  const gameColumns = buildGameColumns(filteredGames, rowCount).filter(col => col.top || col.middle || col.bottom);

  const rowHeight = contentHeight / rowCount - Spacing.sm;
  const landscapeCardHeight = Math.min(CARD_HEIGHT, rowHeight - 10);
  const landscapeCardWidth = Math.floor(landscapeCardHeight * 1.4);
  const cardWidth = isPortraitMode && portraitCardWidth ? portraitCardWidth : landscapeCardWidth;
  const cardHeight = isPortraitMode && portraitCardHeight ? portraitCardHeight : landscapeCardHeight;

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={GradientColors.casinoBackground}
        locations={[0, 0.25, 0.5, 0.75, 1]}
        style={StyleSheet.absoluteFill}
      />
      <StatusBar style="light" />

      <View style={[styles.orbsContainer, { pointerEvents: "none" }]}>
        {orbConfigs.map((orb, index) => (
          <FloatingOrb key={index} {...orb} screenWidth={screenWidth} screenHeight={screenHeight} />
        ))}
        {sparkleConfigs.map((sparkle, index) => (
          <Sparkle key={`sparkle-${index}`} {...sparkle} screenWidth={screenWidth} screenHeight={screenHeight} />
        ))}
      </View>

      <Sidebar
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
      />

      <TopHeaderBar
        balance={user?.balance || 0}
      />

      <View
        style={[
          styles.mainContent,
          {
            paddingLeft: SIDEBAR_WIDTH + Spacing.md,
            paddingRight: Spacing.md,
            paddingTop: insets.top + 50,
            paddingBottom: BOTTOM_BAR_HEIGHT + Spacing.xs,
          },
        ]}
      >
        <View style={[styles.contentRow, isVerticalLayout && { flexDirection: "column" }]}>
          {showGif ? (
            <GifSlideshow width={gifWidth} height={gifHeight} slides={isPortraitMode ? portraitSlides : landscapeSlides} isPortrait={isPortraitMode} />
          ) : null}
          
          <ScrollView
            style={[styles.gamesScrollView, { width: gamesAreaWidth, maxHeight: isVerticalLayout ? gamesAreaHeight : undefined }]}
            contentContainerStyle={styles.gamesScrollContent}
            refreshControl={
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={handleRefresh}
                tintColor={NeonColors.purple}
              />
            }
            showsVerticalScrollIndicator={false}
          >
            {isLoading && games.length === 0 ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={NeonColors.purple} />
                <ThemedText style={styles.loadingText}>Loading games...</ThemedText>
              </View>
            ) : error || games.length === 0 ? (
              <View style={styles.errorContainer}>
                <Feather name="alert-circle" size={36} color={NeonColors.gold} />
                <ThemedText style={styles.errorTitle}>Games Unavailable</ThemedText>
                <ThemedText style={styles.errorText}>
                  {error || "Unable to load games"}
                </ThemedText>
                <Pressable 
                  style={[styles.retryButton, isRetrying && styles.retryButtonDisabled]} 
                  onPress={handleRetry}
                  disabled={isRetrying}
                >
                  {isRetrying ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <>
                      <Feather name="refresh-cw" size={16} color="#fff" />
                      <ThemedText style={styles.retryButtonText}>Retry</ThemedText>
                    </>
                  )}
                </Pressable>
              </View>
            ) : filteredGames.length === 0 ? (
              <View style={styles.emptyContainer}>
                <ThemedText style={styles.emptyText}>
                  {selectedCategory === "favorites"
                    ? "No favorites yet"
                    : "No games found"}
                </ThemedText>
              </View>
            ) : isPortraitMode ? (
              <View style={styles.portraitGridContainer}>
                {filteredGames.map((game) => (
                  <GameCard
                    key={game.name}
                    game={game}
                    isFavorite={favorites.includes(game.name)}
                    onPress={() => handleGamePress(game)}
                    onFavoritePress={() => toggleFavorite(game.name)}
                    cardWidth={cardWidth}
                    cardHeight={cardHeight}
                  />
                ))}
              </View>
            ) : (
              <View style={styles.carouselContainer}>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.syncedCarouselContent}
                  decelerationRate="fast"
                  snapToInterval={cardWidth + Spacing.sm}
                >
                  {gameColumns.map((column, colIndex) => (
                    <View key={`col-${colIndex}`} style={[styles.gameColumn, { gap: Spacing.sm }]}>
                      {column.top ? (
                        <GameCard
                          game={column.top}
                          isFavorite={favorites.includes(column.top.name)}
                          onPress={() => handleGamePress(column.top!)}
                          onFavoritePress={() => toggleFavorite(column.top!.name)}
                          cardWidth={cardWidth}
                          cardHeight={cardHeight}
                        />
                      ) : null}
                      {column.middle ? (
                        <GameCard
                          game={column.middle}
                          isFavorite={favorites.includes(column.middle.name)}
                          onPress={() => handleGamePress(column.middle!)}
                          onFavoritePress={() => toggleFavorite(column.middle!.name)}
                          cardWidth={cardWidth}
                          cardHeight={cardHeight}
                        />
                      ) : null}
                      {column.bottom ? (
                        <GameCard
                          game={column.bottom}
                          isFavorite={favorites.includes(column.bottom.name)}
                          onPress={() => handleGamePress(column.bottom!)}
                          onFavoritePress={() => toggleFavorite(column.bottom!.name)}
                          cardWidth={cardWidth}
                          cardHeight={cardHeight}
                        />
                      ) : null}
                    </View>
                  ))}
                </ScrollView>
              </View>
            )}
          </ScrollView>
        </View>
      </View>

      <BottomActionBar
        onSpinWheelPress={showSpinWheel}
        onBonusPress={showDailyBonus}
        onNotificationPress={showNotifications}
        onProfilePress={handleProfilePress}
        onSettingsPress={handleSettingsPress}
        onDepositPress={() => navigation.navigate("Deposit")}
        onWithdrawPress={() => navigation.navigate("Withdrawal")}
        avatarUrl={user?.avatar}
      />

      <UpdateModal
        visible={showUpdateModal}
        updateInfo={updateInfo}
        onClose={() => setShowUpdateModal(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#050208",
  },
  orbsContainer: {
    ...StyleSheet.absoluteFillObject,
    overflow: "hidden",
  },
  mainContent: {
    flex: 1,
  },
  contentRow: {
    flex: 1,
    flexDirection: "row",
    gap: Spacing.md,
  },
  gamesScrollView: {
    flex: 1,
  },
  gamesScrollContent: {
    flexGrow: 1,
  },
  carouselContainer: {
    flex: 1,
  },
  portraitGridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingHorizontal: Spacing.xs,
  },
  syncedCarouselContent: {
    paddingHorizontal: Spacing.xs,
    gap: Spacing.sm,
    alignItems: "flex-start",
  },
  gameColumn: {
    flexDirection: "column",
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.xl,
  },
  loadingText: {
    marginTop: Spacing.sm,
    color: "rgba(212, 175, 55, 0.8)",
    fontSize: 13,
    letterSpacing: 0.5,
  },
  errorContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.md,
  },
  errorTitle: {
    color: "#D4AF37",
    fontSize: 16,
    fontWeight: "700",
    marginTop: Spacing.sm,
    marginBottom: Spacing.xs,
    textShadowColor: "rgba(212, 175, 55, 0.4)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 6,
  },
  errorText: {
    color: "rgba(255, 255, 255, 0.6)",
    textAlign: "center",
    fontSize: 12,
    marginBottom: Spacing.md,
  },
  retryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(139, 92, 246, 0.3)",
    borderWidth: 1,
    borderColor: "#8B5CF6",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: 16,
    gap: Spacing.xs,
    minWidth: 85,
    minHeight: 34,
  },
  retryButtonDisabled: {
    opacity: 0.5,
  },
  retryButtonText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.md,
  },
  emptyText: {
    color: "rgba(212, 175, 55, 0.7)",
    textAlign: "center",
    fontSize: 13,
    fontStyle: "italic",
  },
});
