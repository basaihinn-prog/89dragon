import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from "@/contexts/AuthContext";
import { API_BASE_URL, API_KEY } from "@/services/config";

interface ReferralStats {
  referralCode: string;
  referralLink: string;
  totalReferrals: number;
  pendingReferrals: number;
  totalEarned: number;
  pendingRewards: number;
  referrerBonus: number;
  refereeBonus: number;
}

interface RecentReferral {
  id: string;
  username: string;
  date: string;
  status: "pending" | "completed";
  bonus: number;
}

interface ReferralContextType {
  stats: ReferralStats | null;
  recentReferrals: RecentReferral[];
  isLoading: boolean;
  error: string | null;
  fetchReferralData: () => Promise<void>;
  claimRewards: () => Promise<{ success: boolean; message?: string }>;
}

const ReferralContext = createContext<ReferralContextType | undefined>(undefined);

const REFERRAL_CACHE_KEY = "jade_royale_referral_cache";

function generateReferralCode(userId: number | undefined, username: string): string {
  const base = username.toUpperCase().replace(/[^A-Z0-9]/g, "").substring(0, 4);
  const suffix = userId ? userId.toString().padStart(4, "0").slice(-4) : Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${base}${suffix}`;
}

export function ReferralProvider({ children }: { children: ReactNode }) {
  const { user, token, refreshBalance } = useAuth();
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [recentReferrals, setRecentReferrals] = useState<RecentReferral[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchReferralData = useCallback(async () => {
    if (!user || !token) {
      setStats(null);
      setRecentReferrals([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const referralCode = generateReferralCode(user.id, user.username);
      const referralLink = `https://bxbet.asia/ref/${referralCode}`;

      const cachedData = await AsyncStorage.getItem(REFERRAL_CACHE_KEY);
      let cachedStats: Partial<ReferralStats> = {};
      let cachedReferrals: RecentReferral[] = [];

      if (cachedData) {
        try {
          const parsed = JSON.parse(cachedData);
          cachedStats = parsed.stats || {};
          cachedReferrals = parsed.referrals || [];
        } catch {
          // Ignore parse errors
        }
      }

      let apiStats: Partial<ReferralStats> = {};
      let apiReferrals: RecentReferral[] = [];

      try {
        const headers = {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "Authorization": `Bearer ${token}`,
          ...(API_KEY ? { "X-API-Key": API_KEY } : {}),
        };

        const [codeRes, statsRes, rewardsRes, usersRes] = await Promise.all([
          fetch(`${API_BASE_URL}/mobile/refferal/code`, { method: "GET", headers }).catch(() => null),
          fetch(`${API_BASE_URL}/mobile/refferal/stats`, { method: "GET", headers }).catch(() => null),
          fetch(`${API_BASE_URL}/mobile/refferal/rewards`, { method: "GET", headers }).catch(() => null),
          fetch(`${API_BASE_URL}/mobile/refferal/referred-users`, { method: "GET", headers }).catch(() => null),
        ]);

        let codeData: any = null;
        let statsData: any = null;
        let rewardsData: any = null;
        let usersData: any = null;

        if (codeRes?.ok) {
          codeData = await codeRes.json();
        }
        if (statsRes?.ok) {
          statsData = await statsRes.json();
        }
        if (rewardsRes?.ok) {
          rewardsData = await rewardsRes.json();
        }
        if (usersRes?.ok) {
          usersData = await usersRes.json();
        }

        const apiCode = codeData?.data?.code || codeData?.code || codeData?.referral_code;
        const apiLink = codeData?.data?.link || codeData?.link || codeData?.referral_link;

        apiStats = {
          referralCode: apiCode || referralCode,
          referralLink: apiLink || referralLink,
          totalReferrals: statsData?.data?.total_referrals ?? statsData?.total_referrals ?? 0,
          pendingReferrals: statsData?.data?.pending_referrals ?? statsData?.pending_referrals ?? 0,
          totalEarned: parseFloat(rewardsData?.data?.total_earned || rewardsData?.total_earned || "0"),
          pendingRewards: parseFloat(rewardsData?.data?.pending_rewards || rewardsData?.pending_rewards || "0"),
          referrerBonus: parseFloat(rewardsData?.data?.referrer_bonus || rewardsData?.referrer_bonus || "5"),
          refereeBonus: parseFloat(rewardsData?.data?.referee_bonus || rewardsData?.referee_bonus || "5"),
        };

        const usersList = usersData?.data?.users || usersData?.users || usersData?.data || [];
        if (Array.isArray(usersList)) {
          apiReferrals = usersList.map((r: any) => ({
            id: r.id?.toString() || Math.random().toString(),
            username: r.username || r.name || "User",
            date: r.date || r.created_at || new Date().toLocaleDateString(),
            status: r.status === "completed" ? "completed" : "pending",
            bonus: parseFloat(r.bonus || r.reward || "5"),
          }));
        }
      } catch (apiError) {
      }

      const finalStats: ReferralStats = {
        referralCode: apiStats.referralCode || referralCode,
        referralLink: apiStats.referralLink || referralLink,
        totalReferrals: apiStats.totalReferrals ?? cachedStats.totalReferrals ?? 0,
        pendingReferrals: apiStats.pendingReferrals ?? cachedStats.pendingReferrals ?? 0,
        totalEarned: apiStats.totalEarned ?? cachedStats.totalEarned ?? 0,
        pendingRewards: apiStats.pendingRewards ?? cachedStats.pendingRewards ?? 0,
        referrerBonus: apiStats.referrerBonus ?? 5.00,
        refereeBonus: apiStats.refereeBonus ?? 5.00,
      };

      const finalReferrals = apiReferrals.length > 0 ? apiReferrals : cachedReferrals;

      setStats(finalStats);
      setRecentReferrals(finalReferrals);

      await AsyncStorage.setItem(REFERRAL_CACHE_KEY, JSON.stringify({
        stats: finalStats,
        referrals: finalReferrals,
      }));

    } catch (err) {
      console.error("[Referral] Error fetching data:", err);
      setError("Unable to load referral data");
    } finally {
      setIsLoading(false);
    }
  }, [user, token]);

  useEffect(() => {
    if (user && token) {
      fetchReferralData();
    }
  }, [user, token, fetchReferralData]);

  const claimRewards = useCallback(async (): Promise<{ success: boolean; message?: string }> => {
    if (!stats || stats.pendingRewards <= 0) {
      return { success: false, message: "No rewards to claim" };
    }

    if (!token) {
      return { success: false, message: "Please log in to claim rewards" };
    }

    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/mobile/refferal/claim`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "Authorization": `Bearer ${token}`,
          ...(API_KEY ? { "X-API-Key": API_KEY } : {}),
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          const claimedAmount = parseFloat(data.data?.claimed_amount || stats.pendingRewards.toString());
          
          const newStats = {
            ...stats,
            totalEarned: stats.totalEarned + claimedAmount,
            pendingRewards: 0,
            pendingReferrals: 0,
          };

          setStats(newStats);
          setRecentReferrals(recentReferrals.map(r => ({ ...r, status: "completed" as const })));
          
          await AsyncStorage.setItem(REFERRAL_CACHE_KEY, JSON.stringify({
            stats: newStats,
            referrals: recentReferrals.map(r => ({ ...r, status: "completed" as const })),
          }));

          if (refreshBalance) {
            await refreshBalance();
          }

          return { success: true, message: data.message || `$${claimedAmount.toFixed(2)} added to your balance!` };
        } else {
          return { success: false, message: data.error || "Failed to claim rewards" };
        }
      } else {
        return { success: false, message: "Reward claiming is not available yet. Please try again later." };
      }
    } catch (err) {
      console.error("[Referral] Error claiming rewards:", err);
      return { success: false, message: "Failed to claim rewards. Please try again." };
    } finally {
      setIsLoading(false);
    }
  }, [stats, recentReferrals, refreshBalance, token]);

  return (
    <ReferralContext.Provider
      value={{
        stats,
        recentReferrals,
        isLoading,
        error,
        fetchReferralData,
        claimRewards,
      }}
    >
      {children}
    </ReferralContext.Provider>
  );
}

export function useReferral() {
  const context = useContext(ReferralContext);
  if (!context) {
    throw new Error("useReferral must be used within a ReferralProvider");
  }
  return context;
}
