import React, { createContext, useCallback, useContext, useEffect, useState, ReactNode } from 'react';
import { fetchUserProfile, refreshBalance as apiRefreshBalance, setOnUnauthorizedCallback } from '../services/api';
import { API_BASE_URL, API_KEY, APP_VERSION_CODE } from '../services/config';

export interface User {
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
  logout: () => void;
  refreshBalance: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  setBalance: (balance: number) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const TOKEN_KEY = 'jr_token';
const USER_KEY = 'jr_user';

function buildHeaders(token?: string | null): Record<string, string> {
  return {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    ...(API_KEY ? { 'X-API-Key': API_KEY } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

function numberOr(value: unknown, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function normalizeAvatar(avatar?: string): string | undefined {
  if (!avatar || avatar.startsWith('http')) return avatar;
  const origin = API_BASE_URL.replace(/\/api\/?$/, '');
  return `${origin}${avatar.startsWith('/') ? '' : '/'}${avatar}`;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const doLogout = useCallback(() => {
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(USER_KEY);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setToken(null);
    setUser(null);
  }, []);

  useEffect(() => {
    setOnUnauthorizedCallback(doLogout);

    // Migrate away from persistent localStorage tokens. Existing tokens are accepted
    // for this session only and then removed from localStorage.
    const storedToken = sessionStorage.getItem(TOKEN_KEY) || localStorage.getItem(TOKEN_KEY);
    const storedUser = sessionStorage.getItem(USER_KEY) || localStorage.getItem(USER_KEY);

    if (storedToken && storedUser) {
      try {
        const parsed = JSON.parse(storedUser) as User;
        sessionStorage.setItem(TOKEN_KEY, storedToken);
        sessionStorage.setItem(USER_KEY, JSON.stringify(parsed));
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        setToken(storedToken);
        setUser(parsed);
      } catch {
        doLogout();
      }
    }

    setIsLoading(false);
  }, [doLogout]);

  const login = useCallback(async (username: string, password: string): Promise<{ success: boolean; error?: string }> => {
    if (!API_BASE_URL) return { success: false, error: 'API is not configured' };

    try {
      const response = await fetch(`${API_BASE_URL}/mobile/login`, {
        method: 'POST',
        headers: buildHeaders(),
        body: JSON.stringify({
          username,
          password,
          app_version: APP_VERSION_CODE,
          platform: 'web',
        }),
      });

      const text = await response.text();
      let payload: any;
      try {
        payload = text ? JSON.parse(text) : {};
      } catch {
        return { success: false, error: 'Invalid server response' };
      }

      if (response.status === 426 || payload?.error === 'update_required') {
        return { success: false, error: 'Please refresh or update to the latest version.' };
      }

      if (!response.ok || !payload?.token) {
        return { success: false, error: payload?.message || payload?.error || 'Invalid credentials' };
      }

      const accessToken = String(payload.token);
      const raw = payload.user || {};
      let nextUser: User = {
        id: Number(raw.id || 0),
        user_id: Number(raw.user_id || raw.id || 0),
        shop_id: raw.shop_id,
        username: raw.username || username,
        email: raw.email || '',
        balance: numberOr(raw.balance, 0),
        phone: raw.phone,
        avatar: normalizeAvatar(raw.avatar),
        api_token: accessToken,
      };

      try {
        const profileResponse = await fetch(`${API_BASE_URL}/mobile/profile`, {
          headers: buildHeaders(accessToken),
        });
        if (profileResponse.ok) {
          const profilePayload = await profileResponse.json();
          const profile = profilePayload?.user || profilePayload;
          nextUser = {
            ...nextUser,
            id: Number(profile?.id || nextUser.id),
            user_id: Number(profile?.user_id || profile?.id || nextUser.user_id || nextUser.id),
            shop_id: profile?.shop_id ?? nextUser.shop_id,
            username: profile?.username || profile?.name || nextUser.username,
            email: profile?.email ?? nextUser.email,
            phone: profile?.phone ?? nextUser.phone,
            avatar: normalizeAvatar(profile?.avatar || nextUser.avatar),
            balance: numberOr(profile?.balance, nextUser.balance),
          };
        }
      } catch {}

      sessionStorage.setItem(TOKEN_KEY, accessToken);
      sessionStorage.setItem(USER_KEY, JSON.stringify(nextUser));
      setToken(accessToken);
      setUser(nextUser);
      return { success: true };
    } catch {
      return { success: false, error: 'Unable to connect to server. Please check your connection.' };
    }
  }, []);

  const logout = useCallback(() => {
    if (token) {
      fetch(`${API_BASE_URL}/mobile/logout`, {
        method: 'POST',
        headers: buildHeaders(token),
      }).catch(() => {});
    }
    doLogout();
  }, [doLogout, token]);

  const persistUser = useCallback((nextUser: User) => {
    setUser(nextUser);
    sessionStorage.setItem(USER_KEY, JSON.stringify(nextUser));
  }, []);

  const refreshBalance = useCallback(async () => {
    if (!token || !user) return;
    const result = await apiRefreshBalance(token);
    if (!result.success || !result.data) return;

    const rawBalance = (result.data as any).balance ?? (result.data as any).user?.balance ?? (result.data as any).data?.balance;
    persistUser({ ...user, balance: numberOr(rawBalance, user.balance) });
  }, [persistUser, token, user]);

  const refreshProfile = useCallback(async () => {
    if (!token || !user) return;
    const result = await fetchUserProfile(token);
    if (!result.success || !result.data) return;

    const profile = (result.data as any).user || result.data;
    persistUser({
      ...user,
      id: Number(profile?.id || user.id),
      user_id: Number(profile?.user_id || profile?.id || user.user_id || user.id),
      shop_id: profile?.shop_id ?? user.shop_id,
      username: profile?.username || profile?.name || user.username,
      email: profile?.email ?? user.email,
      phone: profile?.phone ?? user.phone,
      avatar: normalizeAvatar(profile?.avatar || user.avatar),
      balance: numberOr(profile?.balance, user.balance),
    });
  }, [persistUser, token, user]);

  const setBalance = useCallback((balance: number) => {
    if (!user || !Number.isFinite(balance)) return;
    persistUser({ ...user, balance });
  }, [persistUser, user]);

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
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
