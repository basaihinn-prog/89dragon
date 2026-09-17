import React, { createContext, useCallback, useContext, useEffect, useState, ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { useAuth } from "@/contexts/AuthContext";
import { addToFavorites, getFavorites, removeFromFavorites } from "@/services/api";
import type { Category, Game } from "@/services/api";
import { fetchAllCategories, fetchAllGames } from "@/services/gameApi";

export type CategoryFilter = "slots" | "fish" | "tables" | "favorites" | "bonus";

interface GamesContextType {
  games: Game[];
  categories: Category[];
  favorites: string[];
  isLoading: boolean;
  error: string | null;
  isUsingCache: boolean;
  selectedCategory: CategoryFilter;
  setSelectedCategory: (category: CategoryFilter) => void;
  toggleFavorite: (gameName: string) => Promise<void>;
  isFavorite: (gameName: string) => boolean;
  getFilteredGames: () => Game[];
  refreshGames: () => Promise<void>;
}

const GamesContext = createContext<GamesContextType | undefined>(undefined);

const FAVORITES_KEY = "favorite_games";
const GAMES_CACHE_KEY = "cached_games";
const CATEGORIES_CACHE_KEY = "cached_categories";
const CACHE_TIMESTAMP_KEY = "games_cache_timestamp";
const CACHE_MAX_AGE_MS = 2 * 60 * 60 * 1000;
const MAX_FAVORITES = 100;

function normalize(value: string | undefined | null): string {
  return (value || "").trim().toLowerCase().replace(/[_\s]+/g, "-");
}

function categoryAliases(filter: CategoryFilter): string[] {
  switch (filter) {
    case "slots":
      return ["slot", "slots", "slot-games"];
    case "fish":
      return ["fish", "fishing", "fishing-games"];
    case "tables":
      return ["table", "tables", "table-games", "card", "cards"];
    default:
      return [];
  }
}

function gameMatchesCategory(game: Game, category: Category, filter: CategoryFilter): boolean {
  const ids = new Set((game.categories || []).map(String));
  const slug = normalize(category.slug);
  const title = normalize(category.title);
  const aliases = categoryAliases(filter);

  const categoryMatches = aliases.some((alias) => slug.includes(alias) || title.includes(alias));
  if (!categoryMatches) return false;

  return ids.has(String(category.id)) || ids.has(category.slug) || ids.has(slug);
}

function fallbackGamebankMatch(game: Game, filter: CategoryFilter): boolean {
  const text = `${game.gamebank || ""} ${game.name || ""} ${game.title || ""}`.toLowerCase();
  if (filter === "slots") return /slot|777/.test(text) && !/fish|fishing|roulette|blackjack|poker|keno|bingo/.test(text);
  if (filter === "fish") return /fish|fishing|hunter|shoot/.test(text);
  if (filter === "tables") return /table|card|roulette|blackjack|poker|keno|bingo/.test(text);
  return true;
}

export function GamesProvider({ children }: { children: ReactNode }) {
  const { token, isAuthenticated } = useAuth();
  const [games, setGames] = useState<Game[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isUsingCache, setIsUsingCache] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>("slots");

  const saveCache = useCallback(async (gamesData: Game[], categoriesData: Category[]) => {
    await Promise.all([
      AsyncStorage.setItem(GAMES_CACHE_KEY, JSON.stringify(gamesData)),
      AsyncStorage.setItem(CATEGORIES_CACHE_KEY, JSON.stringify(categoriesData)),
      AsyncStorage.setItem(CACHE_TIMESTAMP_KEY, String(Date.now())),
    ]);
  }, []);

  const loadCache = useCallback(async (): Promise<{ games: Game[]; categories: Category[] } | null> => {
    try {
      const [gamesJson, categoriesJson, timestamp] = await Promise.all([
        AsyncStorage.getItem(GAMES_CACHE_KEY),
        AsyncStorage.getItem(CATEGORIES_CACHE_KEY),
        AsyncStorage.getItem(CACHE_TIMESTAMP_KEY),
      ]);

      if (!gamesJson || !timestamp || Date.now() - Number(timestamp) > CACHE_MAX_AGE_MS) return null;
      return {
        games: JSON.parse(gamesJson),
        categories: categoriesJson ? JSON.parse(categoriesJson) : [],
      };
    } catch {
      return null;
    }
  }, []);

  const syncFavoritesFromAPI = useCallback(async () => {
    if (!token) return;
    try {
      const result = await getFavorites(token);
      if (result.success && result.data) {
        const rows = Array.isArray(result.data) ? result.data : [];
        const names = rows.map((row: any) => typeof row === "string" ? row : row.name).filter(Boolean);
        setFavorites(names);
        await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(names));
      }
    } catch {}
  }, [token]);

  const loadGames = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    setError(null);
    setIsUsingCache(false);

    try {
      const [gamesData, categoriesData] = await Promise.all([
        fetchAllGames(token),
        fetchAllCategories(token),
      ]);

      setGames(gamesData);
      setCategories(categoriesData);
      setIsUsingCache(false);
      await saveCache(gamesData, categoriesData);
    } catch (err: any) {
      const cached = await loadCache();
      if (cached) {
        setGames(cached.games);
        setCategories(cached.categories);
        setIsUsingCache(true);
        setError(null);
      } else {
        setGames([]);
        setCategories([]);
        setError(err?.message || "Unable to load games.");
      }
    } finally {
      setIsLoading(false);
    }
  }, [loadCache, saveCache, token]);

  useEffect(() => {
    AsyncStorage.getItem(FAVORITES_KEY)
      .then((value) => {
        if (value) setFavorites(JSON.parse(value));
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (isAuthenticated && token) {
      loadGames();
      syncFavoritesFromAPI();
    } else {
      setGames([]);
      setCategories([]);
      setFavorites([]);
    }
  }, [isAuthenticated, token, loadGames, syncFavoritesFromAPI]);

  const refreshGames = useCallback(async () => {
    await Promise.all([loadGames(), syncFavoritesFromAPI()]);
  }, [loadGames, syncFavoritesFromAPI]);

  const toggleFavorite = useCallback(async (gameName: string) => {
    const wasFavorite = favorites.includes(gameName);
    let next = wasFavorite ? favorites.filter((name) => name !== gameName) : [...favorites, gameName];
    if (next.length > MAX_FAVORITES) next = next.slice(-MAX_FAVORITES);

    setFavorites(next);
    await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(next));

    if (!token) return;

    const result = wasFavorite
      ? await removeFromFavorites(token, gameName)
      : await addToFavorites(token, gameName);

    if (!result.success) {
      setFavorites(favorites);
      await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
      throw new Error(result.error || "Unable to update favorite");
    }
  }, [favorites, token]);

  const isFavorite = useCallback((gameName: string) => favorites.includes(gameName), [favorites]);

  const getFilteredGames = useCallback((): Game[] => {
    if (selectedCategory === "favorites") {
      return games.filter((game) => favorites.includes(game.name));
    }

    if (selectedCategory === "bonus") {
      return [...games].sort((a, b) => (b.view || 0) - (a.view || 0));
    }

    const matchingCategories = categories.filter((category) => {
      const slug = normalize(category.slug);
      const title = normalize(category.title);
      return categoryAliases(selectedCategory).some((alias) => slug.includes(alias) || title.includes(alias));
    });

    if (matchingCategories.length > 0) {
      const filtered = games.filter((game) => matchingCategories.some((category) => gameMatchesCategory(game, category, selectedCategory)));
      if (filtered.length > 0) return filtered;
    }

    return games.filter((game) => fallbackGamebankMatch(game, selectedCategory));
  }, [categories, favorites, games, selectedCategory]);

  return (
    <GamesContext.Provider value={{
      games,
      categories,
      favorites,
      isLoading,
      error,
      isUsingCache,
      selectedCategory,
      setSelectedCategory,
      toggleFavorite,
      isFavorite,
      getFilteredGames,
      refreshGames,
    }}>
      {children}
    </GamesContext.Provider>
  );
}

export function useGames() {
  const context = useContext(GamesContext);
  if (!context) throw new Error("useGames must be used within a GamesProvider");
  return context;
}
