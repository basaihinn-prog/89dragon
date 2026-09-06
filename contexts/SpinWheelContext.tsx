import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from "@/contexts/AuthContext";
import { API_BASE_URL, API_KEY } from "@/services/config";

interface WheelPrize {
  label: string;
  amount: number;
  color: string;
}

interface SpinWheelContextType {
  canSpin: boolean;
  isLoading: boolean;
  isModalVisible: boolean;
  lastSpinTime: number | null;
  timeUntilNextSpin: string;
  spinsRemaining: number;
  wheelPrizes: WheelPrize[];
  showModal: () => void;
  hideModal: () => void;
  spinWheel: () => Promise<{ 
    success: boolean; 
    prize?: string; 
    amount?: number; 
    message?: string; 
    prizeIndex?: number;
  }>;
  checkSpinEligibility: () => Promise<void>;
}

const SpinWheelContext = createContext<SpinWheelContextType | undefined>(undefined);

const SPIN_COOLDOWN_MS = 60 * 60 * 1000;
const STORAGE_KEY = "jade_royale_last_spin";

const DEFAULT_PRIZES: WheelPrize[] = [
  { label: "$0.25", amount: 0.25, color: "#10B981" },
  { label: "$0.50", amount: 0.5, color: "#3B82F6" },
  { label: "$0.25", amount: 0.25, color: "#10B981" },
  { label: "$1.00", amount: 1, color: "#8B5CF6" },
  { label: "$0.50", amount: 0.5, color: "#3B82F6" },
  { label: "$0.25", amount: 0.25, color: "#10B981" },
  { label: "$2.00", amount: 2, color: "#F59E0B" },
  { label: "Good Luck", amount: 0, color: "#4A5568" },
  { label: "$0.50", amount: 0.5, color: "#3B82F6" },
  { label: "$1.00", amount: 1, color: "#8B5CF6" },
  { label: "$0.25", amount: 0.25, color: "#10B981" },
  { label: "$3.00", amount: 3, color: "#EC4899" },
  { label: "$0.50", amount: 0.5, color: "#3B82F6" },
  { label: "$0.25", amount: 0.25, color: "#10B981" },
  { label: "$5.00", amount: 5, color: "#EF4444" },
  { label: "Good Luck", amount: 0, color: "#4A5568" },
];

function formatTimeRemaining(ms: number): string {
  if (ms <= 0) return "Available now!";
  
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    const remainingMins = minutes % 60;
    return `${hours}h ${remainingMins}m`;
  }
  
  return `${minutes}m ${seconds}s`;
}

function getWeightedPrizeIndex(prizes: WheelPrize[]): number {
  const weights = prizes.map((p) => {
    if (p.amount === 0) return 8;
    if (p.amount <= 0.25) return 15;
    if (p.amount <= 0.5) return 12;
    if (p.amount <= 1) return 8;
    if (p.amount <= 2) return 4;
    if (p.amount <= 3) return 3;
    return 1;
  });
  
  const totalWeight = weights.reduce((a, b) => a + b, 0);
  let random = Math.random() * totalWeight;
  
  for (let i = 0; i < weights.length; i++) {
    random -= weights[i];
    if (random <= 0) return i;
  }
  
  return 0;
}

