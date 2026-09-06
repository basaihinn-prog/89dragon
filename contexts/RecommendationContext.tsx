import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from "@/contexts/AuthContext";
import { useGames } from "@/contexts/GamesContext";
import { Game, getGameActivity, GameActivity } from "@/services/api";

interface PlaySession {
  gameName: string;
  gamebank: string;
  playedAt: number;
  duration: number;
  bet?: number;
  win?: number;
}

interface GamePreferences {
  favoriteCategories: Record<string, number>;
  recentlyPlayed: string[];
  playFrequency: Record<string, number>;
  lastPlayed: Record<string, number>;
  totalPlayTime: Record<string, number>;
  winRate: Record<string, { wins: number; plays: number }>;
}

interface RecommendationScore {
  game: Game;
  score: number;
  reasons: string[];
}

interface RecommendationContextType {
  recommendations: Game[];
  trendingGames: Game[];
  recentlyPlayedGames: Game[];
  isLoading: boolean;
  recordGameSession: (game: Game, duration: number, bet?: number, win?: number) => Promise<void>;
  refreshRecommendations: () => Promise<void>;
  getRecommendationReasons: (gameName: string) => string[];
}

const RecommendationContext = createContext<RecommendationContextType | undefined>(undefined);

const PLAY_HISTORY_KEY = "game_play_history";
const PREFERENCES_KEY = "game_preferences";
const MAX_RECENTLY_PLAYED = 10;
const MAX_RECOMMENDATIONS = 12;

