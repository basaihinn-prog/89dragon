import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { loginApi, fetchUserProfile, refreshBalance as apiRefreshBalance, setOnUnauthorizedCallback } from '../services/api';
import { API_BASE_URL, API_KEY as CONFIG_API_KEY } from '../services/config';

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
const API_BASE = API_BASE_URL;
const API_KEY = CONFIG_API_KEY;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const doLogout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setToken(null);
    setUser(null);
  }, []);

  useEffect(() => {
    setOnUnauthorizedCallback(doLogout);
    const storedToken = localStorage.getItem(TOKEN_KEY);
    const storedUser = localStorage.getItem(USER_KEY);
    if (storedToken && storedUser) {
      try {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      } catch {}
    }
    setIsLoading(false);
  }, [doLogout]);

  const login = useCallback(async (username: string, password: string): Promise<{ success: boolean; error?: string }> => {
    const result = await loginApi(username, password);
    if (!result.success || !result.data) {
      return { success: false, error: result.error };
    }
    const { token: newToken, user: userData } = result.data;
    const user: User = {
      id: userData?.id || 0,
      user_id: userData?.user_id || userData?.id || 0,
      shop_id: userData?.shop_id,
      username: userData?.username || username,
      email: userData?.email || '',
      balance: parseFloat(userData?.balance) || 0,
      api_token: newToken,
    };

    localStorage.setItem(TOKEN_KEY, newToken);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    setToken(newToken);
    setUser(user);

    // Fetch full profile
    try {
      const profileRes = await fetch(`${API_BASE}/mobile/profile`, {
        headers: {
          Authorization: `Bearer ${newToken}`,
          Accept: 'application/json',
          'X-API-Key': API_KEY,
        },
      });
      if (profileRes.ok) {
        const pd = await profileRes.json();
        const pu = pd.user || pd;
        let avatarUrl = pu.avatar;
        if (avatarUrl && !avatarUrl.startsWith('http')) {
          const base = API_BASE.replace('/api', '');
          avatarUrl = avatarUrl.startsWith('/') ? `${base}${avatarUrl}` : `${base}/${avatarUrl}`;
        }
        const updated: User = {
          ...user,
          balance: parseFloat(pu.balance) || user.balance,
          email: pu.email || user.email,
          avatar: avatarUrl,
          phone: pu.phone,
          user_id: pu.user_id || user.user_id,
          shop_id: pu.shop_id || user.shop_id,
        };
        setUser(updated);
        localStorage.setItem(USER_KEY, JSON.stringify(updated));
      }
    } catch {}

    return { success: true };
  }, []);

  const logout = useCallback(() => {
    if (token) {
      fetch(`${API_BASE}/logout`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'X-API-Key': API_KEY },
      }).catch(() => {});
    }
    doLogout();
  }, [token, doLogout]);

  const refreshBalance = useCallback(async () => {
    if (!token || !user) return;
    const result = await apiRefreshBalance(token);
    if (result.success && result.data) {
      const bal = (result.data as any).balance ?? (result.data as any).user?.balance ?? (result.data as any).data?.balance;
      if (typeof bal !== 'undefined') {
        const newBal = parseFloat(bal);
        if (!isNaN(newBal)) {
          const updated = { ...user, balance: newBal };
          setUser(updated);
          localStorage.setItem(USER_KEY, JSON.stringify(updated));
        }
      }
    }
  }, [token, user]);

  const refreshProfile = useCallback(async () => {
    if (!token || !user) return;
    const result = await fetchUserProfile(token);
    if (result.success && result.data) {
      const pu = (result.data as any).user || result.data;
      let avatarUrl = pu.avatar || user.avatar;
      if (avatarUrl && !avatarUrl.startsWith('http')) {
        const base = API_BASE.replace('/api', '');
        avatarUrl = avatarUrl.startsWith('/') ? `${base}${avatarUrl}` : `${base}/${avatarUrl}`;
      }
      const updated: User = {
        ...user,
        username: pu.username || pu.name || user.username,
        email: pu.email || user.email,
        balance: parseFloat(pu.balance) || user.balance,
        phone: pu.phone || user.phone,
        avatar: avatarUrl,
        user_id: pu.user_id || user.user_id,
        shop_id: pu.shop_id || user.shop_id,
      };
      setUser(updated);
      localStorage.setItem(USER_KEY, JSON.stringify(updated));
    }
  }, [token, user]);

  const setBalance = useCallback((balance: number) => {
    if (!user) return;
    const updated = { ...user, balance };
    setUser(updated);
    localStorage.setItem(USER_KEY, JSON.stringify(updated));
  }, [user]);

  return (
    <AuthContext.Provider value={{
      user, token, isLoading,
      isAuthenticated: !!token && !!user,
      login, logout, refreshBalance, refreshProfile, setBalance,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
