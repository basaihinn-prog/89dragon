import React, { useState, useRef, useEffect, useCallback } from "react";
import { View, StyleSheet, Pressable, Platform, BackHandler } from "react-native";
import { WebView } from "react-native-webview";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import * as ScreenOrientation from "expo-screen-orientation";
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withRepeat, 
  withTiming,
  withSequence,
  Easing,
  FadeIn,
} from "react-native-reanimated";
import { ThemedText } from "@/components/ThemedText";
import { useAuth } from "@/contexts/AuthContext";
import { getGameLaunchUrl } from "@/services/api";
import { NeonColors, Spacing, BorderRadius, GlassColors } from "@/constants/theme";
import { RootStackParamList } from "@/navigation/RootNavigator";

const LOAD_TIMEOUT_MS = 30000;

type GameScreenRouteProp = RouteProp<RootStackParamList, "Game">;

export default function GameScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const route = useRoute<GameScreenRouteProp>();
  const { token, refreshBalance } = useAuth();
  const webViewRef = useRef<WebView>(null);

  const { game } = route.params;
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [errorType, setErrorType] = useState<"timeout" | "network" | "server" | "unknown">("unknown");
  const [retryCount, setRetryCount] = useState(0);
  const [gameUrl, setGameUrl] = useState<string | null>(null);
  const [isFetchingUrl, setIsFetchingUrl] = useState(true);
  const [loadProgress, setLoadProgress] = useState(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const spinRotation = useSharedValue(0);

  useEffect(() => {
    spinRotation.value = withRepeat(
      withTiming(360, { duration: 1500, easing: Easing.linear }),
      -1,
      false
    );
  }, []);

  const spinStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${spinRotation.value}deg` }],
  }));

  useEffect(() => {
    if (isLoading && gameUrl && !error) {
      timeoutRef.current = setTimeout(() => {
        if (isLoading) {
          setError("Game is taking too long to load. The server might be busy.");
          setErrorType("timeout");
          setIsLoading(false);
        }
      }, LOAD_TIMEOUT_MS);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [isLoading, gameUrl, error]);

  useEffect(() => {
    function buildGameUrl() {
      setIsFetchingUrl(true);
      setError(null);
      
      try {
        // Priority 1: Use the full launcher_url from API as-is
        // The launcher_url includes all required query parameters (jwt_token, verify_hash, mobile flags)
        // DO NOT modify the URL - the server-provided signed URL must be used exactly as received
        if (game.launcher_url) {
          let fullUrl = game.launcher_url;
          
          // If the URL doesn't start with http, prepend the base URL
          if (!fullUrl.startsWith('http')) {
            fullUrl = `https://bxbet.asia${fullUrl.startsWith('/') ? '' : '/'}${fullUrl}`;
          }
          
          // Use the URL as-is - server already provides all required authentication params
          setGameUrl(fullUrl);
          setIsFetchingUrl(false);
          return;
        }
        
        // Priority 2: Fall back to constructing URL from game name (for games without launcher_url)
        const directUrl = getGameLaunchUrl(game.name, token || "");
        setGameUrl(directUrl);
        setIsFetchingUrl(false);
      } catch (err: any) {
        console.error(`Error building game URL for ${game.name}:`, err);
        setError("Failed to load game. Please try again.");
        setIsFetchingUrl(false);
      }
    }
    
    buildGameUrl();
  }, [game, token, retryCount]);
  
  const getGameOrientation = (): "portrait" | "landscape" | "both" => {
    if (game.orientation) {
      return game.orientation;
    }
    if (game.gamebank === "slot" || game.gamebank === "slots") {
      return "portrait";
    }
    return "landscape";
  };
  
  const gameOrientation = getGameOrientation();

  useEffect(() => {
    async function setOrientation() {
      try {
        switch (gameOrientation) {
          case "portrait":
            await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
            break;
          case "landscape":
            await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
            break;
          case "both":
            await ScreenOrientation.unlockAsync();
            break;
        }
      } catch (e) {
      }
    }
    setOrientation();

    return () => {
      ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE).catch(() => {});
    };
  }, [gameOrientation]);

  useEffect(() => {
    const backHandler = BackHandler.addEventListener("hardwareBackPress", () => {
      handleBack();
      return true;
    });

    return () => backHandler.remove();
  }, []);

  const handleBack = async () => {
    try {
      await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
    } catch (e) {}
    await refreshBalance();
    navigation.goBack();
  };

  const handleWebViewError = useCallback((syntheticEvent: any) => {
    const { nativeEvent } = syntheticEvent || {};
    const errorCode = nativeEvent?.code;
    const errorDescription = nativeEvent?.description || "";
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    if (errorCode === -2 || errorDescription.includes("net::ERR_")) {
      setError("Unable to connect. Please check your internet connection.");
      setErrorType("network");
    } else if (errorCode >= 500 || errorDescription.includes("500")) {
      setError("The game server is temporarily unavailable. Please try again later.");
      setErrorType("server");
    } else if (errorCode === -1 || errorDescription.includes("timeout")) {
      setError("Connection timed out. Please try again.");
      setErrorType("timeout");
    } else {
      setError("Something went wrong loading the game. Please try again.");
      setErrorType("unknown");
    }
    setIsLoading(false);
  }, []);

  const handleLoadEnd = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsLoading(false);
    setLoadProgress(100);
  }, []);

  const handleLoadProgress = useCallback((event: any) => {
    const progress = event.nativeEvent?.progress ? event.nativeEvent.progress * 100 : 0;
    setLoadProgress(Math.min(progress, 100));
  }, []);

  const handleRetry = useCallback(() => {
    setError(null);
    setErrorType("unknown");
    setLoadProgress(0);
    setIsLoading(true);
    setRetryCount(c => c + 1);
  }, []);

  const getErrorIcon = () => {
    switch (errorType) {
      case "timeout": 
        return "clock";
      case "network": 
        return "wifi-off";
      case "server": 
        return "server";
      case "unknown":
        return "alert-circle";
      default: 
        return "alert-circle";
    }
  };

  const getErrorSuggestion = () => {
    switch (errorType) {
      case "timeout": 
        return "Try closing other apps or connecting to a faster network.";
      case "network": 
        return "Make sure you're connected to the internet and try again.";
      case "server": 
        return "Our servers are experiencing high traffic. Please wait a moment.";
      case "unknown":
        return "If this keeps happening, try restarting the app.";
      default: 
        return "Please try again or contact support if the issue persists.";
    }
  };

  if (Platform.OS === "web") {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <StatusBar style="light" />
        <View style={styles.header}>
          <Pressable
            onPress={handleBack}
            style={({ pressed }) => [
              styles.backButton,
              { opacity: pressed ? 0.6 : 1 },
            ]}
          >
            <Feather name="x" size={24} color="#FFFFFF" />
          </Pressable>
          <ThemedText style={styles.gameTitle} numberOfLines={1}>
            {game.title || game.name}
          </ThemedText>
        </View>
        {error ? (
          <View style={styles.errorContainer}>
            <Feather name={getErrorIcon() as any} size={40} color={NeonColors.pink} />
            <ThemedText style={styles.errorTitle}>Oops!</ThemedText>
            <ThemedText style={styles.errorText}>{error}</ThemedText>
            <Pressable onPress={handleRetry} style={styles.retryButton}>
              <ThemedText style={styles.retryButtonText}>Try Again</ThemedText>
            </Pressable>
          </View>
        ) : isFetchingUrl || !gameUrl ? (
          <View style={styles.loadingOverlay}>
            <Feather name="loader" size={40} color={NeonColors.green} />
            <ThemedText style={styles.loadingText}>Connecting to game...</ThemedText>
          </View>
        ) : (
          <View style={{ flex: 1, width: "100%", height: "100%" }}>
            <iframe
              src={gameUrl}
              style={{
                width: "100%",
                height: "100%",
                border: "none",
                backgroundColor: "#0D0D0D",
              } as any}
              allow="autoplay; fullscreen"
              allowFullScreen
            />
          </View>
        )}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" hidden />
      
      <View style={[styles.header, { paddingTop: insets.top + Spacing.sm }]}>
        <Pressable
          onPress={handleBack}
          style={({ pressed }) => [
            styles.backButton,
            { opacity: pressed ? 0.6 : 1 },
          ]}
        >
          <Feather name="x" size={24} color="#FFFFFF" />
        </Pressable>
        <ThemedText style={styles.gameTitle} numberOfLines={1}>
          {game.title || game.name}
        </ThemedText>
      </View>

      {error ? (
        <Animated.View entering={FadeIn.duration(300)} style={styles.errorContainer}>
          <View style={styles.errorIconContainer}>
            <Feather name={getErrorIcon() as any} size={40} color={NeonColors.pink} />
          </View>
          <ThemedText style={styles.errorTitle}>Oops!</ThemedText>
          <ThemedText style={styles.errorText}>{error}</ThemedText>
          <ThemedText style={styles.errorSuggestion}>{getErrorSuggestion()}</ThemedText>
          <View style={styles.errorButtonsRow}>
            <Pressable
              onPress={handleRetry}
              style={({ pressed }) => [
                styles.retryButton,
                { opacity: pressed ? 0.8 : 1 },
              ]}
            >
              <Feather name="refresh-cw" size={18} color="#0D0D0D" style={styles.buttonIcon} />
              <ThemedText style={styles.retryButtonText}>Try Again</ThemedText>
            </Pressable>
            <Pressable
              onPress={handleBack}
              style={({ pressed }) => [
                styles.backButtonSecondary,
                { opacity: pressed ? 0.8 : 1 },
              ]}
            >
              <ThemedText style={styles.backButtonText}>Go Back</ThemedText>
            </Pressable>
          </View>
          {retryCount > 0 ? (
            <ThemedText style={styles.retryCountText}>
              Attempt {retryCount + 1}
            </ThemedText>
          ) : null}
        </Animated.View>
      ) : isFetchingUrl || !gameUrl ? (
        <View style={styles.loadingOverlay}>
          <Animated.View style={[styles.spinnerContainer, spinStyle]}>
            <Feather name="loader" size={40} color={NeonColors.green} />
          </Animated.View>
          <ThemedText style={styles.loadingText}>Connecting to game...</ThemedText>
        </View>
      ) : (
        <>
          <WebView
            key={`${retryCount}-${gameUrl}`}
            ref={webViewRef}
            source={{ uri: gameUrl }}
            style={styles.webView}
            onLoadStart={() => setIsLoading(true)}
            onLoadEnd={handleLoadEnd}
            onLoadProgress={handleLoadProgress}
            onError={handleWebViewError}
            onHttpError={handleWebViewError}
            javaScriptEnabled
            domStorageEnabled
            allowsInlineMediaPlayback
            mediaPlaybackRequiresUserAction={false}
            startInLoadingState
            renderLoading={() => <View />}
            originWhitelist={["*"]}
            setSupportMultipleWindows={false}
            onShouldStartLoadWithRequest={(request) => {
              const { url } = request;
              if (url.startsWith("https://bxbet.asia") || 
                  url.startsWith("http://bxbet.asia") ||
                  url.startsWith("wss://bxbet.asia") ||
                  url.startsWith("ws://bxbet.asia") ||
                  url.startsWith("about:blank") ||
                  url.startsWith("data:") ||
                  url.startsWith("blob:")) {
                return true;
              }
              return false;
            }}
          />
          {isLoading ? (
            <View style={styles.loadingOverlay}>
              <Animated.View style={[styles.spinnerContainer, spinStyle]}>
                <Feather name="loader" size={40} color={NeonColors.green} />
              </Animated.View>
              <ThemedText style={styles.loadingText}>Loading game...</ThemedText>
              <View style={styles.progressContainer}>
                <View style={[styles.progressBar, { width: `${loadProgress}%` }]} />
              </View>
              <ThemedText style={styles.progressText}>{Math.round(loadProgress)}%</ThemedText>
            </View>
          ) : null}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0D0D0D",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.sm,
    backgroundColor: GlassColors.darkGlass,
    zIndex: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    backgroundColor: GlassColors.cardGlass,
    alignItems: "center",
    justifyContent: "center",
  },
  gameTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
    marginHorizontal: Spacing.md,
    textAlign: "center",
  },
  webView: {
    flex: 1,
    backgroundColor: "#0D0D0D",
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(13, 13, 13, 0.95)",
    alignItems: "center",
    justifyContent: "center",
  },
  spinnerContainer: {
    width: 60,
    height: 60,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    marginTop: Spacing.lg,
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: 14,
  },
  progressContainer: {
    width: 200,
    height: 4,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 2,
    marginTop: Spacing.md,
    overflow: "hidden",
  },
  progressBar: {
    height: "100%",
    backgroundColor: NeonColors.green,
    borderRadius: 2,
  },
  progressText: {
    color: NeonColors.green,
    fontSize: 12,
    marginTop: Spacing.xs,
    fontWeight: "600",
  },
  errorContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.xl,
  },
  errorIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(236, 72, 153, 0.15)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.md,
  },
  errorTitle: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "800",
    marginBottom: Spacing.sm,
  },
  errorText: {
    color: NeonColors.pink,
    fontSize: 16,
    textAlign: "center",
    marginBottom: Spacing.sm,
    maxWidth: 300,
  },
  errorSuggestion: {
    color: "rgba(255, 255, 255, 0.5)",
    fontSize: 13,
    textAlign: "center",
    marginBottom: Spacing.xl,
    maxWidth: 280,
  },
  errorButtonsRow: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  retryButton: {
    backgroundColor: NeonColors.green,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    flexDirection: "row",
    alignItems: "center",
  },
  buttonIcon: {
    marginRight: Spacing.xs,
  },
  retryButtonText: {
    color: "#0D0D0D",
    fontWeight: "700",
    fontSize: 15,
  },
  retryCountText: {
    color: "rgba(255, 255, 255, 0.4)",
    fontSize: 11,
    marginTop: Spacing.lg,
  },
  backButtonSecondary: {
    backgroundColor: GlassColors.cardGlass,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  backButtonText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 15,
  },
  webFallback: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.xl,
  },
  webFallbackTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#FFFFFF",
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  webFallbackText: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.6)",
    textAlign: "center",
    marginBottom: Spacing.xl,
  },
  returnButton: {
    backgroundColor: NeonColors.purple,
    paddingHorizontal: Spacing["2xl"],
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.lg,
  },
  returnButtonText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 16,
  },
});
