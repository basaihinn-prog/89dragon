import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Image } from "expo-image";
import { Feather } from "@expo/vector-icons";
import { getGameImageUrlAlternatives, type Game } from "@/services/api";
import type { CategoryFilter } from "@/contexts/GamesContext";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const C = {
  ink: "#090611",
  panel: "#150D20",
  edge: "#352341",
  jade: "#35CFFF",
  gold: "#F5C52E",
  paper: "#F6F0FA",
  muted: "#A79BAE",
  pink: "#F435B9",
};

const FILTERS: { id: CategoryFilter; label: string }[] = [
  { id: "slots", label: "Slots" },
  { id: "fish", label: "Fishing" },
  { id: "tables", label: "Tables" },
  { id: "bonus", label: "Bonus" },
  { id: "favorites", label: "Saved" },
];

export interface Dragon89GalleryScreenProps {
  games: Game[];
  favorites: string[];
  selectedCategory: CategoryFilter;
  onCategoryChange: (category: CategoryFilter) => void;
  onToggleFavorite: (gameName: string) => void | Promise<void>;
  onSelectGame: (game: Game) => void;
  onBack: () => void;
  isLoading?: boolean;
  error?: string | null;
  onRetry?: () => void;
}

export function Dragon89GalleryScreen({
  games,
  favorites,
  selectedCategory,
  onCategoryChange,
  onToggleFavorite,
  onSelectGame,
  onBack,
  isLoading = false,
  error,
  onRetry,
}: Dragon89GalleryScreenProps) {
  const insets = useSafeAreaInsets();
  const shownGames = selectedCategory === "favorites"
    ? games.filter((game) => favorites.includes(game.name))
    : games;

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={[styles.content, { paddingTop: insets.top + 10, paddingBottom: insets.bottom + 30 }]} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Pressable onPress={onBack} style={styles.backButton} accessibilityRole="button" accessibilityLabel="Back to home">
            <Feather name="arrow-left" size={18} color={C.paper} />
          </Pressable>
          <View style={styles.headingCopy}>
            <Image
              source={require("../../assets/images/dragon89-wordmark.png")}
              style={styles.wordmark}
              contentFit="contain"
              accessibilityLabel="Dragon89"
            />
            <Text style={styles.title}>Game gallery</Text>
          </View>
          <View style={styles.headerMark}>
            <Feather name="zap" size={17} color={C.gold} />
          </View>
        </View>
        <Text style={styles.subtitle}>Pick a game. Tap its art to launch.</Text>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRail}>
          {FILTERS.map((item) => {
            const active = item.id === selectedCategory;
            return (
              <Pressable
                key={item.id}
                onPress={() => onCategoryChange(item.id)}
                style={[styles.filter, active && styles.filterActive]}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
              >
                <Text style={[styles.filterText, active && styles.filterTextActive]}>{item.label}</Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <View style={styles.resultsRow}>
          <Text style={styles.resultsTitle}>
            {selectedCategory === "favorites" ? "Saved games" : FILTERS.find((item) => item.id === selectedCategory)?.label}
          </Text>
          {!isLoading && !error ? <Text style={styles.resultsCount}>{shownGames.length} available</Text> : null}
        </View>

        {isLoading ? (
          <View style={styles.grid}>
            {[0, 1, 2, 3, 4, 5].map((key) => <View key={key} style={styles.skeleton} />)}
          </View>
        ) : error ? (
          <View style={styles.stateCard}>
            <Feather name="wifi-off" size={22} color={C.gold} />
            <Text style={styles.stateTitle}>Gallery unavailable</Text>
            <Text style={styles.stateBody}>{error}</Text>
            {onRetry ? <Pressable onPress={onRetry} style={styles.retry}><Text style={styles.retryText}>Reload games</Text></Pressable> : null}
          </View>
        ) : shownGames.length === 0 ? (
          <View style={styles.stateCard}>
            <Feather name="heart" size={22} color={C.jade} />
            <Text style={styles.stateTitle}>{selectedCategory === "favorites" ? "Nothing saved yet" : "No games to show"}</Text>
            <Text style={styles.stateBody}>Save games with the heart button, or switch to a different floor.</Text>
          </View>
        ) : (
          <View style={styles.grid}>
            {shownGames.map((game) => (
              <GalleryGame
                key={game.id}
                game={game}
                isFavorite={favorites.includes(game.name)}
                onPress={() => onSelectGame(game)}
                onFavorite={() => onToggleFavorite(game.name)}
              />
            ))}
          </View>
        )}
        <View style={styles.noteRow}>
          <Feather name="shield" size={13} color={C.jade} />
          <Text style={styles.note}>Game availability and launch behavior come from the live catalogue.</Text>
        </View>
      </ScrollView>
    </View>
  );
}

function GalleryGame({ game, isFavorite, onPress, onFavorite }: {
  game: Game;
  isFavorite: boolean;
  onPress: () => void;
  onFavorite: () => void | Promise<void>;
}) {
  const image = getGameImageUrlAlternatives(game)[0];
  return (
    <View style={styles.gameCell}>
      <Pressable onPress={onPress} style={styles.artwork} accessibilityRole="button" accessibilityLabel={`Launch ${game.title || game.name}`}>
        {image ? (
          <Image source={{ uri: image }} style={StyleSheet.absoluteFill} contentFit="cover" transition={180} />
        ) : (
          <View style={styles.noArtwork}><Feather name="play-circle" size={30} color={C.jade} /></View>
        )}
        <View style={styles.artGradient} />
        <View style={styles.gameType}><Text style={styles.gameTypeText}>{game.gamebank || "GAME"}</Text></View>
        <View style={styles.launchMark}><Feather name="play" size={13} color={C.ink} /></View>
      </Pressable>
      <View style={styles.gameInfo}>
        <Text numberOfLines={1} style={styles.gameTitle}>{game.title || game.name}</Text>
        <Text numberOfLines={1} style={styles.gameName}>{game.name}</Text>
      </View>
      <Pressable
        onPress={onFavorite}
        style={styles.favorite}
        accessibilityRole="button"
        accessibilityLabel={isFavorite ? "Remove from saved games" : "Save game"}
      >
        <Feather name="heart" size={15} color={isFavorite ? C.pink : "#C0CBC6"} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.ink },
  content: { paddingTop: 12, paddingHorizontal: 17, paddingBottom: 35 },
  header: { flexDirection: "row", alignItems: "center", gap: 12 },
  backButton: { width: 38, height: 38, borderRadius: 13, backgroundColor: C.panel, borderWidth: 1, borderColor: C.edge, alignItems: "center", justifyContent: "center" },
  headingCopy: { flex: 1 },
  kicker: { color: C.pink, fontSize: 8, fontWeight: "800", letterSpacing: 1.8 },
  title: { color: C.paper, fontSize: 21, fontWeight: "900", marginTop: 2 },
  headerMark: { width: 43, height: 43, borderRadius: 11, borderWidth: 1, borderColor: "#664A25", backgroundColor: "#241819", alignItems: "center", justifyContent: "center" },
  emblem: { width: 32, height: 34 },
  wordmark: { width: 132, height: 28, marginBottom: 2 },
  subtitle: { color: C.muted, fontSize: 11, marginTop: 11 },
  filterRail: { gap: 8, paddingTop: 20, paddingBottom: 20 },
  filter: { paddingHorizontal: 15, paddingVertical: 9, borderRadius: 7, backgroundColor: C.panel, borderWidth: 1, borderColor: C.edge },
  filterActive: { backgroundColor: C.gold, borderColor: "#FFE57B" },
  filterText: { color: C.muted, fontSize: 10, fontWeight: "700" },
  filterTextActive: { color: "#1C1020" },
  resultsRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 13 },
  resultsTitle: { color: C.paper, fontSize: 14, fontWeight: "800" },
  resultsCount: { color: C.muted, fontSize: 10 },
  grid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", rowGap: 15 },
  gameCell: { width: "48.4%", marginBottom: 1, position: "relative" },
  artwork: { width: "100%", aspectRatio: 0.98, borderRadius: 11, overflow: "hidden", backgroundColor: "#1D1129", borderWidth: 1.5, borderColor: "#278EFF" },
  noArtwork: { ...StyleSheet.absoluteFillObject, alignItems: "center", justifyContent: "center", backgroundColor: "#1D1129" },
  artGradient: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(6,4,12,0.10)" },
  gameType: { position: "absolute", left: 9, top: 9, paddingHorizontal: 8, paddingVertical: 5, borderRadius: 10, backgroundColor: "rgba(8,11,17,0.76)" },
  gameTypeText: { color: C.jade, fontSize: 7, fontWeight: "900", letterSpacing: 1 },
  launchMark: { position: "absolute", bottom: 9, right: 9, width: 30, height: 30, borderRadius: 8, backgroundColor: C.gold, alignItems: "center", justifyContent: "center" },
  gameInfo: { paddingRight: 31, paddingTop: 7 },
  gameTitle: { color: C.paper, fontSize: 11, fontWeight: "800" },
  gameName: { color: C.muted, fontSize: 8, marginTop: 3 },
  favorite: { position: "absolute", right: 2, bottom: 7, width: 27, height: 27, borderRadius: 8, backgroundColor: "#201529", borderWidth: 1, borderColor: "#3E2C4D", alignItems: "center", justifyContent: "center" },
  skeleton: { width: "48.4%", aspectRatio: 0.95, borderRadius: 17, backgroundColor: "#182027", borderWidth: 1, borderColor: "#253139" },
  stateCard: { minHeight: 180, borderRadius: 18, padding: 22, backgroundColor: C.panel, borderWidth: 1, borderColor: C.edge, alignItems: "center", justifyContent: "center", gap: 8 },
  stateTitle: { color: C.paper, fontWeight: "800", fontSize: 15, marginTop: 3 },
  stateBody: { color: C.muted, fontSize: 11, lineHeight: 17, textAlign: "center" },
  retry: { backgroundColor: C.gold, borderRadius: 7, paddingHorizontal: 14, paddingVertical: 8, marginTop: 4 },
  retryText: { color: C.ink, fontSize: 10, fontWeight: "800" },
  noteRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 22, padding: 12, borderRadius: 9, backgroundColor: "#140D1D", borderWidth: 1, borderColor: "#30213C" },
  note: { color: C.muted, fontSize: 9, flex: 1, lineHeight: 14 },
});