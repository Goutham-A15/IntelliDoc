"use client"

import { HistoryList } from "@/components/history/history-list";
import { History } from "lucide-react";

export default function HistoryPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
          <History className="h-8 w-8" />
          Analysis History
        </h1>
        <p className="text-muted-foreground">
          Review the results of your past document comparisons.
        </p>
      </div>
      <HistoryList />
    </div>
  );
}