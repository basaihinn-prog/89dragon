import React from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Image } from "expo-image";
import { Feather } from "@expo/vector-icons";
import { getGameImageUrlAlternatives, type Game } from "@/services/api";
import type { CategoryFilter } from "@/contexts/GamesContext";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { StyleProp, TextStyle } from "react-native";

const C = {
  ink: "#11111D",
  panel: "#191725",
  panel2: "#241328",
  edge: "#3D2D4D",
  jade: "#42D8FF",
  jadeDim: "#16405A",
  gold: "#F5C52E",
  paper: "#F5F0E9",
  muted: "#A49CB0",
  pink: "#F435B9",
};

const CATEGORIES: { key: CategoryFilter; label: string }[] = [
  { key: "slots", label: "Slots" },
  { key: "fish", label: "Fishing" },
  { key: "tables", label: "Tables" },
  { key: "bonus", label: "Bonus" },
  { key: "favorites", label: "Saved" },
];

export interface Dragon89HomeScreenProps {
  games: Game[];
  favorites: string[];
  selectedCategory: CategoryFilter;
  onCategoryChange: (category: CategoryFilter) => void;
  onToggleFavorite: (gameName: string) => void | Promise<void>;
  onSelectGame: (game: Game) => void;
  onOpenGallery: () => void;
  onLogin?: () => void;
  isLoading?: boolean;
  error?: string | null;
  onRetry?: () => void;
}