export function RecommendationProvider({ children }: { children: ReactNode }) {
  const { token, user, isAuthenticated } = useAuth();
  const { games, favorites, categories } = useGames();
  const [playHistory, setPlayHistory] = useState<PlaySession[]>([]);
  const [preferences, setPreferences] = useState<GamePreferences>({
    favoriteCategories: {},
    recentlyPlayed: [],
    playFrequency: {},
    lastPlayed: {},
    totalPlayTime: {},
    winRate: {},
  });
  const [recommendations, setRecommendations] = useState<Game[]>([]);
  const [recommendationScores, setRecommendationScores] = useState<RecommendationScore[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      loadStoredData();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated && games.length > 0) {
      generateRecommendations();
    }
  }, [games, favorites, preferences, isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated && token) {
      syncFromAPI();
    }
  }, [isAuthenticated, token]);

  async function loadStoredData() {
    try {
      const [historyData, prefsData] = await Promise.all([
        AsyncStorage.getItem(PLAY_HISTORY_KEY),
        AsyncStorage.getItem(PREFERENCES_KEY),
      ]);

      if (historyData) {
        setPlayHistory(JSON.parse(historyData));
      }
      if (prefsData) {
        setPreferences(JSON.parse(prefsData));
      }
    } catch (error) {
      console.error("Error loading recommendation data:", error);
    }
  }

  async function syncFromAPI() {
    if (!token) return;

    try {
      const result = await getGameActivity(token);
      if (result.success && result.data?.activity) {
        const apiActivity = result.data.activity;
        updatePreferencesFromActivity(apiActivity);
      }
    } catch (error) {
      console.error("Error syncing game activity:", error);
    }
  }

  function updatePreferencesFromActivity(activity: GameActivity[]) {
    const newPlayFrequency: Record<string, number> = { ...preferences.playFrequency };
    const newWinRate: Record<string, { wins: number; plays: number }> = { ...preferences.winRate };

    activity.forEach((session) => {
      const gameName = session.game;
      newPlayFrequency[gameName] = (newPlayFrequency[gameName] || 0) + 1;

      if (!newWinRate[gameName]) {
        newWinRate[gameName] = { wins: 0, plays: 0 };
      }
      newWinRate[gameName].plays += 1;

      const win = parseFloat(session.win) || 0;
      const bet = parseFloat(session.bet) || 0;
      if (win > bet) {
        newWinRate[gameName].wins += 1;
      }
    });

    setPreferences((prev) => ({
      ...prev,
      playFrequency: newPlayFrequency,
      winRate: newWinRate,
    }));
  }

  async function saveData(history: PlaySession[], prefs: GamePreferences) {
    try {
      await Promise.all([
        AsyncStorage.setItem(PLAY_HISTORY_KEY, JSON.stringify(history)),
        AsyncStorage.setItem(PREFERENCES_KEY, JSON.stringify(prefs)),
      ]);
    } catch (error) {
      console.error("Error saving recommendation data:", error);
    }
  }

  const recordGameSession = useCallback(
    async (game: Game, duration: number, bet?: number, win?: number) => {
      const session: PlaySession = {
        gameName: game.name,
        gamebank: game.gamebank || "unknown",
        playedAt: Date.now(),
        duration,
        bet,
        win,
      };

      const newHistory = [session, ...playHistory].slice(0, 100);
      setPlayHistory(newHistory);

      const newPrefs = { ...preferences };

      newPrefs.favoriteCategories[game.gamebank] =
        (newPrefs.favoriteCategories[game.gamebank] || 0) + 1;

      newPrefs.recentlyPlayed = [
        game.name,
        ...newPrefs.recentlyPlayed.filter((n) => n !== game.name),
      ].slice(0, MAX_RECENTLY_PLAYED);

      newPrefs.playFrequency[game.name] = (newPrefs.playFrequency[game.name] || 0) + 1;

      newPrefs.lastPlayed[game.name] = Date.now();

      newPrefs.totalPlayTime[game.name] =
        (newPrefs.totalPlayTime[game.name] || 0) + duration;

      if (!newPrefs.winRate[game.name]) {
        newPrefs.winRate[game.name] = { wins: 0, plays: 0 };
      }
      newPrefs.winRate[game.name].plays += 1;
      if (win && bet && win > bet) {
        newPrefs.winRate[game.name].wins += 1;
      }

      setPreferences(newPrefs);
      await saveData(newHistory, newPrefs);
    },
    [playHistory, preferences]
  );

  function getGameCategory(game: Game): string {
    const bank = game.gamebank?.toLowerCase() || "";
    const name = game.name.toLowerCase();

    if (bank.includes("slot") || name.includes("slot")) return "slots";
    if (bank.includes("fish") || bank === "fishing") return "fish";
    if (
      bank.includes("table") ||
      name.includes("poker") ||
      name.includes("bingo") ||
      name.includes("keno") ||
      name.includes("roulette") ||
      name.includes("blackjack") ||
      name.includes("black_jack")
    ) {
      return "tables";
    }
    return bank || "other";
  }

  function calculateSimilarityScore(gameA: Game, gameB: Game): number {
    let score = 0;

    if (getGameCategory(gameA) === getGameCategory(gameB)) {
      score += 30;
    }

    if (gameA.gamebank === gameB.gamebank) {
      score += 20;
    }

    if (gameA.orientation === gameB.orientation) {
      score += 10;
    }

    const aWords = gameA.title.toLowerCase().split(/\s+/);
    const bWords = gameB.title.toLowerCase().split(/\s+/);
    const commonWords = aWords.filter((w) => bWords.includes(w) && w.length > 3);
    score += commonWords.length * 5;

    return score;
  }

  function generateRecommendations() {
    if (games.length === 0) return;

    setIsLoading(true);

    const scores: RecommendationScore[] = [];

    const favoriteCategoryRanking = Object.entries(preferences.favoriteCategories)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([cat]) => cat);

    const recentGames = preferences.recentlyPlayed
      .map((name) => games.find((g) => g.name === name))
      .filter(Boolean) as Game[];

    const playedGameNames = new Set([
      ...preferences.recentlyPlayed,
      ...Object.keys(preferences.playFrequency),
    ]);

    games.forEach((game) => {
      if (playedGameNames.has(game.name) && preferences.recentlyPlayed.includes(game.name)) {
        return;
      }

      let score = 0;
      const reasons: string[] = [];

      const category = getGameCategory(game);
      const categoryIndex = favoriteCategoryRanking.indexOf(game.gamebank);
      if (categoryIndex !== -1) {
        const categoryBoost = (3 - categoryIndex) * 20;
        score += categoryBoost;
        reasons.push(`Based on your love for ${category} games`);
      }

      if (favorites.includes(game.name)) {
        score += 50;
        reasons.push("In your favorites");
      }

      let maxSimilarity = 0;
      let mostSimilarGame: Game | null = null;
      recentGames.forEach((recentGame) => {
        const similarity = calculateSimilarityScore(game, recentGame);
        if (similarity > maxSimilarity) {
          maxSimilarity = similarity;
          mostSimilarGame = recentGame;
        }
      });

      if (maxSimilarity > 30 && mostSimilarGame) {
        score += maxSimilarity;
        reasons.push(`Similar to ${(mostSimilarGame as Game).title}`);
      }

      const playCount = preferences.playFrequency[game.name] || 0;
      if (playCount > 0) {
        score += Math.min(playCount * 5, 25);
        reasons.push("You've enjoyed this before");
      }

      const winRateData = preferences.winRate[game.name];
      if (winRateData && winRateData.plays > 0) {
        const winRate = winRateData.wins / winRateData.plays;
        if (winRate > 0.5) {
          score += 15;
          reasons.push("Good luck game");
        }
      }

      if (game.view && game.view > 100) {
        score += Math.min(game.view / 50, 15);
        reasons.push("Popular choice");
      }

      if (!playedGameNames.has(game.name) && favoriteCategoryRanking.includes(game.gamebank)) {
        score += 10;
        reasons.push("New game to try");
      }

      if (score > 0 || reasons.length === 0) {
        const defaultReason = `Recommended ${category} game`;
        scores.push({
          game,
          score: score || Math.random() * 10,
          reasons: reasons.length > 0 ? reasons : [defaultReason],
        });
      }
    });

    scores.sort((a, b) => b.score - a.score);

    const topRecommendations = scores.slice(0, MAX_RECOMMENDATIONS);

    setRecommendationScores(topRecommendations);
    setRecommendations(topRecommendations.map((r) => r.game));
    setIsLoading(false);
  }

  const refreshRecommendations = useCallback(async () => {
    setIsLoading(true);
    await syncFromAPI();
    generateRecommendations();
  }, [token, games, favorites]);

  const getRecommendationReasons = useCallback(
    (gameName: string): string[] => {
      const scoreData = recommendationScores.find((r) => r.game.name === gameName);
      return scoreData?.reasons || [];
    },
    [recommendationScores]
  );

  const trendingGames = useMemo(() => {
    return [...games]
      .filter((g) => g.view && g.view > 0)
      .sort((a, b) => (b.view || 0) - (a.view || 0))
      .slice(0, 10);
  }, [games]);

  const recentlyPlayedGames = useMemo(() => {
    return preferences.recentlyPlayed
      .map((name) => games.find((g) => g.name === name))
      .filter(Boolean) as Game[];
  }, [preferences.recentlyPlayed, games]);

  return (
    <RecommendationContext.Provider
      value={{
        recommendations,
        trendingGames,
        recentlyPlayedGames,
        isLoading,
        recordGameSession,
        refreshRecommendations,
        getRecommendationReasons,
      }}
    >
      {children}
    </RecommendationContext.Provider>
  );
}

export function useRecommendations() {
  const context = useContext(RecommendationContext);
  if (context === undefined) {
    throw new Error("useRecommendations must be used within a RecommendationProvider");
  }
  return context;
}
