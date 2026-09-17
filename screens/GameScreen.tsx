import React, { useCallback, useEffect, useRef, useState } from "react";
import { BackHandler, Platform, Pressable, StyleSheet, View } from "react-native";
import { WebView } from "react-native-webview";
import { Feather } from "@expo/vector-icons";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import * as ScreenOrientation from "expo-screen-orientation";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ThemedText } from "@/components/ThemedText";
import { useAuth } from "@/contexts/AuthContext";
import { launchGameSession } from "@/services/gameApi";
import { GAME_LAUNCHER_BASE_URL } from "@/services/config";
import { RootStackParamList } from "@/navigation/RootNavigator";

const LOAD_TIMEOUT_MS = 30000;

type GameScreenRouteProp = RouteProp<RootStackParamList, "Game">;

type LoadError = {
  message: string;
  kind: "launch" | "network" | "timeout" | "server";
};

export default function GameScreen() {
  const navigation = useNavigation();
  const route = useRoute<GameScreenRouteProp>();
  const insets = useSafeAreaInsets();
  const { token, refreshBalance } = useAuth();
  const { game } = route.params;

  const webViewRef = useRef<WebView>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [gameUrl, setGameUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<LoadError | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const clearLoadTimeout = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const startLoadTimeout = useCallback(() => {
    clearLoadTimeout();
    timeoutRef.current = setTimeout(() => {
      setLoading(false);
      setError({
        kind: "timeout",
        message: "Game is taking too long to load. Please try again.",
      });
    }, LOAD_TIMEOUT_MS);
  }, [clearLoadTimeout]);

  const loadLaunchUrl = useCallback(async () => {
    clearLoadTimeout();
    setLoading(true);
    setProgress(0);
    setError(null);
    setGameUrl(null);

    if (!token) {
      setLoading(false);
      setError({ kind: "launch", message: "Your session has expired. Please sign in again." });
      return;
    }

    const result = await launchGameSession(token, game.name);
    if (!result.success || !result.data?.url) {
      setLoading(false);
      setError({ kind: "launch", message: result.error || "Unable to start this game." });
      return;
    }

    setGameUrl(result.data.url);
    startLoadTimeout();
  }, [clearLoadTimeout, game.name, startLoadTimeout, token]);

  useEffect(() => {
    loadLaunchUrl();
    return clearLoadTimeout;
  }, [loadLaunchUrl, retryCount, clearLoadTimeout]);

  useEffect(() => {
    const orientation = game.orientation || ((game.gamebank === "slot" || game.gamebank === "slots") ? "portrait" : "landscape");

    const applyOrientation = async () => {
      try {
        if (orientation === "portrait") {
          await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
        } else if (orientation === "landscape") {
          await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
        } else {
          await ScreenOrientation.unlockAsync();
        }
      } catch {}
    };

    applyOrientation();
    return () => {
      ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE).catch(() => {});
    };
  }, [game.gamebank, game.orientation]);

  const handleBack = useCallback(async () => {
    clearLoadTimeout();
    try {
      await refreshBalance();
    } finally {
      navigation.goBack();
    }
  }, [clearLoadTimeout, navigation, refreshBalance]);

  useEffect(() => {
    const subscription = BackHandler.addEventListener("hardwareBackPress", () => {
      handleBack();
      return true;
    });
    return () => subscription.remove();
  }, [handleBack]);

  const handleRetry = useCallback(() => {
    setRetryCount((value) => value + 1);
  }, []);

  const handleHttpError = useCallback((event: any) => {
    clearLoadTimeout();
    const status = Number(event?.nativeEvent?.statusCode || 0);
    setLoading(false);
    setError({
      kind: status >= 500 ? "server" : "network",
      message: status >= 500
        ? "The game server is temporarily unavailable."
        : "Unable to load the game. Please check your connection and try again.",
    });
  }, [clearLoadTimeout]);

  const launcherOrigin = (() => {
    try {
      return GAME_LAUNCHER_BASE_URL ? new URL(GAME_LAUNCHER_BASE_URL).origin : null;
    } catch {
      return null;
    }
  })();

  const allowNavigation = useCallback((request: { url: string }) => {
    const url = request.url;
    if (url.startsWith("about:") || url.startsWith("data:") || url.startsWith("blob:")) return true;
    try {
      const parsed = new URL(url);
      return parsed.protocol === "https:" && (!launcherOrigin || parsed.origin === launcherOrigin);
    } catch {
      return false;
    }
  }, [launcherOrigin]);

  if (Platform.OS === "web") {
    return (
      <View style={styles.container}>
        <StatusBar style="light" />
        <GameHeader topInset={insets.top} title={game.title || game.name} onBack={handleBack} />
        <GameBody
          loading={loading}
          progress={progress}
          error={error}
          onRetry={handleRetry}
        >
          {gameUrl ? (
            <iframe
              src={gameUrl}
              title={game.title || game.name}
              allow="autoplay; fullscreen"
              allowFullScreen
              style={{ width: "100%", height: "100%", border: "none", background: "#0D0D0D" } as any}
              onLoad={() => {
                clearLoadTimeout();
                setLoading(false);
                setProgress(100);
              }}
            />
          ) : null}
        </GameBody>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" hidden />
      <GameHeader topInset={insets.top} title={game.title || game.name} onBack={handleBack} />
      <GameBody loading={loading} progress={progress} error={error} onRetry={handleRetry}>
        {gameUrl ? (
          <WebView
            key={`${game.name}-${retryCount}-${gameUrl}`}
            ref={webViewRef}
            source={{ uri: gameUrl }}
            style={styles.webView}
            javaScriptEnabled
            domStorageEnabled
            allowsInlineMediaPlayback
            mediaPlaybackRequiresUserAction={false}
            setSupportMultipleWindows={false}
            originWhitelist={["https://*", "about:*", "data:*", "blob:*"]}
            onShouldStartLoadWithRequest={allowNavigation}
            onLoadStart={() => {
              setLoading(true);
              startLoadTimeout();
            }}
            onLoadProgress={(event) => setProgress(Math.round((event.nativeEvent?.progress || 0) * 100))}
            onLoadEnd={() => {
              clearLoadTimeout();
              setLoading(false);
              setProgress(100);
            }}
            onError={handleHttpError}
            onHttpError={handleHttpError}
          />
        ) : null}
      </GameBody>
    </View>
  );
}

function GameHeader({ topInset, title, onBack }: { topInset: number; title: string; onBack: () => void }) {
  return (
    <View style={[styles.header, { paddingTop: topInset + 6 }]}>
      <Pressable onPress={onBack} style={styles.backButton}>
        <Feather name="x" size={22} color="#FFFFFF" />
      </Pressable>
      <ThemedText style={styles.title} numberOfLines={1}>{title}</ThemedText>
      <View style={styles.headerSpacer} />
    </View>
  );
}

function GameBody({
  loading,
  progress,
  error,
  onRetry,
  children,
}: {
  loading: boolean;
  progress: number;
  error: LoadError | null;
  onRetry: () => void;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.body}>
      {children}
      {error ? (
        <View style={styles.overlay}>
          <Feather name={error.kind === "timeout" ? "clock" : error.kind === "server" ? "server" : "alert-circle"} size={42} color="#ff5b8f" />
          <ThemedText style={styles.errorTitle}>Unable to open game</ThemedText>
          <ThemedText style={styles.errorText}>{error.message}</ThemedText>
          <Pressable onPress={onRetry} style={styles.retryButton}>
            <ThemedText style={styles.retryText}>Try Again</ThemedText>
          </Pressable>
        </View>
      ) : loading ? (
        <View style={styles.overlay}>
          <Feather name="loader" size={38} color="#D4AF37" />
          <ThemedText style={styles.loadingText}>Loading game… {Math.max(0, Math.min(progress, 100))}%</ThemedText>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0D0D0D" },
  body: { flex: 1, backgroundColor: "#0D0D0D" },
  webView: { flex: 1, backgroundColor: "#0D0D0D" },
  header: {
    minHeight: 52,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingBottom: 8,
    backgroundColor: "rgba(13,13,13,0.96)",
    zIndex: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  headerSpacer: { width: 40 },
  title: { flex: 1, textAlign: "center", color: "#FFFFFF", fontSize: 16, fontWeight: "600", marginHorizontal: 10 },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    backgroundColor: "rgba(13,13,13,0.97)",
    gap: 14,
  },
  loadingText: { color: "#FFFFFF", fontSize: 14 },
  errorTitle: { color: "#FFFFFF", fontSize: 20, fontWeight: "700" },
  errorText: { color: "rgba(255,255,255,0.75)", fontSize: 14, textAlign: "center", maxWidth: 420 },
  retryButton: { paddingHorizontal: 20, paddingVertical: 11, borderRadius: 10, backgroundColor: "#D4AF37" },
  retryText: { color: "#0D0D0D", fontWeight: "700" },
});
