"use client";

import type React from "react";
import { useState } from "react";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { StaticSidebar } from "@/components/layout/static-sidebar";

export default function BillingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);

  return (
    <div className="flex h-screen bg-background relative">
      <StaticSidebar
        isExpanded={isSidebarExpanded}
        setIsExpanded={setIsSidebarExpanded}
      />
      <div className="flex-1 flex flex-col">
        <DashboardHeader isSidebarExpanded={isSidebarExpanded} />
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
}