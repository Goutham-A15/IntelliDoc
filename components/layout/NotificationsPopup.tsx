"use client";

import * as React from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, CreditCard, FileText, Settings, Shield, X, AlertCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

import type { Notification, NotificationCategory } from '@/lib/types/notifications';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface NotificationsPopupProps {
  notifications: Notification[];
  unreadCount: number;
  onDismiss: (id: string) => void;
  isOpen: boolean;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

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

export function NotificationsPopup({
  notifications,
  unreadCount,
  onDismiss,
  isOpen,
  setIsOpen,
}: NotificationsPopupProps) {
  const popupRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };
    const handleClickOutside = (event: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, setIsOpen]);


  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        className="rounded-full relative"
        onClick={() => setIsOpen(prev => !prev)}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-primary/90"></span>
          </span>
        )}
        <span className="sr-only">Toggle notifications</span>
      </Button>
      
      <AnimatePresence>
        {isOpen && (
           <motion.div
            ref={popupRef}
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="absolute top-full right-0 mt-2 w-80 sm:w-96 origin-top-right"
          >
             <div className="rounded-lg border bg-card text-card-foreground shadow-lg flex flex-col max-h-[70vh]">
                <div className="p-4 border-b">
                    <h3 className="font-semibold text-lg">Notifications</h3>
                </div>
                
                <div className="flex-1 overflow-y-auto p-2">
                    {notifications.length > 0 ? (
                        notifications.map(notification => {
                            const Icon = categoryIcons[notification.category];
                            return (
                                <div key={notification.id} className="relative group p-3 rounded-lg hover:bg-muted/50 flex items-start gap-3">
                                    {!notification.read && <div className="absolute left-0 top-1/2 -translate-y-1/2 h-2 w-2 rounded-full bg-primary" />}
                                    <div className={cn("flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center", categoryColors[notification.category])}>
                                        <Icon className="h-4 w-4" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-semibold text-sm">{notification.title}</p>
                                        <p className="text-xs text-muted-foreground">{notification.description}</p>
                                        <p className="text-xs text-muted-foreground/70 mt-1">{formatDistanceToNow(notification.timestamp, { addSuffix: true })}</p>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                        onClick={() => onDismiss(notification.id)}
                                    >
                                        <X className="h-4 w-4" />
                                        <span className="sr-only">Dismiss</span>
                                    </Button>
                                </div>
                            )
                        })
                    ) : (
                        <div className="text-center p-8">
                            <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground/50" />
                            <p className="mt-4 text-sm text-muted-foreground">No new notifications</p>
                        </div>
                    )}
                </div>

                <div className="p-2 border-t text-center">
                    <Link href="/dashboard/notifications" onClick={() => setIsOpen(false)}>
                        <Button variant="link" className="w-full">View All Notifications</Button>
                    </Link>
                </div>
             </div>
           </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
