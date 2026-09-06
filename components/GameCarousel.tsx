import React from "react";
import { View, StyleSheet, FlatList, ListRenderItem } from "react-native";
import { ThemedText } from "@/components/ThemedText";
import { GameCard, CARD_WIDTH, CARD_HEIGHT } from "@/components/GameCard";
import { Game } from "@/services/api";
import { NeonColors, Spacing, createTextShadow } from "@/constants/theme";

interface GameCarouselProps {
  title: string;
  games: Game[];
  favorites: string[];
  onGamePress: (game: Game) => void;
  onFavoritePress: (gameName: string) => void;
  titleColor?: string;
}

export function GameCarousel({
  title,
  games,
  favorites,
  onGamePress,
  onFavoritePress,
  titleColor = NeonColors.green,
}: GameCarouselProps) {
  const renderItem: ListRenderItem<Game> = ({ item }) => (
    <GameCard
      game={item}
      isFavorite={favorites.includes(item.name)}
      onPress={() => onGamePress(item)}
      onFavoritePress={() => onFavoritePress(item.name)}
    />
  );

  if (games.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <ThemedText style={[styles.title, { color: titleColor }]}>{title}</ThemedText>
      <FlatList
        data={games}
        renderItem={renderItem}
        keyExtractor={(item) => item.id?.toString() || item.name}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        snapToInterval={CARD_WIDTH + Spacing.md}
        decelerationRate="fast"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.xl,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: Spacing.md,
    ...createTextShadow(NeonColors.green, 0, 0, 8),
  },
  listContent: {
    paddingRight: Spacing.xl,
  },
});
