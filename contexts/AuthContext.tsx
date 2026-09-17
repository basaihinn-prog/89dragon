import React, { createContext, useCallback, useContext, useEffect, useRef, useState, ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

import { API_BASE_URL, API_KEY, APP_VERSION_CODE } from "@/services/config";
import { setOnUnauthorizedCallback } from "@/services/api";
import { onLogout as cleanupOnLogout } from "@/services/memoryManagement";

interface User {
  id: number;
  user_id?: number;
  shop_id?: number;
  username: string;
  email: string;
  balance: number;
  phone?: string;
  avatar?: string;
  api_token?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshBalance: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  setBalance: (newBalance: number) => Promise<void>;
  hasSeenSplash: boolean;
  setHasSeenSplash: (value: boolean) => void;
  updateActivity: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = "jwt_token";
const USER_KEY = "user_data";
const SPLASH_KEY = "has_seen_splash";
const INACTIVITY_TIMEOUT_MS = 30 * 60 * 1000;

async function secureSet(key: string, value: string): Promise<void> {
  if (Platform.OS === "web") {
    await AsyncStorage.setItem(key, value);
    return;
  }
  await SecureStore.setItemAsync(key, value);
}

async function secureGet(key: string): Promise<string | null> {
  if (Platform.OS === "web") return AsyncStorage.getItem(key);
  return SecureStore.getItemAsync(key);
}

async function secureDelete(key: string): Promise<void> {
  if (Platform.OS === "web") {
    await AsyncStorage.removeItem(key);
    return;
  }
  await SecureStore.deleteItemAsync(key);
}

function buildHeaders(token?: string | null): Record<string, string> {
  return {
    Accept: "application/json",
    "Content-Type": "application/json",
    ...(API_KEY ? { "X-API-Key": API_KEY } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

function numberOr(value: unknown, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function normalizeAvatar(avatar?: string): string | undefined {
  if (!avatar || avatar.startsWith("http")) return avatar;
  const origin = API_BASE_URL.replace(/\/api\/?$/, "");
  return `${origin}${avatar.startsWith("/") ? "" : "/"}${avatar}`;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasSeenSplash, setHasSeenSplashState] = useState(false);
  const lastActivityRef = useRef(Date.now());

  const updateActivity = useCallback(() => {
    lastActivityRef.current = Date.now();
  }, []);

  const clearLocalAuth = useCallback(async () => {
    await Promise.all([
      secureDelete(TOKEN_KEY),
      AsyncStorage.removeItem(USER_KEY),
    ]);
    setToken(null);
    setUser(null);
  }, []);

  const handleUnauthorized = useCallback(async () => {
    await clearLocalAuth();
  }, [clearLocalAuth]);

  const refreshProfileWithToken = useCallback(async (accessToken: string, baseUser: User): Promise<User> => {
    const response = await fetch(`${API_BASE_URL}/mobile/profile`, {
      headers: buildHeaders(accessToken),
    });

    if (!response.ok) return baseUser;
    const payload = await response.json();
    const profile = payload?.user || payload;

    return {
      ...baseUser,
      id: Number(profile?.id || baseUser.id),
      user_id: Number(profile?.user_id || profile?.id || baseUser.user_id || baseUser.id),
      shop_id: profile?.shop_id ?? baseUser.shop_id,
      username: profile?.username || profile?.name || baseUser.username,
      email: profile?.email ?? baseUser.email,
      phone: profile?.phone ?? baseUser.phone,
      avatar: normalizeAvatar(profile?.avatar || baseUser.avatar),
      balance: numberOr(profile?.balance, baseUser.balance),
      api_token: accessToken,
    };
  }, []);

  const loadStoredAuth = useCallback(async () => {
    try {
      const [storedToken, storedUser, splashSeen] = await Promise.all([
        secureGet(TOKEN_KEY),
        AsyncStorage.getItem(USER_KEY),
        AsyncStorage.getItem(SPLASH_KEY),
      ]);

      setHasSeenSplashState(splashSeen === "true");

      if (storedToken && storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser) as User;
          setToken(storedToken);
          setUser(parsedUser);
        } catch {
          await clearLocalAuth();
        }
      }
    } finally {
      setIsLoading(false);
    }
  }, [clearLocalAuth]);

  useEffect(() => {
    setOnUnauthorizedCallback(handleUnauthorized);
    loadStoredAuth();
  }, [handleUnauthorized, loadStoredAuth]);

  const logout = useCallback(async () => {
    const currentToken = token;
    if (currentToken) {
      fetch(`${API_BASE_URL}/mobile/logout`, {
        method: "POST",
        headers: buildHeaders(currentToken),
      }).catch(() => {});
    }

    await clearLocalAuth();
    await cleanupOnLogout();
  }, [clearLocalAuth, token]);

  useEffect(() => {
    if (!token) return;
    const interval = setInterval(() => {
      if (Date.now() - lastActivityRef.current >= INACTIVITY_TIMEOUT_MS) {
        logout();
      }
    }, 60_000);
    return () => clearInterval(interval);
  }, [logout, token]);

  async function setHasSeenSplash(value: boolean) {
    setHasSeenSplashState(value);
    await AsyncStorage.setItem(SPLASH_KEY, value ? "true" : "false");
  }

  const login = useCallback(async (username: string, password: string): Promise<{ success: boolean; error?: string }> => {
    if (!API_BASE_URL) return { success: false, error: "API is not configured" };

    try {
      const response = await fetch(`${API_BASE_URL}/mobile/login`, {
        method: "POST",
        mode: "cors",
        credentials: "omit",
        headers: buildHeaders(),
        body: JSON.stringify({
          username,
          password,
          app_version: APP_VERSION_CODE,
          platform: Platform.OS,
        }),
      });

      const text = await response.text();
      let payload: any;
      try {
        payload = text ? JSON.parse(text) : {};
      } catch {
        return { success: false, error: "Server returned an invalid response" };
      }

      if (response.status === 426 || payload?.error === "update_required") {
        return { success: false, error: "Please update to the latest app version." };
      }

      if (!response.ok || !payload?.token) {
        return { success: false, error: payload?.message || payload?.error || "Invalid username or password" };
      }

      const accessToken = String(payload.token);
      const raw = payload.user || {};
      let nextUser: User = {
        id: Number(raw.id || 0),
        user_id: Number(raw.user_id || raw.id || 0),
        shop_id: raw.shop_id,
        username: raw.username || username,
        email: raw.email || "",
        balance: numberOr(raw.balance, 0),
        phone: raw.phone,
        avatar: normalizeAvatar(raw.avatar),
        api_token: accessToken,
      };

      try {
        nextUser = await refreshProfileWithToken(accessToken, nextUser);
      } catch {}

      await Promise.all([
        secureSet(TOKEN_KEY, accessToken),
        AsyncStorage.setItem(USER_KEY, JSON.stringify(nextUser)),
      ]);

      setToken(accessToken);
      setUser(nextUser);
      updateActivity();
      return { success: true };
    } catch (error: any) {
      const message = String(error?.message || "");
      if (/network|failed to fetch/i.test(message)) {
        return { success: false, error: "Unable to connect to the server. Please check your internet connection." };
      }
      return { success: false, error: "Connection error. Please try again." };
    }
  }, [refreshProfileWithToken, updateActivity]);

  const refreshBalance = useCallback(async () => {
    if (!token || !user) return;
    try {
      const response = await fetch(`${API_BASE_URL}/mobile/balance/refresh`, {
        headers: buildHeaders(token),
      });
      if (!response.ok) return;
      const payload = await response.json();
      const rawBalance = payload?.balance ?? payload?.user?.balance ?? payload?.data?.balance;
      const balance = numberOr(rawBalance, user.balance);
      const nextUser = { ...user, balance };
      setUser(nextUser);
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(nextUser));
    } catch {}
  }, [token, user]);

  const refreshProfile = useCallback(async () => {
    if (!token || !user) return;
    try {
      const nextUser = await refreshProfileWithToken(token, user);
      setUser(nextUser);
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(nextUser));
    } catch {}
  }, [refreshProfileWithToken, token, user]);

  const setBalance = useCallback(async (newBalance: number) => {
    if (!user || !Number.isFinite(newBalance)) return;
    const nextUser = { ...user, balance: newBalance };
    setUser(nextUser);
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(nextUser));
  }, [user]);

  return (
    <AuthContext.Provider value={{
      user,
      token,
      isLoading,
      isAuthenticated: Boolean(token && user),
      login,
      logout,
      refreshBalance,
      refreshProfile,
      setBalance,
      hasSeenSplash,
      setHasSeenSplash,
      updateActivity,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
}
