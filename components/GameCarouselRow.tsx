import React, { useRef, useCallback, useState } from "react";
import { View, StyleSheet, ScrollView, Pressable, Platform, NativeScrollEvent, NativeSyntheticEvent } from "react-native";
import * as Haptics from "expo-haptics";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withSpring,
  Easing,
  WithSpringConfig,
} from "react-native-reanimated";
import { Feather } from "@expo/vector-icons";
import { ThemedText } from "@/components/ThemedText";
import { GameCard } from "@/components/GameCard";
import { Game } from "@/services/api";
import { NeonColors, Spacing, BorderRadius, createTextShadow } from "@/constants/theme";

interface GameCarouselRowProps {
  title?: string;
  games: Game[];
  favorites: string[];
  onGamePress: (game: Game) => void;
  onFavoritePress: (gameName: string) => void;
  cardWidth: number;
  cardHeight: number;
}

const SCROLL_AMOUNT = 300;
const springConfig: WithSpringConfig = {
  damping: 15,
  mass: 0.5,
  stiffness: 150,
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function NavButton({ 
  direction, 
  onPress, 
  disabled 
}: { 
  direction: "left" | "right"; 
  onPress: () => void; 
  disabled: boolean;
}) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(disabled ? 0.3 : 0.8);

  React.useEffect(() => {
    opacity.value = withTiming(disabled ? 0.3 : 0.8, { duration: 150 });
  }, [disabled, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const handlePressIn = () => {
    if (!disabled) {
      scale.value = withSpring(0.9, springConfig);
    }
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, springConfig);
  };

  const handlePress = () => {
    if (!disabled) {
      if (Platform.OS !== "web") {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      onPress();
    }
  };

  return (
    <AnimatedPressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[styles.navButton, animatedStyle]}
      disabled={disabled}
    >
      <Feather 
        name={direction === "left" ? "chevron-left" : "chevron-right"} 
        size={20} 
        color="#fff" 
      />
    </AnimatedPressable>
  );
}

export function GameCarouselRow({
  title,
  games,
  favorites,
  onGamePress,
  onFavoritePress,
  cardWidth,
  cardHeight,
}: GameCarouselRowProps) {
  const scrollViewRef = useRef<ScrollView>(null);
  const scrollX = useRef(0);
  const maxScrollX = useRef(0);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const updateScrollState = useCallback(() => {
    setCanScrollLeft(scrollX.current > 5);
    setCanScrollRight(scrollX.current < maxScrollX.current - 5);
  }, []);

  const handleScrollLeft = useCallback(() => {
    const newX = Math.max(0, scrollX.current - SCROLL_AMOUNT);
    scrollViewRef.current?.scrollTo({ x: newX, animated: true });
  }, []);

  const handleScrollRight = useCallback(() => {
    const newX = Math.min(maxScrollX.current, scrollX.current + SCROLL_AMOUNT);
    scrollViewRef.current?.scrollTo({ x: newX, animated: true });
  }, []);

  const handleScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    scrollX.current = event.nativeEvent.contentOffset.x;
    maxScrollX.current = 
      event.nativeEvent.contentSize.width - event.nativeEvent.layoutMeasurement.width;
    updateScrollState();
  }, [updateScrollState]);

  const handleContentSizeChange = useCallback((contentWidth: number, containerWidth: number) => {
    maxScrollX.current = Math.max(0, contentWidth - containerWidth);
    const hasScrollableContent = maxScrollX.current > 5;
    setCanScrollRight(hasScrollableContent && scrollX.current < maxScrollX.current - 5);
    setCanScrollLeft(scrollX.current > 5);
  }, []);

  if (games.length === 0) return null;

  return (
    <View style={styles.container}>
      {title ? (
        <View style={styles.headerRow}>
          <ThemedText style={styles.title}>{title}</ThemedText>
          <View style={styles.navButtons}>
            <NavButton direction="left" onPress={handleScrollLeft} disabled={!canScrollLeft} />
            <NavButton direction="right" onPress={handleScrollRight} disabled={!canScrollRight} />
          </View>
        </View>
      ) : null}
      <ScrollView
        ref={scrollViewRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        onScroll={handleScroll}
        onLayout={(e) => {
          const containerWidth = e.nativeEvent.layout.width;
          const contentWidth = games.length * (cardWidth + Spacing.sm);
          handleContentSizeChange(contentWidth, containerWidth);
        }}
        scrollEventThrottle={16}
        decelerationRate="fast"
        snapToInterval={cardWidth + Spacing.sm}
      >
        {games.map((game) => (
          <GameCard
            key={game.id || game.name}
            game={game}
            isFavorite={favorites.includes(game.name)}
            onPress={() => onGamePress(game)}
            onFavoritePress={() => onFavoritePress(game.name)}
            cardWidth={cardWidth}
            cardHeight={cardHeight}
          />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.md,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.xs,
    paddingRight: Spacing.xs,
  },
  title: {
    fontSize: 14,
    fontWeight: "700",
    color: "#fff",
    ...createTextShadow(NeonColors.purple, 0, 0, 8),
  },
  navButtons: {
    flexDirection: "row",
    gap: Spacing.xs,
  },
  navButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(139, 92, 246, 0.4)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(139, 92, 246, 0.5)",
  },
  scrollContent: {
    paddingRight: Spacing.md,
    gap: Spacing.sm,
  },
});
