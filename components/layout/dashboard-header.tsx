// components/layout/dashboard-header.tsx

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from 'react';
import { cn } from "@/lib/utils";
import { GlobalSearch } from "./GlobalSearch";
import { NotificationsPopup } from './NotificationsPopup';
import { useNotifications } from '@/components/notifications/NotificationProvider';

const navigationTabs = [
  { name: "Docs", href: "/docs" },
  { name: "Help", href: "/dashboard/help" },
  { name: "Support", href: "/dashboard/support" },
];

interface DashboardHeaderProps {
  isSidebarExpanded: boolean;
}

export function DashboardHeader({ isSidebarExpanded }: DashboardHeaderProps) {
  const pathname = usePathname();
  const { notifications, dismissNotification, unreadCount } = useNotifications();
  const [isPopupOpen, setIsPopupOpen] = useState(false);

  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 relative z-10"> {/* <--- Add relative and z-10 here */}
      <div className="flex h-14 items-center justify-between px-6">
        <div className="flex items-center">
          <h1
            className={cn(
              "text-lg font-bold text-foreground transition-opacity duration-300",
              isSidebarExpanded ? "opacity-0" : "opacity-100"
            )}
          >
            Smart Doc Checker
          </h1>
        </div>

        <div className="flex items-center gap-4">
          <GlobalSearch />
          <nav className="flex items-center space-x-1">
            {navigationTabs.map((tab) => {
              const isActive = pathname.startsWith(tab.href);
              return (
                <Link
                  key={tab.name}
                  href={tab.href}
                  className={cn(
                    "px-3 py-1.5 text-sm font-medium rounded-md transition-colors duration-200",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  {tab.name}
                </Link>
              );
            })}
            <NotificationsPopup
              notifications={notifications}
              unreadCount={unreadCount}
              onDismiss={dismissNotification}
              isOpen={isPopupOpen}
              setIsOpen={setIsPopupOpen}
            />
          </nav>
        </div>
      </div>
    </header>
  );
}