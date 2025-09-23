"use client";

import { Dispatch, SetStateAction } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  FileText,
  BarChart3,
  Settings,
  CreditCard,
  LogOut,
  Sparkles,
  History,
  GitCompareArrows,
  Coins,
} from "lucide-react";
import { useAuth } from "@/components/auth/auth-provider";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: BarChart3 },
  // CORRECTED: Updated the href for the History link
  { name: "History", href: "/dashboard/history", icon: History }, 
  { name: "Comparison", href: "/dashboard?tab=comparison", icon: GitCompareArrows },
  { name: "Billing", href: "/billing", icon: CreditCard },
];

interface StaticSidebarProps {
  isExpanded: boolean;
  setIsExpanded: Dispatch<SetStateAction<boolean>>;
}

export function StaticSidebar({ isExpanded, setIsExpanded }: StaticSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, userProfile, signOut } = useAuth();

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
      {/* Header */}
      <div className="flex items-center gap-2 border-b px-6 py-4 h-[60px] flex-shrink-0">
        <FileText className="h-6 w-6 text-primary flex-shrink-0" />
        <span
          className={cn(
            "font-semibold overflow-hidden whitespace-nowrap transition-opacity duration-300",
            isExpanded ? "opacity-100" : "opacity-0"
          )}
        >
          Smart Doc Checker
        </span>
      </div>

      {/* Navigation & Credits */}
      <nav className="flex-1 p-4 space-y-2">
        {navigation.map((item) => {
          // FIX: Check for an exact match for the main dashboard link
          const isActive = item.href === "/dashboard" 
            ? pathname === item.href 
            : pathname.startsWith(item.href);
            
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
                !isExpanded && "justify-center"
              )}
              title={item.name}
            >
              <item.icon className="h-5 w-5 flex-shrink-0" />
              <span
                className={cn(
                  "overflow-hidden whitespace-nowrap transition-all duration-300",
                  isExpanded ? "w-full opacity-100 ml-1" : "w-0 opacity-0"
                )}
              >
                {item.name}
              </span>
            </Link>
          );
        })}
        {/* Credits Section */}
        <div className="pt-2">
           <div className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground">
             <Coins className="h-5 w-5 flex-shrink-0" />
             <span
              className={cn(
                "overflow-hidden whitespace-nowrap transition-all duration-300",
                isExpanded ? "w-full opacity-100 ml-1" : "w-0 opacity-0"
              )}
            >
              Credits
            </span>
           </div>
           <div className="px-3">
            <Progress value={0} />
           </div>
           <p
            className={cn(
              "text-xs text-muted-foreground text-center pt-2 transition-opacity duration-300",
              isExpanded ? "opacity-100" : "opacity-0"
            )}
          >
            0/30 Credits Used
          </p>
        </div>
      </nav>

      {/* Footer Section */}
      <div className="mt-auto border-t p-4 space-y-2">
        {/* Settings Link */}
        <Link
          href="/dashboard/settings"
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
            pathname.startsWith("/dashboard/settings")
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-muted hover:text-foreground",
            !isExpanded && "justify-center"
          )}
          title="Settings"
        >
          <Settings className="h-5 w-5 flex-shrink-0" />
          <span
            className={cn(
              "overflow-hidden whitespace-nowrap transition-all duration-300",
              isExpanded ? "w-full opacity-100 ml-1" : "w-0 opacity-0"
            )}
          >
            Settings
          </span>
        </Link>
        
        {/* User Profile Section */}
        <div className="flex items-center gap-3 pt-2">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
            <span className="text-sm font-medium">
              {user.email?.[0]?.toUpperCase()}
            </span>
          </div>
          <div
            className={cn(
              "flex-1 min-w-0 transition-opacity duration-300",
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
          <LogOut className="h-5 w-5 flex-shrink-0" />
          <span
            className={cn(
              "ml-3 overflow-hidden whitespace-nowrap transition-all duration-300",
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