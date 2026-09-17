import React, { createContext, useCallback, useContext, useEffect, useState, ReactNode } from 'react';
import { addToFavorites, getFavorites, removeFromFavorites } from '../services/api';
import type { Category, Game } from '../services/api';
import { fetchAllCategories, fetchAllGames } from '../services/gameApi';
import { useAuth } from './AuthContext';

const GAMES_CACHE_KEY = 'jr_games_cache';
const CATEGORIES_CACHE_KEY = 'jr_categories_cache';
const CACHE_TIMESTAMP_KEY = 'jr_games_cache_timestamp';
const FAVORITES_KEY = 'jr_favorites';
const CACHE_MAX_AGE_MS = 2 * 60 * 60 * 1000;

interface GamesContextType {
  games: Game[];
  categories: Category[];
  favorites: string[];
  isLoading: boolean;
  error: string | null;
  selectedCategory: string;
  setSelectedCategory: (cat: string) => void;
  toggleFavorite: (gameName: string) => Promise<void>;
  getFilteredGames: () => Game[];
  refreshGames: () => Promise<void>;
  usingCache: boolean;
}

const GamesContext = createContext<GamesContextType | undefined>(undefined);

function normalize(value: string | undefined | null): string {
  return (value || '').trim().toLowerCase().replace(/[_\s]+/g, '-');
}

function aliasesFor(selected: string): string[] {
  const value = normalize(selected);
  if (value === 'slots' || value === 'slot') return ['slot', 'slots', 'slot-games'];
  if (value === 'fishing' || value === 'fish') return ['fish', 'fishing', 'fishing-games'];
  if (value === 'tables' || value === 'table') return ['table', 'tables', 'table-games', 'card', 'cards'];
  return [value];
}

function fallbackMatch(game: Game, selected: string): boolean {
  const value = normalize(selected);
  const text = `${game.gamebank || ''} ${game.name || ''} ${game.title || ''}`.toLowerCase();
  if (value === 'slots' || value === 'slot') return /slot|777/.test(text) && !/fish|roulette|blackjack|poker|keno|bingo/.test(text);
  if (value === 'fishing' || value === 'fish') return /fish|fishing|hunter|shoot/.test(text);
  if (value === 'tables' || value === 'table') return /table|card|roulette|blackjack|poker|keno|bingo/.test(text);
  if (value === 'arcade') return /arcade|keno|bingo/.test(text);
  return true;
}

