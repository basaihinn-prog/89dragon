import React, { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from "react";
import { Platform, LogBox } from "react-native";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import Constants from "expo-constants";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from "@/contexts/AuthContext";

LogBox.ignoreLogs([
  "expo-notifications",
  "`expo-notifications` functionality is not fully supported",
  "Android Push notifications",
]);

const isExpoGo = Constants.appOwnership === "expo";

if (Platform.OS !== "web" && !isExpoGo) {
  try {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
  } catch (e) {
  }
}

interface PushNotificationsContextType {
  expoPushToken: string | null;
  isEnabled: boolean;
  isLoading: boolean;
  enableNotifications: () => Promise<boolean>;
  disableNotifications: () => void;
  scheduleSpinWheelReminder: (timeUntilAvailableMs: number) => Promise<void>;
  scheduleDailyBonusReminder: () => Promise<void>;
  cancelAllNotifications: () => Promise<void>;
}

const PushNotificationsContext = createContext<PushNotificationsContextType | undefined>(undefined);

const NOTIFICATIONS_ENABLED_KEY = "@jade_royale_push_enabled";
const PUSH_TOKEN_KEY = "@jade_royale_push_token";
const SPIN_NOTIFICATION_ID = "spin_wheel_reminder";
const DAILY_BONUS_NOTIFICATION_ID = "daily_bonus_reminder";

export function PushNotificationsProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [isEnabled, setIsEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const notificationListener = useRef<Notifications.EventSubscription | null>(null);
  const responseListener = useRef<Notifications.EventSubscription | null>(null);

  useEffect(() => {
    loadSettings();
    
    if (!isExpoGo && Platform.OS !== "web") {
      try {
        notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
        });

        responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
        });
      } catch (e) {
      }
    }

    return () => {
      if (notificationListener.current) {
        try {
          notificationListener.current.remove();
        } catch (e) {
        }
      }
      if (responseListener.current) {
        try {
          responseListener.current.remove();
        } catch (e) {
        }
      }
    };
  }, []);

  const loadSettings = async () => {
    try {
      const enabled = await AsyncStorage.getItem(NOTIFICATIONS_ENABLED_KEY);
      const token = await AsyncStorage.getItem(PUSH_TOKEN_KEY);
      
      if (enabled === "true") {
        setIsEnabled(true);
        if (token) {
          setExpoPushToken(token);
        }
      }
    } catch (error) {
      console.error("[PushNotifications] Error loading settings:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const registerForPushNotifications = async (): Promise<string | null> => {
    if (Platform.OS === "web") {
      return null;
    }

    if (!Device.isDevice) {
      return null;
    }

    if (isExpoGo) {
      return null;
    }

    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== "granted") {
        return null;
      }

      if (Platform.OS === "android") {
        await Notifications.setNotificationChannelAsync("default", {
          name: "Jade Royale",
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: "#10B981",
          sound: "default",
        });
      }

      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId: undefined,
      });
      
      return tokenData.data;
    } catch (error) {
      console.error("[PushNotifications] Error registering:", error);
      return null;
    }
  };

  const enableNotifications = useCallback(async (): Promise<boolean> => {
    setIsLoading(true);
    try {
      const token = await registerForPushNotifications();
      
      if (token) {
        setExpoPushToken(token);
        setIsEnabled(true);
        await AsyncStorage.setItem(NOTIFICATIONS_ENABLED_KEY, "true");
        await AsyncStorage.setItem(PUSH_TOKEN_KEY, token);
        
        await scheduleInitialReminders();
        
        return true;
      }
      return false;
    } catch (error) {
      console.error("[PushNotifications] Error enabling:", error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const disableNotifications = useCallback(async () => {
    setIsEnabled(false);
    await AsyncStorage.setItem(NOTIFICATIONS_ENABLED_KEY, "false");
    await cancelAllNotifications();
  }, []);

  const scheduleInitialReminders = async () => {
    if (Platform.OS === "web" || isExpoGo) return;

    try {
      await Notifications.cancelAllScheduledNotificationsAsync();

      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(9, 0, 0, 0);

      const secondsUntilReminder = Math.floor((tomorrow.getTime() - now.getTime()) / 1000);

      if (secondsUntilReminder > 0) {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: "Daily Dragon Egg Ready!",
            body: "Your daily bonus is waiting! Tap a dragon egg to claim your reward.",
            sound: "default",
            data: { type: "daily_bonus" },
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
            seconds: secondsUntilReminder,
          },
        });
      }
    } catch (error) {
      console.error("[PushNotifications] Error scheduling initial reminders:", error);
    }
  };

  const scheduleSpinWheelReminder = useCallback(async (timeUntilAvailableMs: number) => {
    if (Platform.OS === "web" || isExpoGo) return;

    const enabledNow = await AsyncStorage.getItem(NOTIFICATIONS_ENABLED_KEY);
    if (enabledNow !== "true") return;

    try {
      if (timeUntilAvailableMs <= 0) return;

      const triggerSeconds = Math.max(Math.floor(timeUntilAvailableMs / 1000), 60);

      await Notifications.scheduleNotificationAsync({
        content: {
          title: "Spin Wheel Ready!",
          body: "Your hourly spin is now available. Tap to spin and win!",
          sound: "default",
          data: { type: "spin_wheel" },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: triggerSeconds,
        },
      });
    } catch (error) {
      console.error("[PushNotifications] Error scheduling spin reminder:", error);
    }
  }, []);

  const scheduleDailyBonusReminder = useCallback(async () => {
    if (Platform.OS === "web" || isExpoGo) return;

    const enabledNow = await AsyncStorage.getItem(NOTIFICATIONS_ENABLED_KEY);
    if (enabledNow !== "true") return;

    try {
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(9, 0, 0, 0);

      const secondsUntilReminder = Math.floor((tomorrow.getTime() - now.getTime()) / 1000);

      if (secondsUntilReminder > 0) {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: "Daily Dragon Egg Ready!",
            body: "Your daily bonus is waiting! Tap a dragon egg to claim your reward.",
            sound: "default",
            data: { type: "daily_bonus" },
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
            seconds: secondsUntilReminder,
          },
        });
      }
    } catch (error) {
      console.error("[PushNotifications] Error scheduling daily reminder:", error);
    }
  }, []);

  const cancelAllNotifications = useCallback(async () => {
    if (Platform.OS === "web" || isExpoGo) return;
    
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
    } catch (error) {
    }
  }, []);

  return (
    <PushNotificationsContext.Provider
      value={{
        expoPushToken,
        isEnabled,
        isLoading,
        enableNotifications,
        disableNotifications,
        scheduleSpinWheelReminder,
        scheduleDailyBonusReminder,
        cancelAllNotifications,
      }}
    >
      {children}
    </PushNotificationsContext.Provider>
  );
}

export function usePushNotifications() {
  const context = useContext(PushNotificationsContext);
  if (!context) {
    throw new Error("usePushNotifications must be used within a PushNotificationsProvider");
  }
  return context;
}
