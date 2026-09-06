import { Linking, Platform } from "react-native";
import Constants from "expo-constants";

const UPDATE_API_URL = "https://play.jaderoyale.app/version.json";

export interface UpdateInfo {
  versionCode: number;
  versionName: string;
  downloadUrl: string;
  releaseNotes: string;
  forceUpdate: boolean;
}

export interface UpdateCheckResult {
  updateAvailable: boolean;
  updateInfo: UpdateInfo | null;
  currentVersionCode: number;
}

export async function checkForUpdates(): Promise<UpdateCheckResult> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(UPDATE_API_URL, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return {
        updateAvailable: false,
        updateInfo: null,
        currentVersionCode: getCurrentVersionCode(),
      };
    }

    const data: UpdateInfo = await response.json();

    const currentVersionCode = getCurrentVersionCode();

    const updateAvailable = data.versionCode > currentVersionCode;

    return {
      updateAvailable,
      updateInfo: updateAvailable ? data : null,
      currentVersionCode,
    };
  } catch (error) {
    return {
      updateAvailable: false,
      updateInfo: null,
      currentVersionCode: getCurrentVersionCode(),
    };
  }
}

function getCurrentVersionCode(): number {
  try {
    const expoConfig = Constants.expoConfig;
    if (expoConfig?.extra?.versionCode) {
      return expoConfig.extra.versionCode;
    }
    if (expoConfig?.android?.versionCode) {
      return expoConfig.android.versionCode;
    }
  } catch (e) {
  }
  
  return 1;
}

export async function openDownloadUrl(url: string): Promise<void> {
  try {
    const canOpen = await Linking.canOpenURL(url);
    if (canOpen) {
      await Linking.openURL(url);
    }
  } catch (error) {
    console.error("Failed to open download URL:", error);
  }
}