export function GamesProvider({ children }: { children: ReactNode }) {
  const { token } = useAuth();
  const [games, setGames] = useState<Game[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('hot');
  const [usingCache, setUsingCache] = useState(false);

  const loadCache = useCallback((): { games: Game[]; categories: Category[] } | null => {
    try {
      const timestamp = Number(localStorage.getItem(CACHE_TIMESTAMP_KEY) || 0);
      if (!timestamp || Date.now() - timestamp > CACHE_MAX_AGE_MS) return null;
      const gamesJson = localStorage.getItem(GAMES_CACHE_KEY);
      if (!gamesJson) return null;
      return {
        games: JSON.parse(gamesJson),
        categories: JSON.parse(localStorage.getItem(CATEGORIES_CACHE_KEY) || '[]'),
      };
    } catch {
      return null;
    }
  }, []);

  const saveCache = useCallback((gameRows: Game[], categoryRows: Category[]) => {
    localStorage.setItem(GAMES_CACHE_KEY, JSON.stringify(gameRows));
    localStorage.setItem(CATEGORIES_CACHE_KEY, JSON.stringify(categoryRows));
    localStorage.setItem(CACHE_TIMESTAMP_KEY, String(Date.now()));
  }, []);

  const loadGames = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    setError(null);
    setUsingCache(false);

    try {
      const [gameRows, categoryRows] = await Promise.all([
        fetchAllGames(token),
        fetchAllCategories(token),
      ]);
      setGames(gameRows);
      setCategories(categoryRows);
      saveCache(gameRows, categoryRows);
    } catch (err: any) {
      const cached = loadCache();
      if (cached) {
        setGames(cached.games);
        setCategories(cached.categories);
        setUsingCache(true);
      } else {
        setGames([]);
        setCategories([]);
        setError(err?.message || 'Failed to load games');
      }
    } finally {
      setIsLoading(false);
    }
  }, [loadCache, saveCache, token]);

  const loadFavorites = useCallback(async () => {
    if (!token) return;
    const local = localStorage.getItem(FAVORITES_KEY);
    if (local) {
      try { setFavorites(JSON.parse(local)); } catch {}
    }

    try {
      const result = await getFavorites(token);
      if (result.success && result.data) {
        const rows = Array.isArray(result.data) ? result.data : [];
        const names = rows.map((row: any) => typeof row === 'string' ? row : row.name).filter(Boolean);
        setFavorites(names);
        localStorage.setItem(FAVORITES_KEY, JSON.stringify(names));
      }
    } catch {}
  }, [token]);

  useEffect(() => {
    if (token) {
      loadGames();
      loadFavorites();
    } else {
      setGames([]);
      setCategories([]);
      setFavorites([]);
    }
  }, [token, loadGames, loadFavorites]);

  const toggleFavorite = useCallback(async (gameName: string) => {
    if (!token) return;
    const wasFavorite = favorites.includes(gameName);
    const next = wasFavorite ? favorites.filter((name) => name !== gameName) : [...favorites, gameName];

    setFavorites(next);
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(next));

    const result = wasFavorite
      ? await removeFromFavorites(token, gameName)
      : await addToFavorites(token, gameName);

    if (!result.success) {
      setFavorites(favorites);
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
      throw new Error(result.error || 'Unable to update favorite');
    }
  }, [favorites, token]);

  const getFilteredGames = useCallback((): Game[] => {
    const selected = normalize(selectedCategory);
    if (selected === 'favorites') return games.filter((game) => favorites.includes(game.name));
    if (selected === 'hot' || selected === 'bonus') return [...games].sort((a, b) => (b.view || 0) - (a.view || 0));

    const aliases = aliasesFor(selectedCategory);
    const matchingCategories = categories.filter((category) => {
      const slug = normalize(category.slug);
      const title = normalize(category.title);
      return aliases.some((alias) => slug.includes(alias) || title.includes(alias));
    });

    if (matchingCategories.length > 0) {
      const ids = new Set(matchingCategories.map((category) => String(category.id)));
      const slugs = new Set(matchingCategories.map((category) => normalize(category.slug)));
      const filtered = games.filter((game) => {
        const gameCategories = (game.categories || []).map((item) => normalize(String(item)));
        return gameCategories.some((item) => ids.has(item) || slugs.has(item));
      });
      if (filtered.length > 0) return filtered;
    }

    const exactCategory = categories.find((category) => normalize(category.slug) === selected || normalize(category.title) === selected);
    if (exactCategory) {
      const filtered = games.filter((game) => (game.categories || []).map(String).includes(String(exactCategory.id)) || (game.categories || []).map(normalize).includes(normalize(exactCategory.slug)));
      if (filtered.length > 0) return filtered;
    }

    return games.filter((game) => fallbackMatch(game, selectedCategory));
  }, [categories, favorites, games, selectedCategory]);

  const refreshGames = useCallback(async () => {
    await Promise.all([loadGames(), loadFavorites()]);
  }, [loadGames, loadFavorites]);

  return (
    <GamesContext.Provider value={{
      games,
      categories,
      favorites,
      isLoading,
      error,
      selectedCategory,
      setSelectedCategory,
      toggleFavorite,
      getFilteredGames,
      refreshGames,
      usingCache,
    }}>
      {children}
    </GamesContext.Provider>
  );
}

export function useGames() {
  const ctx = useContext(GamesContext);
  if (!ctx) throw new Error('useGames must be used within GamesProvider');
  return ctx;
}
