"use client";

import { motion } from 'framer-motion';
import { Bell, CreditCard, FileText, Settings, Shield, X, AlertCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

import { useNotifications } from '@/hooks/useNotifications';
import type { Notification, NotificationCategory } from '@/lib/types/notifications';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import React from 'react';

const categoryIcons: Record<NotificationCategory, React.ElementType> = {
  billing: CreditCard,
  report: FileText,
  system: Settings,
  account: Shield,
};

const categoryColors: Record<NotificationCategory, string> = {
    billing: 'text-yellow-500 bg-yellow-500/10',
    report: 'text-green-500 bg-green-500/10',
    system: 'text-blue-500 bg-blue-500/10',
    account: 'text-red-500 bg-red-500/10',
}

export default function NotificationsPage() {
  const { notifications, dismissNotification } = useNotifications();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="container mx-auto px-4 py-8 max-w-4xl"
    >
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-3"><Bell className="h-8 w-8" />All Notifications</h1>
        <p className="text-muted-foreground">
          Here is a complete history of your account alerts and updates.
        </p>
      </div>

      <Card>
        <CardContent className="p-4 sm:p-6">
          <div className="space-y-4">
            {notifications.length > 0 ? (
              notifications.map((notification, index) => {
                const Icon = categoryIcons[notification.category];
                return (
                  <motion.div
                    key={notification.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    className="relative group p-4 border rounded-lg hover:bg-muted/50 flex items-start gap-4"
                  >
                     <div className={cn("flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center", categoryColors[notification.category])}>
                        <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold">{notification.title}</p>
                      <p className="text-sm text-muted-foreground">{notification.description}</p>
                      <p className="text-xs text-muted-foreground/70 mt-1">{formatDistanceToNow(notification.timestamp, { addSuffix: true })}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => dismissNotification(notification.id)}
                    >
                      <X className="h-4 w-4" />
                      <span className="sr-only">Dismiss</span>
                    </Button>
                  </motion.div>
                )
              })
            ) : (
                <div className="text-center py-20">
                    <AlertCircle className="mx-auto h-16 w-16 text-muted-foreground/30" />
                    <p className="mt-6 text-lg text-muted-foreground">You're all caught up!</p>
                </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}