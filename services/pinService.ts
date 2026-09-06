import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const PIN_KEY = "user_cashout_pin";

export async function savePin(pin: string): Promise<boolean> {
  try {
    if (Platform.OS === "web") {
      localStorage.setItem(PIN_KEY, pin);
    } else {
      await SecureStore.setItemAsync(PIN_KEY, pin);
    }
    return true;
  } catch (error) {
    console.error("Error saving PIN:", error);
    return false;
  }
}

export async function getPin(): Promise<string | null> {
  try {
    if (Platform.OS === "web") {
      return localStorage.getItem(PIN_KEY);
    }
    return await SecureStore.getItemAsync(PIN_KEY);
  } catch (error) {
    console.error("Error getting PIN:", error);
    return null;
  }
}

export async function hasPin(): Promise<boolean> {
  const pin = await getPin();
  return pin !== null && pin.length > 0;
}

export async function verifyPin(inputPin: string): Promise<boolean> {
  const storedPin = await getPin();
  return storedPin === inputPin;
}

export async function deletePin(): Promise<boolean> {
  try {
    if (Platform.OS === "web") {
      localStorage.removeItem(PIN_KEY);
    } else {
      await SecureStore.deleteItemAsync(PIN_KEY);
    }
    return true;
  } catch (error) {
    console.error("Error deleting PIN:", error);
    return false;
  }
}
