"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { Notification } from '@/lib/types/notifications';
import { fetchFromApi } from '@/lib/api-client';
import { useAuth } from '@/components/auth/auth-provider';

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  dismissNotification: (id: string) => Promise<void>;
  refreshNotifications: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = useCallback(async () => {
    if (!user) {
      setNotifications([]);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const res = await fetchFromApi('/notifications');
      const data = await res.json();
      setNotifications(data.notifications.map((n: any) => ({...n, timestamp: new Date(n.created_at)})));
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const dismissNotification = async (id: string) => {
    // Optimistically remove from UI
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    
    try {
      // Send delete request to backend
      await fetchFromApi(`/notifications/${id}`, { method: 'DELETE' });
    } catch (error) {
      console.error("Failed to dismiss notification:", error);
      // If API call fails, revert the change
      fetchNotifications(); 
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, loading, dismissNotification, refreshNotifications: fetchNotifications }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}