export function SpinWheelProvider({ children }: { children: ReactNode }) {
  const { token, setBalance, user, refreshBalance } = useAuth();
  const [canSpin, setCanSpin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [lastSpinTime, setLastSpinTime] = useState<number | null>(null);
  const [timeUntilNextSpin, setTimeUntilNextSpin] = useState<string>("");
  const [spinsRemaining, setSpinsRemaining] = useState(0);
  const [wheelPrizes] = useState<WheelPrize[]>(DEFAULT_PRIZES);

  const checkSpinEligibility = useCallback(async () => {
    try {
      setIsLoading(true);
      
      const storedTime = await AsyncStorage.getItem(STORAGE_KEY);
      const lastSpin = storedTime ? parseInt(storedTime, 10) : null;
      
      setLastSpinTime(lastSpin);
      
      if (!lastSpin) {
        setCanSpin(true);
        setSpinsRemaining(1);
        setTimeUntilNextSpin("Available now!");
      } else {
        const timeSinceSpin = Date.now() - lastSpin;
        const timeRemaining = SPIN_COOLDOWN_MS - timeSinceSpin;
        
        if (timeRemaining <= 0) {
          setCanSpin(true);
          setSpinsRemaining(1);
          setTimeUntilNextSpin("Available now!");
        } else {
          setCanSpin(false);
          setSpinsRemaining(0);
          setTimeUntilNextSpin(formatTimeRemaining(timeRemaining));
        }
      }
    } catch (error) {
      console.error("[SpinWheel] Error checking eligibility:", error);
      setCanSpin(true);
      setSpinsRemaining(1);
      setTimeUntilNextSpin("Available now!");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkSpinEligibility();
  }, [checkSpinEligibility]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (lastSpinTime) {
        const timeSinceSpin = Date.now() - lastSpinTime;
        const timeRemaining = SPIN_COOLDOWN_MS - timeSinceSpin;
        
        if (timeRemaining <= 0) {
          setCanSpin(true);
          setSpinsRemaining(1);
          setTimeUntilNextSpin("Available now!");
        } else {
          setCanSpin(false);
          setSpinsRemaining(0);
          setTimeUntilNextSpin(formatTimeRemaining(timeRemaining));
        }
      }
    }, 1000);
    
    return () => clearInterval(interval);
  }, [lastSpinTime]);

  const showModal = useCallback(() => {
    setIsModalVisible(true);
  }, []);

  const hideModal = useCallback(() => {
    setIsModalVisible(false);
  }, []);

  const callSpinAPI = async (): Promise<{ 
    success: boolean; 
    amount: number; 
    prizeIndex: number;
    rewardCredit: number;
    message?: string;
  }> => {
    if (!token) {
      return { success: false, amount: 0, prizeIndex: 0, rewardCredit: 0, message: "Not authenticated" };
    }
    
    try {
      const response = await fetch(`${API_BASE_URL}/mobile/wheel-fortune/spin`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "Authorization": `Bearer ${token}`,
          ...(API_KEY ? { "X-API-Key": API_KEY } : {}),
        },
        body: JSON.stringify({}),
      });

      const data = await response.json();
      console.log("[SpinWheel] Spin API response:", data);
      
      if (response.ok && data.success !== false) {
        // Server response format: {success, wheel, position, prize, prize_amount, new_balance, wager_deducted}
        const amount = parseFloat(data.prize_amount || data.amount || data.prize || data.data?.prize_amount || 0) || 0;
        const rewardCredit = parseFloat(data.reward_credit || data.rewardCredit || data.bonus || 0) || 0;
        const prizeIndex = data.position ? data.position - 1 : (data.prize_index ?? getWeightedPrizeIndex(wheelPrizes));
        
        console.log("[SpinWheel] API spin result - Amount:", amount, "Reward Credit:", rewardCredit, "Prize Index:", prizeIndex);
        
        // Update balance if provided by API (server returns new_balance as string like "84.27")
        if (data.new_balance !== undefined && setBalance) {
          const newBalance = parseFloat(data.new_balance);
          console.log("[SpinWheel] Setting balance from API:", newBalance);
          await setBalance(newBalance);
        } else if (refreshBalance) {
          // Refresh balance from server after a short delay
          setTimeout(() => refreshBalance(), 1500);
        }
        
        return { success: true, amount, prizeIndex, rewardCredit };
      } else {
        const errorMsg = data.message || data.error || "Spin failed";
        console.warn("[SpinWheel] API returned error:", errorMsg);
        return { success: false, amount: 0, prizeIndex: 0, rewardCredit: 0, message: errorMsg };
      }
    } catch (error) {
      console.error("[SpinWheel] Error calling spin API:", error);
      return { success: false, amount: 0, prizeIndex: 0, rewardCredit: 0, message: "Network error" };
    }
  };

  const spinWheel = useCallback(async (): Promise<{ 
    success: boolean; 
    prize?: string; 
    amount?: number; 
    rewardCredit?: number;
    message?: string; 
    prizeIndex?: number;
  }> => {
    if (!canSpin) {
      return { success: false, message: `Next spin in ${timeUntilNextSpin}` };
    }

    setIsLoading(true);

    try {
      // Call the API first to get the prize from the server
      const apiResult = await callSpinAPI();
      
      if (!apiResult.success) {
        console.warn("[SpinWheel] API failed, using local spin as fallback");
        // Fallback to local spin if API fails
        const prizeIndex = getWeightedPrizeIndex(wheelPrizes);
        const prize = wheelPrizes[prizeIndex];
        
        return {
          success: true,
          prize: prize.label,
          amount: prize.amount,
          rewardCredit: 0,
          message: apiResult.message || (prize.amount > 0 ? `You won ${prize.label}!` : "Better luck next time!"),
          prizeIndex,
        };
      }
      
      // Update local state to track cooldown
      const now = Date.now();
      await AsyncStorage.setItem(STORAGE_KEY, now.toString());
      setLastSpinTime(now);
      setCanSpin(false);
      setSpinsRemaining(0);
      setTimeUntilNextSpin(formatTimeRemaining(SPIN_COOLDOWN_MS));
      
      const finalAmount = apiResult.amount + apiResult.rewardCredit;
      
      let message = "Better luck next time!";
      if (finalAmount > 0) {
        message = `Congratulations! You won $${finalAmount.toFixed(2)}!`;
      }
      
      console.log("[SpinWheel] Server prize:", apiResult.amount, "Reward Credit:", apiResult.rewardCredit, "Total:", finalAmount);
      
      return {
        success: true,
        prize: finalAmount > 0 ? `$${finalAmount.toFixed(2)}` : "Good Luck",
        amount: finalAmount,
        rewardCredit: apiResult.rewardCredit,
        message,
        prizeIndex: apiResult.prizeIndex,
      };
    } catch (error) {
      console.error("[SpinWheel] Error spinning wheel:", error);
      return { success: false, message: "An error occurred. Please try again." };
    } finally {
      setIsLoading(false);
    }
  }, [canSpin, timeUntilNextSpin, token, wheelPrizes, callSpinAPI]);

  return (
    <SpinWheelContext.Provider
      value={{
        canSpin,
        isLoading,
        isModalVisible,
        lastSpinTime,
        timeUntilNextSpin,
        spinsRemaining,
        wheelPrizes,
        showModal,
        hideModal,
        spinWheel,
        checkSpinEligibility,
      }}
    >
      {children}
    </SpinWheelContext.Provider>
  );
}

export function useSpinWheel() {
  const context = useContext(SpinWheelContext);
  if (!context) {
    throw new Error("useSpinWheel must be used within a SpinWheelProvider");
  }
  return context;
}
