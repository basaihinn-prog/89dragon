import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from "@/contexts/AuthContext";
import { checkForUpdates, UpdateInfo } from "@/services/updateChecker";

export interface AppNotification {
  id: string;
  type: "deposit" | "withdrawal" | "bonus" | "spin" | "update" | "dragonEgg" | "checkin" | "system";
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

  const saveNotifications = async (items: AppNotification[]) => {
    try {
      await AsyncStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(items));
    } catch (error) {
      console.error("[Notifications] Error saving notifications:", error);
    }
  };

  const addNotification = useCallback((notification: Omit<AppNotification, "id" | "read" | "createdAt">) => {
    setNotifications((prev) => {
      const next = [
        {
          ...notification,
          id: generateId(),
          read: false,
          createdAt: Date.now(),
        },
        ...prev,
      ].slice(0, 100);
      saveNotifications(next);
      return next;
    });
  }, []);

  const markAsRead = useCallback((id: string) => {
    setNotifications((prev) => {
      const next = prev.map((item) => item.id === id ? { ...item, read: true } : item);
      saveNotifications(next);
      return next;
    });
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => {
      const next = prev.map((item) => ({ ...item, read: true }));
      saveNotifications(next);
      return next;
    });
  }, []);

  const deleteNotification = useCallback((id: string) => {
    setNotifications((prev) => {
      const next = prev.filter((item) => item.id !== id);
      saveNotifications(next);
      return next;
    });
  }, []);

  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
    AsyncStorage.removeItem(NOTIFICATIONS_STORAGE_KEY).catch(() => {});
  }, []);

  const notifyDeposit = useCallback((amount: number, status: "success" | "pending" | "failed") => {
    addNotification({
      type: "deposit",
      title: status === "success" ? "Deposit Complete" : status === "pending" ? "Deposit Pending" : "Deposit Failed",
      message: `Deposit ${status}: ${amount.toFixed(2)}`,
      amount,
      status,
    });
  }, [addNotification]);

  const notifyWithdrawal = useCallback((amount: number, status: "success" | "pending" | "failed") => {
    addNotification({
      type: "withdrawal",
      title: status === "success" ? "Withdrawal Complete" : status === "pending" ? "Withdrawal Pending" : "Withdrawal Failed",
      message: `Withdrawal ${status}: ${amount.toFixed(2)}`,
      amount,
      status,
    });
  }, [addNotification]);

  const notifyBonus = useCallback((type: string, amount: number) => {
    addNotification({
      type: "bonus",
      title: "Bonus Received",
      message: `${type}: ${amount.toFixed(2)}`,
      amount,
      status: "success",
    });
  }, [addNotification]);

  const notifySpinResult = useCallback((prize: string, amount: number) => {
    addNotification({
      type: "spin",
      title: "Spin Result",
      message: prize,
      amount,
      status: "success",
    });
  }, [addNotification]);

  const notifyDragonEgg = useCallback((day: number, amount: number) => {
    addNotification({
      type: "dragonEgg",
      title: "Dragon Egg Bonus",
      message: `Day ${day} reward: ${amount.toFixed(2)}`,
      amount,
      status: "success",
    });
  }, [addNotification]);

  const checkForAppUpdate = useCallback(async () => {
    try {
      const lastCheckRaw = await AsyncStorage.getItem(LAST_UPDATE_CHECK_KEY);
      const lastCheck = Number(lastCheckRaw || 0);
      if (Date.now() - lastCheck < UPDATE_CHECK_INTERVAL) return;

      await AsyncStorage.setItem(LAST_UPDATE_CHECK_KEY, String(Date.now()));
      const info: UpdateInfo = await checkForUpdates();
      if (!info?.updateAvailable) return;

      const versionKey = String(info.latestVersion || info.latestVersionCode || "latest");
      const lastNotified = await AsyncStorage.getItem(LAST_VERSION_NOTIFIED_KEY);
      if (lastNotified === versionKey) return;

      addNotification({
        type: "update",
        title: "App Update Available",
        message: info.message || "A new version of Jade Royale is available.",
        status: "success",
        data: info,
      });
      await AsyncStorage.setItem(LAST_VERSION_NOTIFIED_KEY, versionKey);
    } catch (error) {
      console.error("[Notifications] Error checking for app update:", error);
    }
  }, [addNotification]);

  return (
    <NotificationsContext.Provider value={{
      notifications,
      unreadCount,
      isModalVisible,
      showModal: () => setIsModalVisible(true),
      hideModal: () => setIsModalVisible(false),
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
    }}>
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationsContext);
  if (!context) throw new Error("useNotifications must be used within NotificationsProvider");
  return context;
}
