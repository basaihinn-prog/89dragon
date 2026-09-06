import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { getDailyRewardStatus, claimDailyReward, DailyRewardStatus } from '../services/api';
import { useAuth } from './AuthContext';

interface DailyBonusContextType {
  canClaimToday: boolean;
  rewardStatus: DailyRewardStatus | null;
  isLoading: boolean;
  isModalVisible: boolean;
  showModal: () => void;
  hideModal: () => void;
  claimBonus: () => Promise<boolean>;
}

const DailyBonusCtx = createContext<DailyBonusContextType | undefined>(undefined);

export function DailyBonusProvider({ children }: { children: ReactNode }) {
  const { token } = useAuth();
  const [rewardStatus, setRewardStatus] = useState<DailyRewardStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);

  const loadStatus = useCallback(async () => {
    if (!token) return;
    const result = await getDailyRewardStatus(token);
    if (result.success && result.data) setRewardStatus(result.data);
  }, [token]);

  useEffect(() => { loadStatus(); }, [loadStatus]);

  const claimBonus = useCallback(async (): Promise<boolean> => {
    if (!token) return false;
    setIsLoading(true);
    const result = await claimDailyReward(token);
    setIsLoading(false);
    if (result.success) {
      await loadStatus();
      return true;
    }
    return false;
  }, [token, loadStatus]);

  return (
    <DailyBonusCtx.Provider value={{
      canClaimToday: rewardStatus?.can_claim ?? false,
      rewardStatus, isLoading,
      isModalVisible,
      showModal: () => setIsModalVisible(true),
      hideModal: () => setIsModalVisible(false),
      claimBonus,
    }}>
      {children}
    </DailyBonusCtx.Provider>
  );
}

export function useDailyBonus() {
  const ctx = useContext(DailyBonusCtx);
  if (!ctx) throw new Error('useDailyBonus must be used within DailyBonusProvider');
  return ctx;
}