export function Dragon89HomeScreen({
  games,
  favorites,
  selectedCategory,
  onCategoryChange,
  onToggleFavorite,
  onSelectGame,
  onOpenGallery,
  onLogin,
  isLoading = false,
  error,
  onRetry,
}: Dragon89HomeScreenProps) {
  const insets = useSafeAreaInsets();
  const visibleGames = selectedCategory === "favorites"
    ? games.filter((game) => favorites.includes(game.name))
    : games;
  const feature = visibleGames[0];
  const featureImageUrl = feature ? getGameImageUrlAlternatives(feature)[0] : undefined;
  const rest = visibleGames.slice(1, 7);

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 10, paddingBottom: insets.bottom + 28 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topbar}>
          <View style={styles.brandLockup}>
            <Image
              source={require("../../assets/images/dragon89-wordmark.png")}
              style={styles.wordmark}
              contentFit="contain"
              accessibilityLabel="Dragon89"
            />
          </View>
          {onLogin ? (
            <Pressable onPress={onLogin} style={styles.loginButton} accessibilityRole="button">
              <Feather name="user" size={14} color={C.ink} />
              <TextLike style={styles.loginLabel}>Log in</TextLike>
            </Pressable>
          ) : null}
        </View>

        <View style={styles.welcomeRow}>
          <Image
            source={require("../../assets/images/dragon89-neon-emblem.png")}
            style={styles.heroEmblem}
            contentFit="contain"
            accessibilityLabel="Dragon89 neon dragon emblem"
          />
          <View style={styles.heroOverlay} />
          <View style={styles.welcomeCopy}>
            <TextLike style={styles.eyebrow}>WELCOME TO THE LOBBY</TextLike>
            <TextLike style={styles.headline}>Choose your next game</TextLike>
            <TextLike style={styles.welcomeSub}>Slots, fishing and more in one place.</TextLike>
          </View>
        </View>

        <View style={styles.quickActions}>
          <ActionTile icon="grid" label="All games" onPress={onOpenGallery} />
          <ActionTile icon="gift" label="Bonus" onPress={() => onCategoryChange("bonus")} />
          <ActionTile icon="target" label="Fishing" onPress={() => onCategoryChange("fish")} />
          <ActionTile icon="heart" label="Saved" onPress={() => onCategoryChange("favorites")} />
        </View>

        {onLogin ? (
          <Pressable onPress={onLogin} style={styles.memberCard} accessibilityRole="button">
            <View style={styles.memberCopy}>
              <TextLike style={styles.memberEyebrow}>YOUR PLAYER SPACE</TextLike>
              <TextLike style={styles.memberTitle}>Sign in to save your favourites</TextLike>
              <TextLike style={styles.memberHint}>Your account, your games. Nothing guessed.</TextLike>
            </View>
            <View style={styles.memberArrow}>
              <Feather name="arrow-up-right" size={17} color={C.jade} />
            </View>
          </Pressable>
        ) : null}

        <View style={styles.sectionHeader}>
          <View>
            <TextLike style={styles.sectionOverline}>PICK A CATEGORY</TextLike>
            <TextLike style={styles.sectionTitle}>Browse games</TextLike>
          </View>
          <Pressable onPress={onOpenGallery} style={styles.viewAll}>
            <TextLike style={styles.viewAllText}>View all</TextLike>
            <Feather name="arrow-right" size={14} color={C.jade} />
          </Pressable>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryRail}>
          {CATEGORIES.map((category) => {
            const active = selectedCategory === category.key;
            return (
              <Pressable
                key={category.key}
                onPress={() => onCategoryChange(category.key)}
                style={[styles.categoryPill, active && styles.categoryPillActive]}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
              >
                <TextLike style={[styles.categoryText, active && styles.categoryTextActive]}>
                  {category.label}
                </TextLike>
              </Pressable>
            );
          })}
        </ScrollView>

        {isLoading ? (
          <View style={styles.skeletonRow} accessibilityLabel="Loading games">
            {[0, 1, 2].map((item) => <View key={item} style={styles.skeletonCard} />)}
          </View>
        ) : error ? (
          <View style={styles.messagePanel}>
            <Feather name="wifi-off" size={21} color={C.gold} />
            <TextLike style={styles.messageTitle}>Games are taking a moment</TextLike>
            <TextLike style={styles.messageCopy}>{error}</TextLike>
            {onRetry ? <Pressable onPress={onRetry} style={styles.retryButton}><TextLike style={styles.retryText}>Try again</TextLike></Pressable> : null}
          </View>
        ) : visibleGames.length === 0 ? (
          <View style={styles.messagePanel}>
            <Feather name="bookmark" size={21} color={C.jade} />
            <TextLike style={styles.messageTitle}>{selectedCategory === "favorites" ? "No saved games yet" : "No games in this view"}</TextLike>
            <TextLike style={styles.messageCopy}>Save a game with the heart, or choose another category.</TextLike>
          </View>
        ) : (
          <>
            {feature ? (
              <View style={styles.featureCard}>
                <Image
                  source={featureImageUrl ? { uri: featureImageUrl } : require("../../assets/images/dragon89-chest-card.jpg")}
                  style={StyleSheet.absoluteFill}
                  contentFit="cover"
                  accessibilityLabel={featureImageUrl ? `${feature.title || feature.name} artwork` : "Dragon89 treasure chest artwork"}
                />
                <View style={styles.featureShade} />
                <View style={styles.featureTopline}>
                  <View style={styles.liveTag}><TextLike style={styles.liveText}>FEATURED</TextLike></View>
                  <FavoriteButton
                    active={favorites.includes(feature.name)}
                    onPress={() => onToggleFavorite(feature.name)}
                  />
                </View>
                <View style={styles.featureBottom}>
                  <TextLike style={styles.featureKicker}>FEATURED GAME</TextLike>
                  <TextLike numberOfLines={1} style={styles.featureTitle}>{feature.title || feature.name}</TextLike>
                  <Pressable onPress={() => onSelectGame(feature)} style={styles.playCta} accessibilityRole="button">
                    <Feather name="play" size={13} color={C.ink} /><TextLike style={styles.playText}>Play now</TextLike>
                  </Pressable>
                </View>
              </View>
            ) : null}
            <View style={styles.gameSectionHead}>
              <TextLike style={styles.gameSectionTitle}>{selectedCategory === "favorites" ? "Your saved games" : "Popular right now"}</TextLike>
              <TextLike style={styles.gameCount}>{visibleGames.length} games</TextLike>
            </View>
            <View style={styles.gameGrid}>
              {(feature ? rest : visibleGames.slice(0, 6)).map((game) => (
                <GameTile
                  key={game.id}
                  game={game}
                  favorite={favorites.includes(game.name)}
                  onPress={() => onSelectGame(game)}
                  onFavorite={() => onToggleFavorite(game.name)}
                />
              ))}
            </View>
          </>
        )}
        <View style={styles.footer}><View style={styles.footerRule} /><TextLike style={styles.footerText}>DRAGON89 · GAME LOBBY</TextLike></View>
      </ScrollView>
    </View>
  );
}

function TextLike({ children, style, numberOfLines }: { children: React.ReactNode; style?: StyleProp<TextStyle>; numberOfLines?: number }) {
  return <Text numberOfLines={numberOfLines} style={style}>{children}</Text>;
}

