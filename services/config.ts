import Constants from "expo-constants";

const expoConfig = Constants.expoConfig?.extra || {};

export const API_BASE_URL = expoConfig.apiBaseUrl || process.env.EXPO_PUBLIC_API_BASE_URL || "";
export const API_KEY = expoConfig.apiKey || process.env.EXPO_PUBLIC_API_KEY || "";
export const WS_BASE_URL = expoConfig.wsBaseUrl || process.env.EXPO_PUBLIC_WS_BASE_URL || "";
export const IMAGE_BASE_URL = expoConfig.imageBaseUrl || process.env.EXPO_PUBLIC_IMAGE_BASE_URL || "";
export const GAME_LAUNCHER_BASE_URL = expoConfig.gameLauncherBaseUrl || process.env.EXPO_PUBLIC_GAME_LAUNCHER_BASE_URL || "";

export const BACKGROUND_MUSIC_URL = "https://cdn.pixabay.com/download/audio/2023/02/07/audio_7f4afbcb0c.mp3?filename=casino-158087.mp3";

if (!API_BASE_URL) {
  console.warn("API_BASE_URL is not configured. Set EXPO_PUBLIC_API_BASE_URL environment variable.");
}
if (!API_KEY) {
  console.warn("API_KEY is not configured. Set EXPO_PUBLIC_API_KEY environment variable.");
}
