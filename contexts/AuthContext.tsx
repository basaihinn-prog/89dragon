import React, { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import { API_BASE_URL, API_KEY } from "@/services/config";
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

async function secureSet(key: string, value: string): Promise<void> {
  if (Platform.OS === "web") {
    await AsyncStorage.setItem(key, value);
  } else {
    await SecureStore.setItemAsync(key, value);
  }
}

async function secureGet(key: string): Promise<string | null> {
  if (Platform.OS === "web") {
    return await AsyncStorage.getItem(key);
  } else {
    return await SecureStore.getItemAsync(key);
  }
}

async function secureDelete(key: string): Promise<void> {
  if (Platform.OS === "web") {
    await AsyncStorage.removeItem(key);
  } else {
    await SecureStore.deleteItemAsync(key);
  }
}

const INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutes in milliseconds

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasSeenSplash, setHasSeenSplashState] = useState(false);
  const lastActivityRef = useRef<number>(Date.now());

  const updateActivity = useCallback(() => {
    lastActivityRef.current = Date.now();
  }, []);

  const handleUnauthorized = useCallback(async () => {
    await secureDelete(TOKEN_KEY);
    await AsyncStorage.removeItem(USER_KEY);
    setToken(null);
    setUser(null);
  }, []);

  useEffect(() => {
    setOnUnauthorizedCallback(handleUnauthorized);
    loadStoredAuth();
  }, [handleUnauthorized]);

  // Inactivity timeout - check every minute
  useEffect(() => {
    if (!token) return;

    const checkInactivity = () => {
      const timeSinceLastActivity = Date.now() - lastActivityRef.current;
      if (timeSinceLastActivity >= INACTIVITY_TIMEOUT) {
        logout();
      }
    };

    const intervalId = setInterval(checkInactivity, 60000); // Check every minute
    
    return () => clearInterval(intervalId);
  }, [token]);

  async function loadStoredAuth() {
    try {
      const [storedToken, storedUser, splashSeen] = await Promise.all([
        secureGet(TOKEN_KEY),
        AsyncStorage.getItem(USER_KEY),
        AsyncStorage.getItem(SPLASH_KEY),
      ]);

      if (splashSeen === "true") {
        setHasSeenSplashState(true);
      }

      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error("Error loading auth:", error);
    } finally {
      setIsLoading(false);
    }
  }

  async function setHasSeenSplash(value: boolean) {
    setHasSeenSplashState(value);
    await AsyncStorage.setItem(SPLASH_KEY, value ? "true" : "false");
  }

  async function login(username: string, password: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Current app version code (increment this when releasing new versions)
      const APP_VERSION_CODE = 2;
      const platform = Platform.OS === "ios" ? "ios" : "android";
      
      const response = await fetch(`${API_BASE_URL}/login`, {
        method: "POST",
        mode: "cors",
        credentials: "omit",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          ...(API_KEY ? { "X-API-Key": API_KEY } : {}),
        },
        body: JSON.stringify({ 
          username, 
          password,
          app_version: APP_VERSION_CODE,
          platform,
        }),
      });

      const responseText = await response.text();
      
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error("Failed to parse response:", parseError);
        return { success: false, error: "Server returned invalid response" };
      }

      // Handle HTTP 426 Upgrade Required - app version outdated
      if (response.status === 426 || data.error === "update_required") {
        return { 
          success: false, 
          error: "Please update to the latest version at play.JadeRoyale.app" 
        };
      }

      if (response.ok && data.token) {
        const userData: User = {
          id: data.user?.id || 0,
          user_id: data.user?.user_id || data.user?.id || 0,
          shop_id: data.user?.shop_id,
          username: data.user?.username || username,
          email: data.user?.email || "",
          balance: data.user?.balance || 0,
          api_token: data.token,
        };

        await secureSet(TOKEN_KEY, data.token);
        await AsyncStorage.setItem(USER_KEY, JSON.stringify(userData));

        setToken(data.token);
        setUser(userData);

        try {
          const profileResponse = await fetch(`${API_BASE_URL}/mobile/profile`, {
            method: "GET",
            headers: {
              "Authorization": `Bearer ${data.token}`,
              "Accept": "application/json",
              ...(API_KEY ? { "X-API-Key": API_KEY } : {}),
            },
          });

          if (profileResponse.ok) {
            const profileData = await profileResponse.json();
            const profileUser = profileData.user || profileData;
            if (profileUser) {
              let avatarUrl = profileUser.avatar;
              if (avatarUrl && !avatarUrl.startsWith("http")) {
                const baseUrl = API_BASE_URL.replace("/api", "");
                avatarUrl = avatarUrl.startsWith("/") ? `${baseUrl}${avatarUrl}` : `${baseUrl}/${avatarUrl}`;
              }
              
              const updatedUser = { 
                ...userData, 
                user_id: profileUser.user_id || userData.user_id || profileUser.id || userData.id,
                shop_id: profileUser.shop_id || userData.shop_id,
                balance: parseFloat(profileUser.balance) || userData.balance,
                email: profileUser.email || userData.email,
                avatar: avatarUrl,
                phone: profileUser.phone,
              };
              setUser(updatedUser);
              await AsyncStorage.setItem(USER_KEY, JSON.stringify(updatedUser));
            }
          }
        } catch (profileError) {
        }

        return { success: true };
      } else {
        return { success: false, error: data.message || data.error || "Invalid username or password" };
      }
    } catch (error: any) {
      console.error("Login error details:", {
        message: error?.message,
        name: error?.name,
        platform: Platform.OS,
      });
      
      if (error?.message?.includes("Failed to fetch") || error?.message?.includes("Network")) {
        if (Platform.OS === "web") {
          return { success: false, error: "Web browser cannot connect to casino server. Please use the Expo Go app on your phone instead." };
        }
        return { success: false, error: "Unable to connect to server. Please check your internet connection." };
      }
      
      return { success: false, error: "Connection error. Please try again." };
    }
  }

  async function logout() {
    try {
      if (token) {
        await fetch(`${API_BASE_URL}/logout`, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${token}`,
            "Accept": "application/json",
            ...(API_KEY ? { "X-API-Key": API_KEY } : {}),
          },
        }).catch(() => {});
      }

      await secureDelete(TOKEN_KEY);
      await AsyncStorage.removeItem(USER_KEY);
      
      await cleanupOnLogout();

      setToken(null);
      setUser(null);
    } catch (error) {
      console.error("Logout error:", error);
    }
  }

  async function refreshBalance() {
    if (!token) return;

    try {
      const response = await fetch(`${API_BASE_URL}/mobile/balance/refresh`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Accept": "application/json",
          ...(API_KEY ? { "X-API-Key": API_KEY } : {}),
        },
      });

      if (response.ok) {
        const data = await response.json();
        
        let balance: number | undefined;
        
        if (typeof data.balance !== "undefined") {
          balance = parseFloat(data.balance);
        } else if (data.user && typeof data.user.balance !== "undefined") {
          balance = parseFloat(data.user.balance);
        } else if (data.data && typeof data.data.balance !== "undefined") {
          balance = parseFloat(data.data.balance);
        }
        
        if (user && typeof balance === "number" && !isNaN(balance)) {
          const updatedUser = { ...user, balance };
          setUser(updatedUser);
          await AsyncStorage.setItem(USER_KEY, JSON.stringify(updatedUser));
        }
      }
    } catch (error) {
      console.error("[Balance] Refresh error:", error);
    }
  }

  async function refreshProfile() {
    if (!token) return;

    try {
      const response = await fetch(`${API_BASE_URL}/mobile/profile`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Accept": "application/json",
          ...(API_KEY ? { "X-API-Key": API_KEY } : {}),
        },
      });

      if (response.ok) {
        const data = await response.json();
        const profileUser = data.user || data;
        
        let avatarUrl = profileUser.avatar || user?.avatar;
        if (avatarUrl && !avatarUrl.startsWith("http")) {
          const baseUrl = API_BASE_URL.replace("/api", "");
          avatarUrl = avatarUrl.startsWith("/") ? `${baseUrl}${avatarUrl}` : `${baseUrl}/${avatarUrl}`;
        }
        
        const updatedUser: User = {
          id: profileUser.id || user?.id || 0,
          user_id: profileUser.user_id || user?.user_id || profileUser.id || user?.id || 0,
          shop_id: profileUser.shop_id || user?.shop_id,
          username: profileUser.username || profileUser.name || user?.username || "",
          email: profileUser.email || user?.email || "",
          balance: parseFloat(profileUser.balance) || user?.balance || 0,
          phone: profileUser.phone || user?.phone,
          avatar: avatarUrl,
          api_token: profileUser.api_token || user?.api_token || token || "",
        };
        setUser(updatedUser);
        await AsyncStorage.setItem(USER_KEY, JSON.stringify(updatedUser));
      }
    } catch (error) {
      console.error("Profile refresh error:", error);
    }
  }

  async function setBalanceDirectly(newBalance: number) {
    if (!user) return;
    const updatedUser = { ...user, balance: newBalance };
    setUser(updatedUser);
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(updatedUser));
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated: !!token && !!user,
        login,
        logout,
        refreshBalance,
        refreshProfile,
        setBalance: setBalanceDirectly,
        hasSeenSplash,
        setHasSeenSplash,
        updateActivity,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
