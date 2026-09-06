import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from "@/contexts/AuthContext";
import { 
  fetchGames, 
  fetchCategories, 
  getFavorites, 
  addToFavorites, 
  removeFromFavorites,
  Game, 
  Category 
} from "@/services/api";

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
const MAX_FAVORITES = 100;
const CACHE_MAX_AGE_MS = 24 * 60 * 60 * 1000;

const FISHING_GAME_NAMES = [
  "bird_hunter",
  "bugs_paradise_100",
  "spongebob",
  "monster_frenzy",
  "king_kings_rampage",
  "buffalo_thunder",
  "master_of_the_deep",
  "fishermans_wharf",
  "KingKongRampageVP",
  "king_octopus",
  "one_shot_fishing",
];

const SLOT_GAME_NAMES = [
  "LeprechaunGoesWildPG",
  "HotSpinDeluxeISB",
  "WildApeISB",
  "AztecGoldMegawaysISB",
  "WolfMoonRisingBS",
  "CrystalBallGM",
  "BuffaloAT",
  "LostTreasureWD",
  "BigRedAT",
  "ChoySunDoaAT",
  "EggAndRoosterCT",
  "DragonRichesSW",
  "AztecGemsPM",
  "LuckyLeprechaunISB",
  "SilverFoxDX",
  "BankRaidGT",
  "ChristmasBigBassBonanza",
  "JokersJewelPM",
  "LeosTreasureMN",
  "WildRubiesGM",
  "JadeHeavenCT",
  "Lucky88AT",
  "TikiTorchAT",
  "PurpleHotPT",
  "ChristmasBellsJPPT",
  "piggie7",
  "goldrush",
  "bull_fiesta",
];

const TABLE_GAME_NAMES = [
  "deuces_wild",
  "bingo",
  "all_american",
  "last_blast_keno",
  "black_jack",
  "lucky_keno",
  "virtual_roulette",
  "joker_poker",
];

const BLOCKED_GAME_PATTERNS = [
  "joker slot",
  "jokerslot",
  "tropical vacation",
  "tropicalvacation",
  "40 mega slot",
  "40megaslot",
  "40_mega_slot",
  "vacation station",
  "vacationstation",
  "vacation_station",
];

function isBlockedGame(game: Game): boolean {
  const titleLower = (game.title || "").toLowerCase();
  const nameLower = (game.name || "").toLowerCase();
  
  return BLOCKED_GAME_PATTERNS.some(pattern => 
    titleLower.includes(pattern) || nameLower.includes(pattern)
  );
}

