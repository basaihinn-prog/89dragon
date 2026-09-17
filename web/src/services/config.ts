const env = import.meta.env;

export const API_BASE_URL = env.VITE_API_BASE_URL || "";
export const API_KEY = env.VITE_API_KEY || "";
export const IMAGE_BASE_URL = env.VITE_IMAGE_BASE_URL || "";
export const GAME_LAUNCHER_BASE_URL = env.VITE_GAME_LAUNCHER_BASE_URL || "";
export const WS_BASE_URL = env.VITE_WS_BASE_URL || "";
export const APP_VERSION_CODE = Number(env.VITE_APP_VERSION_CODE || 3);
export const BACKGROUND_MUSIC_URL = "https://cdn.pixabay.com/download/audio/2023/02/07/audio_7f4afbcb0c.mp3?filename=casino-158087.mp3";

export function assertRuntimeConfig(): void {
  if (!API_BASE_URL) throw new Error("VITE_API_BASE_URL is not configured");
  if (!IMAGE_BASE_URL) throw new Error("VITE_IMAGE_BASE_URL is not configured");
  if (!GAME_LAUNCHER_BASE_URL) throw new Error("VITE_GAME_LAUNCHER_BASE_URL is not configured");
}
