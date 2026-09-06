import { Image } from "expo-image";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { clearApiCache } from "./api";

const CACHE_KEYS_TO_PRESERVE = [
  "has_seen_splash",
  "jwt_token",
  "user_data",
];

export async function clearImageCache(): Promise<void> {
  try {
    await Image.clearDiskCache();
    await Image.clearMemoryCache();
  } catch (error) {
    console.error("[Memory] Failed to clear image cache:", error);
  }
}

export async function clearAllCaches(): Promise<void> {
  try {
    clearApiCache();
    
    await clearImageCache();
    
    const allKeys = await AsyncStorage.getAllKeys();
    const keysToRemove = allKeys.filter(
      key => !CACHE_KEYS_TO_PRESERVE.includes(key)
    );
    
    if (keysToRemove.length > 0) {
      await AsyncStorage.multiRemove(keysToRemove);
    }
  } catch (error) {
    console.error("[Memory] Failed to clear caches:", error);
  }
}

export async function onLogout(): Promise<void> {
  try {
    clearApiCache();
    
    await Image.clearMemoryCache();
    
    const keysToRemove = [
      "favorite_games",
      "cached_games",
      "cached_categories",
      "games_cache_timestamp",
      "jade_royale_last_spin",
    ];
    
    await AsyncStorage.multiRemove(keysToRemove);
  } catch (error) {
    console.error("[Memory] Logout cleanup failed:", error);
  }
}

export function getMemoryCacheInfo(): { 
  apiCacheSize: number;
  description: string;
} {
  return {
    apiCacheSize: 0,
    description: "Memory management utilities for cache cleanup",
  };
}
