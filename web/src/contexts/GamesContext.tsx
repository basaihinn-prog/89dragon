import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { Game, Category, fetchGames, fetchCategories, addToFavorites, removeFromFavorites, getFavorites } from '../services/api';
import { useAuth } from './AuthContext';

const GAMES_CACHE_KEY = 'jr_games_cache';
const FAVORITES_KEY = 'jr_favorites';

interface GamesContextType {
  games: Game[];
  categories: Category[];
  favorites: string[];
  isLoading: boolean;
  error: string | null;
  selectedCategory: string;
  setSelectedCategory: (cat: string) => void;
  toggleFavorite: (gameName: string) => void;
  getFilteredGames: () => Game[];
  refreshGames: () => Promise<void>;
  usingCache: boolean;
}

const GamesContext = createContext<GamesContextType | undefined>(undefined);

export function GamesProvider({ children }: { children: ReactNode }) {
  const { token } = useAuth();
  const [games, setGames] = useState<Game[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('hot');
  const [usingCache, setUsingCache] = useState(false);

  const loadGames = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    setError(null);
    try {
      const [gamesData, catsData] = await Promise.all([
        fetchGames(token),
        fetchCategories(token),
      ]);

      if (gamesData.length > 0) {
        setGames(gamesData);
        setUsingCache(false);
        localStorage.setItem(GAMES_CACHE_KEY, JSON.stringify(gamesData));
      } else {
        const cached = localStorage.getItem(GAMES_CACHE_KEY);
        if (cached) {
          setGames(JSON.parse(cached));
          setUsingCache(true);
        } else {
          setError('No games available');
        }
      }

      if (catsData.length > 0) setCategories(catsData);
    } catch {
      const cached = localStorage.getItem(GAMES_CACHE_KEY);
      if (cached) {
        setGames(JSON.parse(cached));
        setUsingCache(true);
      } else {
        setError('Failed to load games');
      }
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  const loadFavorites = useCallback(async () => {
    if (!token) return;
    const local = localStorage.getItem(FAVORITES_KEY);
    if (local) setFavorites(JSON.parse(local));
    try {
      const result = await getFavorites(token);
      if (result.success && result.data) {
        const favData = result.data as any;
        const favNames: string[] = Array.isArray(favData)
          ? favData.map((g: any) => g.name || g)
          : (favData.favorites || []).map((g: any) => g.name || g);
        setFavorites(favNames);
        localStorage.setItem(FAVORITES_KEY, JSON.stringify(favNames));
      }
    } catch {}
  }, [token]);

  useEffect(() => {
    if (token) {
      loadGames();
      loadFavorites();
    } else {
      setGames([]);
      setFavorites([]);
    }
  }, [token]);

  const toggleFavorite = useCallback(async (gameName: string) => {
    if (!token) return;
    const isFav = favorites.includes(gameName);
    const updated = isFav ? favorites.filter(n => n !== gameName) : [...favorites, gameName];
    setFavorites(updated);
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(updated));
    try {
      if (isFav) await removeFromFavorites(token, gameName);
      else await addToFavorites(token, gameName);
    } catch {}
  }, [token, favorites]);

  const getFilteredGames = useCallback((): Game[] => {
    if (selectedCategory === 'favorites') {
      return games.filter(g => favorites.includes(g.name));
    }
    if (selectedCategory === 'hot') {
      return [...games].sort((a, b) => (b.view || 0) - (a.view || 0));
    }
    if (selectedCategory === 'slots') {
      return games.filter(g => {
        const gb = (g.gamebank || '').toLowerCase();
        const title = (g.title || '').toLowerCase();
        return gb.includes('slot') || gb.includes('777') || title.includes('slot');
      });
    }
    if (selectedCategory === 'fishing') {
      return games.filter(g => {
        const gb = (g.gamebank || '').toLowerCase();
        const title = (g.title || '').toLowerCase();
        return gb.includes('fish') || gb.includes('hunt') || title.includes('fish');
      });
    }
    if (selectedCategory === 'arcade') {
      return games.filter(g => {
        const gb = (g.gamebank || '').toLowerCase();
        return gb.includes('arcade') || gb.includes('keno') || gb.includes('bingo');
      });
    }
    // Match by category title/slug
    const cat = categories.find(c =>
      c.slug === selectedCategory || c.title.toLowerCase() === selectedCategory.toLowerCase()
    );
    if (cat) {
      return games.filter(g => g.category_id === cat.id || g.categories?.includes(cat.slug));
    }
    return games;
  }, [games, favorites, selectedCategory, categories]);

  return (
    <GamesContext.Provider value={{
      games, categories, favorites, isLoading, error,
      selectedCategory, setSelectedCategory,
      toggleFavorite, getFilteredGames, refreshGames: loadGames, usingCache,
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
