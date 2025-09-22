"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/auth-provider";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { StaticSidebar } from "@/components/layout/static-sidebar";

export default function BillingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return null; // Render nothing while redirecting
  }

  return (
    <div className="flex h-screen bg-background relative">
      <StaticSidebar
        isExpanded={isSidebarExpanded}
        setIsExpanded={setIsSidebarExpanded}
      />
      <div className="flex-1 flex flex-col">
        <DashboardHeader isSidebarExpanded={isSidebarExpanded} />
        <main className="flex-1 overflow-auto p-8">{children}</main>
      </div>
    </div>
  );
}