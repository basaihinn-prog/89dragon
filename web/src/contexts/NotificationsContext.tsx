import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { getNotifications, markNotificationRead } from '../services/api';
import { useAuth } from './AuthContext';

interface Notification {
  id: number;
  title: string;
  message: string;
  read: boolean;
  created_at: string;
}

interface NotificationsContextType {
  notifications: Notification[];
  unreadCount: number;
  isModalVisible: boolean;
  showModal: () => void;
  hideModal: () => void;
  markRead: (id: number) => Promise<void>;
  loadNotifications: () => Promise<void>;
}

const NotificationsCtx = createContext<NotificationsContextType | undefined>(undefined);

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const { token } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);

  const loadNotifications = useCallback(async () => {
    if (!token) return;
    const result = await getNotifications(token);
    if (result.success && result.data) {
      const data = result.data as any;
      const notifs = Array.isArray(data) ? data : data.notifications || [];
      setNotifications(notifs);
    }
  }, [token]);

  useEffect(() => { loadNotifications(); }, [loadNotifications]);

  const markRead = useCallback(async (id: number) => {
    if (!token) return;
    await markNotificationRead(token, id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  }, [token]);

  return (
    <NotificationsCtx.Provider value={{
      notifications,
      unreadCount: notifications.filter(n => !n.read).length,
      isModalVisible,
      showModal: () => { setIsModalVisible(true); loadNotifications(); },
      hideModal: () => setIsModalVisible(false),
      markRead,
      loadNotifications,
    }}>
      {children}
    </NotificationsCtx.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationsCtx);
  if (!ctx) throw new Error('useNotifications must be used within NotificationsProvider');
  return ctx;
}