function ActionTile({ icon, label, onPress }: { icon: React.ComponentProps<typeof Feather>["name"]; label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={styles.actionTile} accessibilityRole="button">
      <Feather name={icon} size={17} color={C.jade} />
      <TextLike style={styles.actionLabel}>{label}</TextLike>
    </Pressable>
  );
}

function FavoriteButton({ active, onPress }: { active: boolean; onPress: () => void | Promise<void> }) {
  return (
    <Pressable onPress={onPress} hitSlop={8} style={styles.favoriteButton} accessibilityRole="button" accessibilityLabel={active ? "Remove from saved games" : "Save game"}>
      <Feather name="heart" size={16} color={active ? C.pink : C.paper} />
    </Pressable>
  );
}

function GameTile({ game, favorite, onPress, onFavorite }: { game: Game; favorite: boolean; onPress: () => void; onFavorite: () => void | Promise<void> }) {
  const imageUrl = getGameImageUrlAlternatives(game)[0];
  return (
    <View style={styles.gameTile}>
      <View style={styles.gameArt}>
        <Pressable onPress={onPress} style={StyleSheet.absoluteFill} accessibilityRole="button" accessibilityLabel={`Launch ${game.title || game.name}`}>
          {imageUrl ? (
            <Image source={{ uri: imageUrl }} style={StyleSheet.absoluteFill} contentFit="cover" transition={150} />
          ) : (
            <View style={styles.artFallback}><Feather name="play-circle" size={27} color={C.jade} /></View>
          )}
          <View style={styles.gameArtShade} />
          <View style={styles.gamePlay}><Feather name="play" size={12} color={C.ink} /></View>
        </Pressable>
        <FavoriteButton active={favorite} onPress={onFavorite} />
      </View>
      <TextLike numberOfLines={1} style={styles.gameName}>{game.title || game.name}</TextLike>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.ink },
  content: { paddingHorizontal: 18, paddingTop: 12, paddingBottom: 32 },
  topbar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 24 },
  brandLockup: { flexDirection: "row", alignItems: "center" },
  wordmark: { width: 143, height: 38 },
  loginButton: { height: 36, paddingHorizontal: 14, borderRadius: 11, flexDirection: "row", alignItems: "center", gap: 7, backgroundColor: C.gold },
  loginLabel: { color: C.ink, fontSize: 12, fontWeight: "800" },
  welcomeRow: { height: 278, borderRadius: 7, backgroundColor: "#080812", borderWidth: 1, borderColor: "#292643", overflow: "hidden", alignItems: "center", justifyContent: "flex-end" },
  welcomeCopy: { zIndex: 1, width: "100%", paddingHorizontal: 17, paddingBottom: 15 },
  eyebrow: { color: C.jade, fontSize: 9, fontWeight: "900", letterSpacing: 2 },
  headline: { marginTop: 5, color: C.paper, fontSize: 21, fontWeight: "900", lineHeight: 25 },
  welcomeSub: { marginTop: 4, fontSize: 10, color: "#C1B8CC" },
  heroEmblem: { position: "absolute", width: "104%", height: 256, top: -4 },
  heroOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(8,8,18,0.17)" },
  quickActions: { flexDirection: "row", gap: 8, marginTop: 14 },
  actionTile: { flex: 1, minHeight: 62, backgroundColor: "#171524", borderRadius: 10, alignItems: "center", justifyContent: "center", gap: 7, borderWidth: 1, borderColor: "#302641" },
  actionLabel: { color: "#CED6D2", fontSize: 9, fontWeight: "700" },
  memberCard: { marginTop: 13, minHeight: 72, padding: 13, borderRadius: 10, borderWidth: 1, borderColor: "#4B3950", backgroundColor: "#171521", flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  memberCopy: { flex: 1, paddingRight: 12 },
  memberEyebrow: { color: C.gold, fontSize: 8, fontWeight: "800", letterSpacing: 1.4 },
  memberTitle: { color: C.paper, fontSize: 13, fontWeight: "800", marginTop: 5 },
  memberHint: { color: C.muted, fontSize: 9, marginTop: 4 },
  memberArrow: { width: 34, height: 34, borderRadius: 10, backgroundColor: "#272030", alignItems: "center", justifyContent: "center" },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", marginTop: 25, marginBottom: 12 },
  sectionOverline: { color: C.pink, fontSize: 8, fontWeight: "800", letterSpacing: 1.8 },
  sectionTitle: { color: C.jade, fontSize: 16, fontWeight: "900", marginTop: 3, letterSpacing: 2 },
  viewAll: { flexDirection: "row", alignItems: "center", gap: 5, paddingBottom: 3 },
  viewAllText: { color: C.jade, fontSize: 11, fontWeight: "700" },
  categoryRail: { gap: 8, paddingBottom: 14 },
  categoryPill: { borderWidth: 1, borderColor: C.edge, borderRadius: 6, paddingHorizontal: 15, paddingVertical: 8, backgroundColor: C.panel },
  categoryPillActive: { backgroundColor: C.gold, borderColor: C.gold },
  categoryText: { color: C.muted, fontSize: 11, fontWeight: "700" },
  categoryTextActive: { color: C.ink },
  featureCard: { height: 205, borderRadius: 10, overflow: "hidden", backgroundColor: C.panel2, borderWidth: 1, borderColor: "#3C2B50" },
  featureShade: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(11, 5, 14, 0.24)" },
  featureTopline: { padding: 12, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  liveTag: { paddingHorizontal: 9, paddingVertical: 6, borderRadius: 6, backgroundColor: "rgba(8,8,18,0.78)", flexDirection: "row", alignItems: "center", gap: 6 },
  liveText: { fontSize: 8, fontWeight: "800", color: C.paper, letterSpacing: 1 },
  favoriteButton: { position: "absolute", top: 6, right: 6, width: 33, height: 33, borderRadius: 8, backgroundColor: "rgba(8,8,18,0.72)", alignItems: "center", justifyContent: "center", zIndex: 2 },
  featureBottom: { position: "absolute", left: 15, right: 15, bottom: 14 },
  featureKicker: { color: C.jade, fontSize: 8, fontWeight: "800", letterSpacing: 1.6 },
  featureTitle: { color: C.paper, fontSize: 21, fontWeight: "900", marginTop: 3 },
  playCta: { flexDirection: "row", alignSelf: "flex-start", alignItems: "center", gap: 6, backgroundColor: C.gold, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 7, marginTop: 9 },
  playText: { color: C.ink, fontSize: 10, fontWeight: "900" },
  gameSectionHead: { marginTop: 20, marginBottom: 11, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  gameSectionTitle: { color: C.paper, fontSize: 14, fontWeight: "800" },
  gameCount: { color: C.muted, fontSize: 10 },
  gameGrid: { flexDirection: "row", flexWrap: "wrap", gap: 11 },
  gameTile: { width: "31.5%", minWidth: 96 },
  gameArt: { aspectRatio: 0.82, borderRadius: 8, overflow: "hidden", backgroundColor: C.panel2, borderWidth: 1.5, borderColor: "#279EFF" },
  gameArtShade: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(4,7,11,0.08)" },
  artFallback: { ...StyleSheet.absoluteFillObject, alignItems: "center", justifyContent: "center", backgroundColor: "#20142C" },
  gamePlay: { position: "absolute", right: 7, bottom: 7, width: 25, height: 25, borderRadius: 7, backgroundColor: C.gold, alignItems: "center", justifyContent: "center" },
  gameName: { color: "#DDE3DE", fontSize: 10, fontWeight: "700", marginTop: 6, marginBottom: 3 },
  skeletonRow: { flexDirection: "row", gap: 10 },
  skeletonCard: { flex: 1, aspectRatio: 0.78, borderRadius: 14, backgroundColor: "#182027", borderWidth: 1, borderColor: "#253139" },
  messagePanel: { padding: 19, borderRadius: 16, alignItems: "center", backgroundColor: C.panel, borderWidth: 1, borderColor: C.edge, gap: 7 },
  messageTitle: { color: C.paper, fontSize: 14, fontWeight: "800", textAlign: "center" },
  messageCopy: { color: C.muted, fontSize: 11, textAlign: "center", lineHeight: 17 },
  retryButton: { marginTop: 4, paddingHorizontal: 14, paddingVertical: 8, backgroundColor: C.jade, borderRadius: 16 },
  retryText: { color: C.ink, fontSize: 10, fontWeight: "800" },
  footer: { paddingTop: 26, alignItems: "center", gap: 8 },
  footerRule: { width: 56, height: 1, backgroundColor: "#34433E" },
  footerText: { color: "#70827C", fontSize: 8, letterSpacing: 2 },
});