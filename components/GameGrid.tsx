import React from "react";
import { View, StyleSheet, ScrollView, Dimensions } from "react-native";
import { GameCard } from "@/components/GameCard";
import { Game } from "@/services/api";
import { Spacing } from "@/constants/theme";

interface GameGridProps {
  games: Game[];
  favorites: string[];
  onGamePress: (game: Game) => void;
  onFavoritePress: (gameName: string) => void;
}

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const SIDEBAR_WIDTH = 72;
const BOTTOM_BAR_HEIGHT = 70;
const AVAILABLE_WIDTH = SCREEN_WIDTH - SIDEBAR_WIDTH - Spacing.lg * 2;
const COLUMNS = 5;
const GAP = Spacing.md;
const CARD_WIDTH = (AVAILABLE_WIDTH - GAP * (COLUMNS - 1)) / COLUMNS;
const CARD_HEIGHT = CARD_WIDTH * 0.85;

export function GameGrid({
  games,
  favorites,
  onGamePress,
  onFavoritePress,
}: GameGridProps) {
  const rows: Game[][] = [];
  for (let i = 0; i < games.length; i += COLUMNS) {
    rows.push(games.slice(i, i + COLUMNS));
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {rows.map((row, rowIndex) => (
        <View key={rowIndex} style={styles.row}>
          {row.map((game) => (
            <GameCard
              key={game.id || game.name}
              game={game}
              isFavorite={favorites.includes(game.name)}
              onPress={() => onGamePress(game)}
              onFavoritePress={() => onFavoritePress(game.name)}
              cardWidth={CARD_WIDTH}
              cardHeight={CARD_HEIGHT}
            />
          ))}
        </View>
      ))}
    </ScrollView>
  );
}

export { CARD_WIDTH as GRID_CARD_WIDTH, CARD_HEIGHT as GRID_CARD_HEIGHT };

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingBottom: BOTTOM_BAR_HEIGHT + Spacing.xl,
  },
  row: {
    flexDirection: "row",
    gap: GAP,
    marginBottom: GAP,
  },
});
