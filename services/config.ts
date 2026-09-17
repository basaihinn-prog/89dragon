import Constants from "expo-constants";

const expoConfig = Constants.expoConfig?.extra || {};

export const API_BASE_URL = expoConfig.apiBaseUrl || process.env.EXPO_PUBLIC_API_BASE_URL || "";
export const API_KEY = expoConfig.apiKey || process.env.EXPO_PUBLIC_API_KEY || "";
export const WS_BASE_URL = expoConfig.wsBaseUrl || process.env.EXPO_PUBLIC_WS_BASE_URL || "";
export const IMAGE_BASE_URL = expoConfig.imageBaseUrl || process.env.EXPO_PUBLIC_IMAGE_BASE_URL || "";
export const GAME_LAUNCHER_BASE_URL = expoConfig.gameLauncherBaseUrl || process.env.EXPO_PUBLIC_GAME_LAUNCHER_BASE_URL || "";
export const APP_VERSION_CODE = Number(expoConfig.versionCode || 1);

export const BACKGROUND_MUSIC_URL = "https://cdn.pixabay.com/download/audio/2023/02/07/audio_7f4afbcb0c.mp3?filename=casino-158087.mp3";

export function assertRuntimeConfig(): void {
  if (!API_BASE_URL) {
    throw new Error("EXPO_PUBLIC_API_BASE_URL is not configured");
  }
  if (!IMAGE_BASE_URL) {
    throw new Error("EXPO_PUBLIC_IMAGE_BASE_URL is not configured");
  }
  if (!GAME_LAUNCHER_BASE_URL) {
    throw new Error("EXPO_PUBLIC_GAME_LAUNCHER_BASE_URL is not configured");
  }
}
