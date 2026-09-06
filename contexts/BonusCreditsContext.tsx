import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from "@/contexts/AuthContext";
import { getAvailableBonuses, claimBonus, Bonus, getTransactions } from "@/services/api";

interface BonusCashoutRequirement {
  bonusCreditsTotal: number;
  lastDepositAmount: number;
  hadDepositWhenBonusAdded: boolean;
  minimumCashout: number;
  bonusPlaythroughRequired: number;
  depositPlaythroughRequired: number;
  totalPlaythroughRequired: number;
}

interface BonusCreditsContextType {
  bonusCredits: number;
  lastDepositAmount: number;
  hadDepositWhenBonusAdded: boolean;
  cashoutRequirement: BonusCashoutRequirement;
  isLoading: boolean;
  addBonusCredits: (amount: number, currentBalance: number, syncedDepositAmount?: number) => Promise<void>;
  updateLastDeposit: (amount: number) => Promise<void>;
  syncLastDepositFromTransactions: () => Promise<number>;
  resetBonusTracker: () => Promise<void>;
  checkAndResetIfBalanceZero: (balance: number) => Promise<void>;
  refreshBonusData: () => Promise<void>;
}

const BonusCreditsContext = createContext<BonusCreditsContextType | undefined>(undefined);

const BONUS_CREDITS_KEY = "@jade_royale_bonus_credits";
const LAST_DEPOSIT_KEY = "@jade_royale_last_deposit";
const HAD_DEPOSIT_KEY = "@jade_royale_had_deposit_when_bonus";

const BONUS_MULTIPLIER = 5;
const DEPOSIT_MULTIPLIER = 3;

