import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { getDailyRewardStatus, claimDailyReward } from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";
import { useBonusCredits } from "@/contexts/BonusCreditsContext";

interface DailyBonusContextType {
  canClaimToday: boolean;
  isLoading: boolean;
  rewardAmount: string;
  currentDay: number;
  claimedDays: number[];
  lastClaimed: string | null;
  nextClaimAvailable: string | null;
  isModalVisible: boolean;
  showModal: () => void;
  hideModal: () => void;
  claimBonus: () => Promise<{ success: boolean; amount?: string; newBalance?: string; message?: string }>;
  refreshStatus: () => Promise<void>;
}

const DailyBonusContext = createContext<DailyBonusContextType | undefined>(undefined);

export function DailyBonusProvider({ children }: { children: ReactNode }) {
  const { token, refreshBalance, user } = useAuth();
  const { addBonusCredits, syncLastDepositFromTransactions } = useBonusCredits();
  const [canClaimToday, setCanClaimToday] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [rewardAmount, setRewardAmount] = useState("0.00");
  const [currentDay, setCurrentDay] = useState(1);
  const [claimedDays, setClaimedDays] = useState<number[]>([]);
  const [lastClaimed, setLastClaimed] = useState<string | null>(null);
  const [nextClaimAvailable, setNextClaimAvailable] = useState<string | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);

  const fetchStatus = useCallback(async () => {
    if (!token) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const response = await getDailyRewardStatus(token);
      
      if (response.success && response.data) {
        setCanClaimToday(response.data.can_claim);
        setRewardAmount(response.data.reward_amount || "0.00");
        setLastClaimed(response.data.last_claimed || null);
        setNextClaimAvailable(response.data.next_claim_available || null);
        
        if (response.data.current_day !== undefined) {
          setCurrentDay(response.data.current_day);
        }
        if (response.data.claimed_days !== undefined) {
          setClaimedDays(response.data.claimed_days);
        } else if (response.data.streak !== undefined) {
          const claimed = [];
          for (let i = 1; i < response.data.streak; i++) {
            claimed.push(i);
          }
          setClaimedDays(claimed);
          setCurrentDay(response.data.streak);
        } else if (!response.data.can_claim && response.data.current_day) {
          const claimed = [];
          for (let i = 1; i <= response.data.current_day; i++) {
            claimed.push(i);
          }
          setClaimedDays(claimed);
        }
      }
    } catch (error) {
      console.error("Error fetching daily reward status:", error);
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  const claimBonus = useCallback(async (): Promise<{ success: boolean; amount?: string; newBalance?: string; message?: string }> => {
    if (!token || !canClaimToday) {
      return { success: false, message: "Cannot claim reward at this time" };
    }

    try {
      const response = await claimDailyReward(token);
      
      if (response.success && response.data) {
        setCanClaimToday(false);
        setNextClaimAvailable(response.data.next_claim_available);
        
        setClaimedDays(prev => [...prev, currentDay]);
        
        if (response.data.new_day !== undefined) {
          setCurrentDay(response.data.new_day);
        }
        
        if (refreshBalance) {
          await refreshBalance();
        }
        
        const claimedAmount = parseFloat(response.data.amount_claimed) || 0;
        const rewardCredit = parseFloat(response.data.reward_credit) || 0;
        const totalAmount = claimedAmount + rewardCredit;
        
        if (totalAmount > 0) {
          const syncedDeposit = await syncLastDepositFromTransactions();
          const currentBalance = user?.balance || 0;
          await addBonusCredits(totalAmount, currentBalance, syncedDeposit);
        }
        
        return {
          success: true,
          amount: totalAmount.toFixed(2),
          newBalance: response.data.new_balance,
          message: `Congratulations! You won $${totalAmount.toFixed(2)}!`,
        };
      } else {
        return { success: false, message: response.error || "Failed to claim reward" };
      }
    } catch (error) {
      console.error("Error claiming daily reward:", error);
      return { success: false, message: "An error occurred while claiming reward" };
    }
  }, [token, canClaimToday, currentDay, refreshBalance, user, addBonusCredits, syncLastDepositFromTransactions]);

  const refreshStatus = useCallback(async () => {
    await fetchStatus();
  }, [fetchStatus]);

  const showModal = useCallback(() => {
    setIsModalVisible(true);
  }, []);

  const hideModal = useCallback(() => {
    setIsModalVisible(false);
  }, []);

  return (
    <DailyBonusContext.Provider
      value={{
        canClaimToday,
        isLoading,
        rewardAmount,
        currentDay,
        claimedDays,
        lastClaimed,
        nextClaimAvailable,
        isModalVisible,
        showModal,
        hideModal,
        claimBonus,
        refreshStatus,
      }}
    >
      {children}
    </DailyBonusContext.Provider>
  );
}

export function useDailyBonus() {
  const context = useContext(DailyBonusContext);
  if (!context) {
    throw new Error("useDailyBonus must be used within a DailyBonusProvider");
  }
  return context;
}
