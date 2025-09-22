"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Bell, Search } from "lucide-react";

const navigationTabs = [
  { name: "Docs", href: "/dashboard/docs" },
  { name: "Help", href: "/dashboard/help" },
  { name: "Support", href: "/dashboard/support" },
];

interface DashboardHeaderProps {
  isSidebarExpanded: boolean;
}

export function DashboardHeader({ isSidebarExpanded }: DashboardHeaderProps) {
  const pathname = usePathname();

  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
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
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search..."
              className="w-full rounded-lg bg-background pl-8 md:w-[200px] lg:w-[336px]"
            />
          </div>
          <nav className="flex items-center space-x-1">
            {navigationTabs.map((tab) => {
              const isActive = pathname === tab.href;
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
            <Button variant="ghost" size="icon" className="rounded-full">
              <Bell className="h-5 w-5" />
              <span className="sr-only">Toggle notifications</span>
            </Button>
          </nav>
        </div>
      </div>
    </header>
  );
}