export function BonusCreditsProvider({ children }: { children: ReactNode }) {
  const { user, token } = useAuth();
  const [bonusCredits, setBonusCredits] = useState(0);
  const [lastDepositAmount, setLastDepositAmount] = useState(0);
  const [hadDepositWhenBonusAdded, setHadDepositWhenBonusAdded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const calculateCashoutRequirement = useCallback((): BonusCashoutRequirement => {
    const bonusPlaythroughRequired = bonusCredits * BONUS_MULTIPLIER;
    const depositPlaythroughRequired = hadDepositWhenBonusAdded ? lastDepositAmount * DEPOSIT_MULTIPLIER : 0;
    const totalPlaythroughRequired = depositPlaythroughRequired + bonusPlaythroughRequired;
    const minimumCashout = totalPlaythroughRequired;

    return {
      bonusCreditsTotal: bonusCredits,
      lastDepositAmount,
      hadDepositWhenBonusAdded,
      minimumCashout,
      bonusPlaythroughRequired,
      depositPlaythroughRequired,
      totalPlaythroughRequired,
    };
  }, [bonusCredits, lastDepositAmount, hadDepositWhenBonusAdded]);

  const loadStoredData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [storedBonus, storedDeposit, storedHadDeposit] = await Promise.all([
        AsyncStorage.getItem(BONUS_CREDITS_KEY),
        AsyncStorage.getItem(LAST_DEPOSIT_KEY),
        AsyncStorage.getItem(HAD_DEPOSIT_KEY),
      ]);

      if (storedBonus) {
        setBonusCredits(parseFloat(storedBonus) || 0);
      }
      if (storedDeposit) {
        setLastDepositAmount(parseFloat(storedDeposit) || 0);
      }
      if (storedHadDeposit) {
        setHadDepositWhenBonusAdded(storedHadDeposit === "true");
      }
    } catch (error) {
      console.error("Error loading bonus credits data:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStoredData();
  }, [loadStoredData]);

  const updateLastDeposit = useCallback(async (amount: number) => {
    try {
      setLastDepositAmount(amount);
      await AsyncStorage.setItem(LAST_DEPOSIT_KEY, amount.toString());
    } catch (error) {
      console.error("Error updating last deposit amount:", error);
    }
  }, []);

  const syncLastDepositFromTransactions = useCallback(async (): Promise<number> => {
    if (!token) return 0;
    
    const bonusTitlePatterns = [
      "daily reward",
      "daily bonus",
      "spin bonus",
      "spin wheel",
      "bonus",
      "free spin",
      "reward claimed",
      "promo",
      "promotion",
      "refund",
    ];
    
    const isBonusTransaction = (title: string): boolean => {
      const lowerTitle = title.toLowerCase();
      return bonusTitlePatterns.some((pattern) => lowerTitle.includes(pattern));
    };
    
    try {
      const result = await getTransactions(token);
      if (result.success && result.data) {
        const deposits = result.data
          .filter((t) => {
            const isDepositType = t.type === "deposit" || t.type === "add" || t.type === "credit";
            const isNotBonus = !t.title || !isBonusTransaction(t.title);
            return isDepositType && isNotBonus;
          })
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        
        if (deposits.length > 0) {
          const latestDeposit = deposits[0];
          const depositAmount = Math.abs(parseFloat(latestDeposit.sum) || 0);
          if (depositAmount > 0) {
            setLastDepositAmount(depositAmount);
            await AsyncStorage.setItem(LAST_DEPOSIT_KEY, depositAmount.toString());
            return depositAmount;
          }
        }
      }
      return 0;
    } catch (error) {
      console.error("Error syncing last deposit from transactions:", error);
      return 0;
    }
  }, [token]);

  useEffect(() => {
    if (token) {
      syncLastDepositFromTransactions();
    }
  }, [token, syncLastDepositFromTransactions]);

  useEffect(() => {
    if (user && user.balance === 0) {
      checkAndResetIfBalanceZero(0);
    }
  }, [user?.balance]);

  const addBonusCredits = useCallback(async (amount: number, currentBalance: number, syncedDepositAmount?: number) => {
    try {
      const newBonusCredits = bonusCredits + amount;
      const depositToCheck = syncedDepositAmount !== undefined && syncedDepositAmount > 0 
        ? syncedDepositAmount 
        : lastDepositAmount;
      const hasExistingDeposit = depositToCheck > 0;

      setBonusCredits(newBonusCredits);
      await AsyncStorage.setItem(BONUS_CREDITS_KEY, newBonusCredits.toString());

      if (hasExistingDeposit && !hadDepositWhenBonusAdded) {
        setHadDepositWhenBonusAdded(true);
        await AsyncStorage.setItem(HAD_DEPOSIT_KEY, "true");
        if (syncedDepositAmount !== undefined && syncedDepositAmount > 0) {
          setLastDepositAmount(syncedDepositAmount);
          await AsyncStorage.setItem(LAST_DEPOSIT_KEY, syncedDepositAmount.toString());
        }
      }
    } catch (error) {
      console.error("Error adding bonus credits:", error);
    }
  }, [bonusCredits, lastDepositAmount, hadDepositWhenBonusAdded]);

  const resetBonusTracker = useCallback(async () => {
    try {
      setBonusCredits(0);
      setLastDepositAmount(0);
      setHadDepositWhenBonusAdded(false);

      await Promise.all([
        AsyncStorage.setItem(BONUS_CREDITS_KEY, "0"),
        AsyncStorage.setItem(LAST_DEPOSIT_KEY, "0"),
        AsyncStorage.setItem(HAD_DEPOSIT_KEY, "false"),
      ]);
    } catch (error) {
      console.error("Error resetting bonus tracker:", error);
    }
  }, []);

  const checkAndResetIfBalanceZero = useCallback(async (balance: number) => {
    if (balance === 0 && bonusCredits > 0) {
      await resetBonusTracker();
    }
  }, [bonusCredits, resetBonusTracker]);

  const refreshBonusData = useCallback(async () => {
    await loadStoredData();
  }, [loadStoredData]);

  const cashoutRequirement = calculateCashoutRequirement();

  return (
    <BonusCreditsContext.Provider
      value={{
        bonusCredits,
        lastDepositAmount,
        hadDepositWhenBonusAdded,
        cashoutRequirement,
        isLoading,
        addBonusCredits,
        updateLastDeposit,
        syncLastDepositFromTransactions,
        resetBonusTracker,
        checkAndResetIfBalanceZero,
        refreshBonusData,
      }}
    >
      {children}
    </BonusCreditsContext.Provider>
  );
}

export function useBonusCredits() {
  const context = useContext(BonusCreditsContext);
  if (!context) {
    throw new Error("useBonusCredits must be used within a BonusCreditsProvider");
  }
  return context;
}
