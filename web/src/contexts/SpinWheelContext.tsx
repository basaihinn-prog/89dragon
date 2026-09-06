import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { getWheelConfig, spinWheel, WheelConfig, WheelSpinResult } from '../services/api';
import { useAuth } from './AuthContext';

interface SpinWheelContextType {
  isModalVisible: boolean;
  showModal: () => void;
  hideModal: () => void;
  wheelConfig: WheelConfig | null;
  isLoading: boolean;
  lastResult: WheelSpinResult | null;
  spin: () => Promise<WheelSpinResult | null>;
}

const SpinWheelCtx = createContext<SpinWheelContextType | undefined>(undefined);

export function SpinWheelProvider({ children }: { children: ReactNode }) {
  const { token } = useAuth();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [wheelConfig, setWheelConfig] = useState<WheelConfig | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [lastResult, setLastResult] = useState<WheelSpinResult | null>(null);

  const showModal = useCallback(async () => {
    setIsModalVisible(true);
    if (!token || wheelConfig) return;
    setIsLoading(true);
    const result = await getWheelConfig(token);
    if (result.success && result.data) setWheelConfig(result.data);
    setIsLoading(false);
  }, [token, wheelConfig]);

  const spin = useCallback(async (): Promise<WheelSpinResult | null> => {
    if (!token) return null;
    setIsLoading(true);
    const result = await spinWheel(token);
    setIsLoading(false);
    if (result.success && result.data) {
      setLastResult(result.data);
      return result.data;
    }
    return null;
  }, [token]);

  return (
    <SpinWheelCtx.Provider value={{
      isModalVisible,
      showModal,
      hideModal: () => setIsModalVisible(false),
      wheelConfig, isLoading, lastResult, spin,
    }}>
      {children}
    </SpinWheelCtx.Provider>
  );
}

export function useSpinWheel() {
  const ctx = useContext(SpinWheelCtx);
  if (!ctx) throw new Error('useSpinWheel must be used within SpinWheelProvider');
  return ctx;
}
