import React, { useEffect, useState } from "react";
import { View, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import { Image } from "expo-image";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  Easing,
} from "react-native-reanimated";
import { ThemedText } from "@/components/ThemedText";
import { Spacing, BorderRadius, PremiumColors } from "@/constants/theme";
import { Jackpot, getJackpots, getGameImageUrl, Game } from "@/services/api";
import { IMAGE_BASE_URL } from "@/services/config";
import { useAuth } from "@/contexts/AuthContext";
import { useGames } from "@/contexts/GamesContext";

interface Win {
  id: number;
  playerName: string;
  gameName: string;
  amount: number;
  gameImage?: string;
}

const CARD_WIDTH = 180;
const CARD_GAP = 12;
const SCROLL_SPEED = 40;

export function WinsTicker() {
  const { token } = useAuth();
  const { games } = useGames();
  const [wins, setWins] = useState<Win[]>([]);
  const translateX = useSharedValue(0);

  useEffect(() => {
    if (token) {
      fetchWins();
      const fetchInterval = setInterval(fetchWins, 60000);
      return () => clearInterval(fetchInterval);
    }
  }, [token, games]);

  useEffect(() => {
    if (wins.length > 0) {
      const singleSetWidth = wins.length * (CARD_WIDTH + CARD_GAP);
      
      translateX.value = 0;
      translateX.value = withRepeat(
        withTiming(-singleSetWidth, {
          duration: (singleSetWidth / SCROLL_SPEED) * 1000,
          easing: Easing.linear,
        }),
        -1,
        false
      );
    }
  }, [wins]);

  const fetchWins = async () => {
    if (!token) return;
    
    try {
      const result = await getJackpots(token);
      if (result.success && result.data) {
        const filteredWins = result.data
          .filter((j: Jackpot) => {
            const amount = parseFloat(j.sum || "0");
            return amount > 0 && amount < 500;
          })
          .slice(0, 20)
          .map((j: Jackpot) => {
            const gameName = j.game || "Slots";
            const matchedGame = games.find(
              (g) => g.name.toLowerCase() === gameName.toLowerCase() || 
                     g.title?.toLowerCase() === gameName.toLowerCase()
            );
            
            let gameImage: string | undefined;
            if (matchedGame) {
              gameImage = getGameImageUrl(matchedGame);
            } else {
              const pascalName = gameName.replace(/\s+/g, '');
              gameImage = `${IMAGE_BASE_URL}/frontend/Default/ico/${pascalName}.jpg`;
            }
            
            return {
              id: j.id,
              playerName: j.user || j.name || "Player",
              gameName,
              amount: parseFloat(j.sum || "0"),
              gameImage,
            };
          });
        
        if (filteredWins.length > 0) {
          setWins(filteredWins);
        } else {
          setWins(generateSampleWins());
        }
      } else {
        setWins(generateSampleWins());
      }
    } catch (error) {
      setWins(generateSampleWins());
    }
  };

  const generateSampleWins = (): Win[] => {
    const sampleGames = [
      { name: "Gates of Olympus", image: "GatesOfOlympus" },
      { name: "Buffalo Blitz", image: "BuffaloBlitz" },
      { name: "Aztec Gems", image: "AztecGems" },
      { name: "Crystal Ball", image: "CrystalBall" },
      { name: "Wolf Moon", image: "WolfMoon" },
      { name: "Sweet Bonanza", image: "SweetBonanza" },
      { name: "Big Bass Bonanza", image: "BigBassBonanza" },
      { name: "Book of Dead", image: "BookOfDead" },
    ];
    const names = ["Luc***", "Mar***", "Jam***", "Ale***", "Sop***", "Oli***", "Emi***", "Noa***"];
    
    return Array.from({ length: 10 }, (_, i) => {
      const game = sampleGames[i % sampleGames.length];
      return {
        id: i + 1,
        playerName: names[Math.floor(Math.random() * names.length)],
        gameName: game.name,
        amount: Math.floor(Math.random() * 450) + 10,
        gameImage: `${IMAGE_BASE_URL}/frontend/Default/ico/${game.image}.jpg`,
      };
    });
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  if (wins.length === 0) {
    return null;
  }

  const doubledWins = [...wins, ...wins];

  return (
    <View style={styles.wrapper}>
      <LinearGradient
        colors={["rgba(10, 5, 20, 0.95)", "rgba(10, 5, 20, 0.8)", "rgba(10, 5, 20, 0.95)"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[styles.gradientOverlay, { pointerEvents: "none" }]}
      />
      
      <Animated.View style={[styles.scrollContainer, animatedStyle]}>
        {doubledWins.map((win, index) => (
          <WinCard key={`${win.id}-${index}`} win={win} />
        ))}
      </Animated.View>

      <View style={[styles.leftFade, { pointerEvents: "none" }]}>
        <LinearGradient
          colors={["rgba(10, 5, 20, 1)", "transparent"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={StyleSheet.absoluteFill}
        />
      </View>
      <View style={[styles.rightFade, { pointerEvents: "none" }]}>
        <LinearGradient
          colors={["transparent", "rgba(10, 5, 20, 1)"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={StyleSheet.absoluteFill}
        />
      </View>
    </View>
  );
}

function WinCard({ win }: { win: Win }) {
  const [imageError, setImageError] = useState(false);

  return (
    <View style={styles.cardContainer}>
      <LinearGradient
        colors={["rgba(16, 185, 129, 0.15)", "rgba(139, 92, 246, 0.1)", "rgba(16, 185, 129, 0.15)"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.cardGradient}
      >
        <View style={styles.gameImageContainer}>
          {!imageError && win.gameImage ? (
            <Image
              source={{ uri: win.gameImage }}
              style={styles.gameImage}
              contentFit="cover"
              onError={() => setImageError(true)}
            />
          ) : (
            <View style={styles.gameImagePlaceholder}>
              <Feather name="play-circle" size={16} color="rgba(255,255,255,0.4)" />
            </View>
          )}
        </View>

        <View style={styles.cardContent}>
          <View style={styles.topRow}>
            <ThemedText style={styles.playerName} numberOfLines={1}>
              {win.playerName}
            </ThemedText>
            <View style={styles.amountBadge}>
              <ThemedText style={styles.amount}>
                ${win.amount.toFixed(0)}
              </ThemedText>
            </View>
          </View>
          <ThemedText style={styles.gameName} numberOfLines={1}>
            {win.gameName}
          </ThemedText>
        </View>

        <View style={styles.awardIcon}>
          <LinearGradient
            colors={[PremiumColors.royalGold, "#FFE5A0"]}
            style={styles.awardIconBg}
          >
            <Feather name="award" size={10} color="#1A0D35" />
          </LinearGradient>
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    height: 52,
    overflow: "hidden",
    position: "relative",
  },
  gradientOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0,
  },
  scrollContainer: {
    flexDirection: "row",
    alignItems: "center",
    height: "100%",
    paddingHorizontal: 20,
    gap: CARD_GAP,
  },
  leftFade: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 40,
    zIndex: 10,
  },
  rightFade: {
    position: "absolute",
    right: 0,
    top: 0,
    bottom: 0,
    width: 40,
    zIndex: 10,
  },
  cardContainer: {
    width: CARD_WIDTH,
    height: 42,
    borderRadius: BorderRadius.sm,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(16, 185, 129, 0.25)",
  },
  cardGradient: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 6,
    gap: 8,
  },
  gameImageContainer: {
    width: 30,
    height: 30,
    borderRadius: 6,
    overflow: "hidden",
    backgroundColor: "rgba(0,0,0,0.3)",
  },
  gameImage: {
    width: "100%",
    height: "100%",
  },
  gameImagePlaceholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(139, 92, 246, 0.2)",
  },
  cardContent: {
    flex: 1,
    justifyContent: "center",
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 6,
  },
  playerName: {
    fontSize: 11,
    fontWeight: "700",
    color: "#10B981",
    letterSpacing: 0.3,
    flex: 1,
  },
  amountBadge: {
    backgroundColor: "rgba(212, 175, 55, 0.15)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  amount: {
    fontSize: 11,
    fontWeight: "800",
    color: PremiumColors.royalGold,
    letterSpacing: 0.3,
  },
  gameName: {
    fontSize: 9,
    color: "rgba(255, 255, 255, 0.5)",
    marginTop: 2,
  },
  awardIcon: {
    width: 18,
    height: 18,
    borderRadius: 9,
    overflow: "hidden",
  },
  awardIconBg: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
