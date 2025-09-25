"use client";

import { Dispatch, SetStateAction, useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  FileText,
  BarChart3,
  Settings,
  CreditCard,
  LogOut,
  History,
  GitCompareArrows,
  Coins,
  AreaChart,
} from "lucide-react";
import { useAuth } from "@/components/auth/auth-provider";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import { fetchFromApi } from "@/lib/api-client";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: BarChart3 },
  { name: "History", href: "/dashboard/history", icon: History }, 
  { name: "Reports", href: "/dashboard?tab=reports", icon: AreaChart },
  { name: "Billing", href: "/billing", icon: CreditCard },
];

interface StaticSidebarProps {
  isExpanded: boolean;
  setIsExpanded: Dispatch<SetStateAction<boolean>>;
}

export function StaticSidebar({ isExpanded, setIsExpanded }: StaticSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, userProfile, signOut } = useAuth();
  
  const [credits, setCredits] = useState({ used: 0, total: 50 });
  const [loadingCredits, setLoadingCredits] = useState(true);
  
  useEffect(() => {
    const fetchCredits = async () => {
      if (!user) return;
      setLoadingCredits(true);
      try {
        const response = await fetchFromApi("/usage");
        const data = await response.json();
        setCredits({ used: 50 - data.credits, total: 50 });
      } catch (error) {
        console.error("Failed to fetch credits for sidebar:", error);
      } finally {
        setLoadingCredits(false);
      }
    };

    fetchCredits();
  }, [user]);

  const handleSignOut = async () => {
    await signOut();
  };

  if (!user) return null;

  return (
    <aside
      className={cn(
        "hidden lg:flex flex-col h-screen bg-background border-r transition-all duration-300 ease-in-out",
        isExpanded ? "w-64" : "w-20"
      )}
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
    >
      <div className="flex items-center gap-2 border-b px-6 h-14 flex-shrink-0">
        <FileText className="h-6 w-6 text-primary flex-shrink-0" />
        <span
          className={cn(
            "font-semibold overflow-hidden whitespace-nowrap transition-opacity duration-200",
            isExpanded ? "opacity-100" : "opacity-0"
          )}
        >
          Smart Doc Checker
        </span>
      </div>

      {/* This new div will contain the navigation and handle scrolling */}
      <div className="flex-1 overflow-y-auto">
        <nav className="p-4 space-y-2">
          {navigation.map((item) => {
            const currentTab = searchParams.get('tab');
            const [itemPath, itemQuery] = item.href.split('?');
            const itemTab = itemQuery ? new URLSearchParams(itemQuery).get('tab') : null;
  
            let isActive = false;
            if (itemTab) {
              isActive = pathname === itemPath && currentTab === itemTab;
            } else if (item.href === "/dashboard") {
              isActive = pathname === item.href && !currentTab;
            } else {
              isActive = pathname.startsWith(item.href);
            }
              
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
                title={item.name}
              >
                <item.icon className="h-5 w-5 flex-shrink-0" />
                <span
                  className={cn(
                    "overflow-hidden whitespace-nowrap transition-all duration-200",
                    isExpanded ? "w-full opacity-100" : "w-0 opacity-0"
                  )}
                >
                  {item.name}
                </span>
              </Link>
            );
          })}
          <div className="pt-2">
            <div className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground">
              <Coins className="h-5 w-5 flex-shrink-0" />
              <span
                className={cn(
                  "overflow-hidden whitespace-nowrap transition-all duration-200",
                  isExpanded ? "w-full opacity-100" : "w-0 opacity-0"
                )}
              >
                Credits
              </span>
            </div>
            <div className="px-3">
              {loadingCredits ? (
                <div className="h-2 bg-muted rounded-full animate-pulse" />
              ) : (
                <Progress value={(credits.used / credits.total) * 100} />
              )}
            </div>
            <p
              className={cn(
                "text-xs text-muted-foreground text-center pt-2 transition-opacity duration-200",
                isExpanded ? "opacity-100" : "opacity-0"
              )}
            >
              {loadingCredits ? "Loading..." : `${credits.used}/${credits.total} Credits Used`}
            </p>
          </div>
        </nav>
      </div>

      {/* This div is now a stable footer */}
      <div className="flex-shrink-0 border-t p-4 space-y-2">
        <Link
          href="/dashboard/settings"
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
            pathname.startsWith("/dashboard/settings")
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-muted hover:text-foreground",
          )}
          title="Settings"
        >
          <Settings className="h-5 w-5 flex-shrink-0" />
          <span
            className={cn(
              "overflow-hidden whitespace-nowrap transition-all duration-200",
              isExpanded ? "w-full opacity-100" : "w-0 opacity-0"
            )}
          >
            Settings
          </span>
        </Link>
        
        <div className="flex items-center gap-3 pt-2 px-1">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
            <span className="text-sm font-medium">
              {user.email?.[0]?.toUpperCase()}
            </span>
          </div>
          <div
            className={cn(
              "flex-1 min-w-0 transition-opacity duration-200",
              isExpanded ? "opacity-100" : "opacity-0"
            )}
          >
            <p className="text-sm font-medium truncate">{user.email}</p>
            <p className="text-xs text-muted-foreground capitalize">
              {userProfile?.subscription_tier || "..."} Plan
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleSignOut}
          className="w-full justify-start"
        >
          <div className="w-10 flex items-center justify-center flex-shrink-0">
            <LogOut className="h-5 w-5" />
          </div>
          <span
            className={cn(
              "overflow-hidden whitespace-nowrap transition-all duration-200",
              isExpanded ? "w-auto opacity-100" : "w-0 opacity-0"
            )}
          >
            Sign Out
          </span>
        </Button>
      </div>
    </aside>
  );
}