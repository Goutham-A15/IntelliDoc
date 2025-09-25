// NodeTest/components/reports/report-summary.tsx
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GitCompareArrows, AlertTriangle, Percent, FileText } from "lucide-react";

export interface SummaryData {
  totalComparisons: number;
  totalConflicts: number;
  conflictPercentage: number;
}

export function ReportSummary({ data }: { data: SummaryData | null }) {
  if (!data) return null;

  const stats = [
    {
      title: "Total Comparisons",
      value: data.totalComparisons,
      icon: GitCompareArrows,
    },
    {
      title: "Total Conflicts Found",
      value: data.totalConflicts,
      icon: AlertTriangle,
    },
    {
      title: "Conflict Rate",
      value: `${data.conflictPercentage}%`,
      icon: Percent,
    },
  ];

  return (
    <div>
       <h2 className="text-2xl font-bold mb-4">Summary</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {stats.map((stat, index) => (
            <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
            </Card>
        ))}
        </div>
    </div>
  );
}