function filterBlockedGames(games: Game[]): Game[] {
  return games.filter(game => !isBlockedGame(game));
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

  useEffect(() => {
    loadLocalFavorites();
  }, []);

  useEffect(() => {
    if (isAuthenticated && token) {
      loadGames();
      syncFavoritesFromAPI();
    }
  }, [isAuthenticated, token]);

  async function loadLocalFavorites() {
    try {
      const stored = await AsyncStorage.getItem(FAVORITES_KEY);
      if (stored) {
        setFavorites(JSON.parse(stored));
      }
    } catch (error) {
      console.error("Error loading local favorites:", error);
    }
  }

  async function saveLocalFavorites(newFavorites: string[]) {
    try {
      await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(newFavorites));
    } catch (error) {
      console.error("Error saving local favorites:", error);
    }
  }

  async function syncFavoritesFromAPI() {
    if (!token) return;
    
    try {
      const result = await getFavorites(token);
      if (result.success && result.data) {
        const favoriteGames = Array.isArray(result.data) ? result.data : [];
        const favoriteNames = favoriteGames.map((game: Game) => game.name);
        setFavorites(favoriteNames);
        await saveLocalFavorites(favoriteNames);
      }
    } catch (error) {
      console.error("Error syncing favorites from API:", error);
    }
  }

  async function saveGamesToCache(gamesData: Game[], categoriesData: Category[]) {
    try {
      await AsyncStorage.setItem(GAMES_CACHE_KEY, JSON.stringify(gamesData));
      await AsyncStorage.setItem(CATEGORIES_CACHE_KEY, JSON.stringify(categoriesData));
      await AsyncStorage.setItem(CACHE_TIMESTAMP_KEY, Date.now().toString());
    } catch (error) {
      console.error("Error saving games to cache:", error);
    }
  }

  async function loadGamesFromCache(): Promise<{ games: Game[]; categories: Category[] } | null> {
    try {
      const [cachedGames, cachedCategories, cacheTimestamp] = await Promise.all([
        AsyncStorage.getItem(GAMES_CACHE_KEY),
        AsyncStorage.getItem(CATEGORIES_CACHE_KEY),
        AsyncStorage.getItem(CACHE_TIMESTAMP_KEY),
      ]);
      
      if (cacheTimestamp) {
        const age = Date.now() - parseInt(cacheTimestamp, 10);
        if (age > CACHE_MAX_AGE_MS) {
          await clearGamesCache();
          return null;
        }
      }
      
      if (cachedGames) {
        const games = JSON.parse(cachedGames);
        const categories = cachedCategories ? JSON.parse(cachedCategories) : [];
        return { games, categories };
      }
      return null;
    } catch (error) {
      console.error("Error loading games from cache:", error);
      return null;
    }
  }

  async function clearGamesCache(): Promise<void> {
    try {
      await Promise.all([
        AsyncStorage.removeItem(GAMES_CACHE_KEY),
        AsyncStorage.removeItem(CATEGORIES_CACHE_KEY),
        AsyncStorage.removeItem(CACHE_TIMESTAMP_KEY),
      ]);
    } catch (error) {
      console.error("Error clearing games cache:", error);
    }
  }

  async function loadGames() {
    setIsLoading(true);
    setError(null);
    setIsUsingCache(false);

    try {
      // Fetch categories first, then games
      const categoriesData = await fetchCategories(token);
      setCategories(categoriesData);
      
      const gamesData = await fetchGames(token);

      if (gamesData && gamesData.length > 0) {
        const filteredGames = filterBlockedGames(gamesData);
        setGames(filteredGames);
        setError(null);
        setIsUsingCache(false);
        await saveGamesToCache(filteredGames, categoriesData);
      } else {
        const cached = await loadGamesFromCache();
        if (cached && cached.games.length > 0) {
          setGames(cached.games);
          setCategories(cached.categories);
          setIsUsingCache(true);
        } else {
          setGames([]);
        }
        setError(null);
      }
    } catch (err: any) {
      setGames([]);
      setError("Unable to connect to server. Please check your connection and try again.");
    } finally {
      setIsLoading(false);
    }
  }

  async function refreshGames() {
    await loadGames();
    await syncFavoritesFromAPI();
  }

  const toggleFavorite = useCallback(async (gameName: string) => {
    const isCurrentlyFavorite = favorites.includes(gameName);
    
    let newFavorites = isCurrentlyFavorite
      ? favorites.filter((name) => name !== gameName)
      : [...favorites, gameName];
    
    if (newFavorites.length > MAX_FAVORITES) {
      newFavorites = newFavorites.slice(-MAX_FAVORITES);
    }

    setFavorites(newFavorites);
    saveLocalFavorites(newFavorites);

    if (token) {
      try {
        if (isCurrentlyFavorite) {
          await removeFromFavorites(token, gameName);
        } else {
          await addToFavorites(token, gameName);
        }
      } catch (error) {
        console.error("Error syncing favorite to API:", error);
        setFavorites(favorites);
        saveLocalFavorites(favorites);
      }
    }
  }, [favorites, token]);

  const isFavorite = useCallback((gameName: string): boolean => {
    return favorites.includes(gameName);
  }, [favorites]);

  const getFilteredGames = useCallback((): Game[] => {
    let filtered: Game[] = [];
    
    const gameMatchesList = (game: Game, gameNames: string[]): boolean => {
      const gameName = (game.name || "").toLowerCase().replace(/[_\-\s]/g, "");
      const gameTitle = (game.title || "").toLowerCase().replace(/[_\-\s]/g, "");
      
      return gameNames.some(name => {
        const normalizedSearchName = name.toLowerCase().replace(/[_\-\s]/g, "");
        return gameName === normalizedSearchName || 
               gameTitle === normalizedSearchName ||
               gameName.includes(normalizedSearchName) ||
               gameTitle.includes(normalizedSearchName);
      });
    };
    
    const matchesGamebank = (game: Game, patterns: string[]): boolean => {
      const gamebank = (game.gamebank || "").toLowerCase();
      const gameName = (game.name || "").toLowerCase();
      const gameTitle = (game.title || "").toLowerCase();
      
      return patterns.some(pattern => 
        gamebank.includes(pattern) || 
        gameName.includes(pattern) || 
        gameTitle.includes(pattern)
      );
    };
    
    switch (selectedCategory) {
      case "slots": {
        filtered = games.filter((game) => {
          const matchesSlotBank = matchesGamebank(game, ["slot", "slots"]);
          const matchesSlotList = gameMatchesList(game, SLOT_GAME_NAMES);
          const notFishOrTable = !matchesGamebank(game, ["fish", "fishing", "table", "card", "poker", "keno", "bingo", "roulette", "blackjack", "black_jack"]);
          return matchesSlotList || (matchesSlotBank && notFishOrTable);
        });
        break;
      }
      case "fish": {
        filtered = games.filter((game) => {
          const matchesFishList = gameMatchesList(game, FISHING_GAME_NAMES);
          if (matchesFishList) return true;
          const gameCategories = game.categories || [];
          const hasFishCategory = gameCategories.includes("44") || gameCategories.includes("fishing");
          if (hasFishCategory) return true;
          return false;
        });
        break;
      }
      case "tables": {
        filtered = games.filter((game) => {
          const matchesTableList = gameMatchesList(game, TABLE_GAME_NAMES);
          if (matchesTableList) return true;
          const gameCategories = game.categories || [];
          const hasTableCategory = gameCategories.includes("45") || gameCategories.includes("table-games");
          if (hasTableCategory) return true;
          return false;
        });
        break;
      }
      case "favorites":
        filtered = games.filter((game) => favorites.includes(game.name));
        break;
      case "bonus":
        filtered = [...games].sort((a, b) => (b.view || 0) - (a.view || 0));
        break;
      default:
        filtered = games;
    }
    
    const getBaseGameName = (name: string): string => {
      const suffixes = ['GTM', 'GT', 'VP', 'EGT', 'ISB', 'AM', 'M'];
      let baseName = name.toLowerCase();
      for (const suffix of suffixes) {
        if (baseName.endsWith(suffix.toLowerCase())) {
          baseName = baseName.slice(0, -suffix.length);
          break;
        }
      }
      return baseName;
    };
    
    const seen = new Set<string>();
    const deduplicated = filtered.filter(game => {
      const baseName = getBaseGameName(game.name);
      if (seen.has(baseName)) {
        return false;
      }
      seen.add(baseName);
      return true;
    });
    
    return deduplicated;
  }, [games, favorites, selectedCategory]);

  return (
    <GamesContext.Provider
      value={{
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
      }}
    >
      {children}
    </GamesContext.Provider>
  );
}

export function useGames() {
  const context = useContext(GamesContext);
  if (context === undefined) {
    throw new Error("useGames must be used within a GamesProvider");
  }
  return context;
}
