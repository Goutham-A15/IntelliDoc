"use client";

import { useState, useEffect } from 'react';
import type { Notification } from '@/lib/types/notifications';
import { fetchFromApi } from '@/lib/api-client';

// Keep some static notifications for demonstration, but remove the dynamic ones
const staticNotifications: Notification[] = [
  {
    id: 'system-1',
    category: 'system',
    title: 'New Feature: PDF Export',
    description: 'You can now export your detailed analysis reports as a PDF.',
    timestamp: new Date(new Date().getTime() - 1000 * 60 * 60 * 24), // 1 day ago
    read: true,
  },
  {
    id: 'account-1',
    category: 'account',
    title: 'New Login Detected',
    description: 'Your account was accessed from a new device in Warangal, India.',
    timestamp: new Date(new Date().getTime() - 1000 * 60 * 60 * 24 * 2), // 2 days ago
    read: true,
  },
];

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>(staticNotifications);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDynamicNotifications = async () => {
      try {
        const dynamicNotifications: Notification[] = [];
        
        // 1. Fetch usage data for credit alerts
        const usageRes = await fetchFromApi("/usage");
        const usageData = await usageRes.json();
        
        if (usageData.credits <= 5 && usageData.subscription_tier === 'free') {
          dynamicNotifications.push({
            id: 'billing-1',
            category: 'billing',
            title: 'Credits Low',
            description: `You have only ${usageData.credits} free credits left. Upgrade for more!`,
            timestamp: new Date(),
            read: false,
          });
        }
        
        // 2. Fetch history for the latest report
        const historyRes = await fetchFromApi("/history");
        const historyData = await historyRes.json();

        if (historyData.history && historyData.history.length > 0) {
          const latestReport = historyData.history[0];
          const docNames = latestReport.document_names.join(' & ');
          dynamicNotifications.push({
            id: `report-${latestReport.id}`,
            category: 'report',
            title: 'Report Ready',
            description: `Your contradiction report for "${docNames}" is complete.`,
            timestamp: new Date(latestReport.created_at),
            read: false,
          });
        }
        
        // Combine dynamic and static notifications and sort by date
        setNotifications(prev => 
            [...dynamicNotifications, ...staticNotifications]
            .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
        );

      } catch (error) {
        console.error("Failed to fetch dynamic notifications:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchDynamicNotifications();
  }, []);

  const dismissNotification = (id: string) => {
    setNotifications((prevNotifications) =>
      prevNotifications.filter((notification) => notification.id !== id)
    );
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return { notifications, dismissNotification, unreadCount, loading };
}