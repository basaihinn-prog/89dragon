import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from "@/contexts/AuthContext";
import { checkForUpdates, UpdateInfo } from "@/services/updateChecker";

export interface AppNotification {
  id: string;
  type: "deposit" | "withdrawal" | "bonus" | "spin" | "update" | "dragonEgg" | "system";
  title: string;
  message: string;
  amount?: number;
  status?: "success" | "pending" | "failed";
  read: boolean;
  createdAt: number;
  data?: any;
}

interface NotificationsContextType {
  notifications: AppNotification[];
  unreadCount: number;
  isModalVisible: boolean;
  showModal: () => void;
  hideModal: () => void;
  addNotification: (notification: Omit<AppNotification, "id" | "read" | "createdAt">) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  deleteNotification: (id: string) => void;
  clearAllNotifications: () => void;
  notifyDeposit: (amount: number, status: "success" | "pending" | "failed") => void;
  notifyWithdrawal: (amount: number, status: "success" | "pending" | "failed") => void;
  notifyBonus: (type: string, amount: number) => void;
  notifySpinResult: (prize: string, amount: number) => void;
  notifyDragonEgg: (day: number, amount: number) => void;
  checkForAppUpdate: () => Promise<void>;
}

const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined);

const NOTIFICATIONS_STORAGE_KEY = "@jade_royale_notifications";
const LAST_UPDATE_CHECK_KEY = "@jade_royale_last_update_check";
const LAST_VERSION_NOTIFIED_KEY = "@jade_royale_last_version_notified";
const UPDATE_CHECK_INTERVAL = 24 * 60 * 60 * 1000;

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const { token } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);

  const unreadCount = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    loadNotifications();
  }, []);

  useEffect(() => {
    if (token) {
      checkForAppUpdate();
      
      const interval = setInterval(() => {
        checkForAppUpdate();
      }, UPDATE_CHECK_INTERVAL);
      
      return () => clearInterval(interval);
    }
  }, [token]);

  const loadNotifications = async () => {
    try {
      const stored = await AsyncStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
        const recentNotifications = parsed.filter(
          (n: AppNotification) => n.createdAt > oneWeekAgo
        );
        setNotifications(recentNotifications);
      }
    } catch (error) {
      console.error("[Notifications] Error loading notifications:", error);
    }
  };

  const saveNotifications = async (newNotifications: AppNotification[]) => {
    try {
      await AsyncStorage.setItem(
        NOTIFICATIONS_STORAGE_KEY,
        JSON.stringify(newNotifications)
      );
    } catch (error) {
      console.error("[Notifications] Error saving notifications:", error);
    }
  };

  const showModal = useCallback(() => {
    setIsModalVisible(true);
  }, []);

  const hideModal = useCallback(() => {
    setIsModalVisible(false);
  }, []);

  const addNotification = useCallback(
    (notification: Omit<AppNotification, "id" | "read" | "createdAt">) => {
      const newNotification: AppNotification = {
        ...notification,
        id: generateId(),
        read: false,
        createdAt: Date.now(),
      };

      setNotifications((prev) => {
        const updated = [newNotification, ...prev].slice(0, 50);
        saveNotifications(updated);
        return updated;
      });
    },
    []
  );

  const markAsRead = useCallback((id: string) => {
    setNotifications((prev) => {
      const updated = prev.map((n) =>
        n.id === id ? { ...n, read: true } : n
      );
      saveNotifications(updated);
      return updated;
    });
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => {
      const updated = prev.map((n) => ({ ...n, read: true }));
      saveNotifications(updated);
      return updated;
    });
  }, []);

  const deleteNotification = useCallback((id: string) => {
    setNotifications((prev) => {
      const updated = prev.filter((n) => n.id !== id);
      saveNotifications(updated);
      return updated;
    });
  }, []);

  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
    saveNotifications([]);
  }, []);

  const notifyDeposit = useCallback(
    (amount: number, status: "success" | "pending" | "failed") => {
      const statusText = status === "success" ? "completed" : status === "pending" ? "pending" : "failed";
      const title = status === "success" ? "Deposit Confirmed" : status === "pending" ? "Deposit Processing" : "Deposit Failed";
      const message =
        status === "success"
          ? `Your deposit of $${amount.toFixed(2)} has been added to your balance.`
          : status === "pending"
          ? `Your deposit of $${amount.toFixed(2)} is being processed.`
          : `Your deposit of $${amount.toFixed(2)} could not be completed.`;

      addNotification({
        type: "deposit",
        title,
        message,
        amount,
        status,
      });
    },
    [addNotification]
  );

  const notifyWithdrawal = useCallback(
    (amount: number, status: "success" | "pending" | "failed") => {
      const title =
        status === "success"
          ? "Withdrawal Complete"
          : status === "pending"
          ? "Withdrawal Requested"
          : "Withdrawal Failed";
      const message =
        status === "success"
          ? `$${amount.toFixed(2)} has been sent to your PayPal.`
          : status === "pending"
          ? `Your withdrawal of $${amount.toFixed(2)} is being processed.`
          : `Your withdrawal of $${amount.toFixed(2)} could not be completed.`;

      addNotification({
        type: "withdrawal",
        title,
        message,
        amount,
        status,
      });
    },
    [addNotification]
  );

  const notifyBonus = useCallback(
    (type: string, amount: number) => {
      addNotification({
        type: "bonus",
        title: "Bonus Credited",
        message: `You received $${amount.toFixed(2)} from ${type}!`,
        amount,
        status: "success",
      });
    },
    [addNotification]
  );

  const notifySpinResult = useCallback(
    (prize: string, amount: number) => {
      addNotification({
        type: "spin",
        title: "Spin Wheel Winner",
        message: `Congratulations! You won ${prize} ($${amount.toFixed(2)}) on the wheel!`,
        amount,
        status: "success",
      });
    },
    [addNotification]
  );

  const notifyDragonEgg = useCallback(
    (day: number, amount: number) => {
      addNotification({
        type: "dragonEgg",
        title: "Dragon Egg Bonus",
        message: `Day ${day} reward: $${amount.toFixed(2)} hatched from your Dragon Egg!`,
        amount,
        status: "success",
      });
    },
    [addNotification]
  );

  const checkForAppUpdate = useCallback(async () => {
    try {
      const lastCheck = await AsyncStorage.getItem(LAST_UPDATE_CHECK_KEY);
      const now = Date.now();

      if (lastCheck) {
        const timeSinceLastCheck = now - parseInt(lastCheck, 10);
        if (timeSinceLastCheck < UPDATE_CHECK_INTERVAL) {
          return;
        }
      }

      await AsyncStorage.setItem(LAST_UPDATE_CHECK_KEY, now.toString());

      const result = await checkForUpdates();

      if (result.updateAvailable && result.updateInfo) {
        const lastNotifiedVersion = await AsyncStorage.getItem(LAST_VERSION_NOTIFIED_KEY);
        const currentVersion = result.updateInfo.versionCode.toString();

        if (lastNotifiedVersion !== currentVersion) {
          await AsyncStorage.setItem(LAST_VERSION_NOTIFIED_KEY, currentVersion);

          addNotification({
            type: "update",
            title: "App Update Available",
            message: `Version ${result.updateInfo.versionName} is now available! ${result.updateInfo.releaseNotes || "Tap to download."}`,
            data: {
              downloadUrl: result.updateInfo.downloadUrl,
              versionName: result.updateInfo.versionName,
              forceUpdate: result.updateInfo.forceUpdate,
            },
          });
        }
      }
    } catch (error) {
      console.error("[Notifications] Error checking for app update:", error);
    }
  }, [addNotification]);

  return (
    <NotificationsContext.Provider
      value={{
        notifications,
        unreadCount,
        isModalVisible,
        showModal,
        hideModal,
        addNotification,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        clearAllNotifications,
        notifyDeposit,
        notifyWithdrawal,
        notifyBonus,
        notifySpinResult,
        notifyDragonEgg,
        checkForAppUpdate,
      }}
    >
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationsContext);
  if (context === undefined) {
    throw new Error("useNotifications must be used within a NotificationsProvider");
  }
  return context;
}
