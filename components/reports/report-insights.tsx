// NodeTest/components/reports/report-insights.tsx
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";

export interface InsightsData {
  comparisonsOverTime: { date: string; comparisons: number }[];
}

export function ReportInsights({ data }: { data: InsightsData | null }) {
  if (!data || !data.comparisonsOverTime || data.comparisonsOverTime.length === 0) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Insights</CardTitle>
            </CardHeader>
            <CardContent className="text-center text-muted-foreground py-12">
                <p>Not enough data to display insights. Perform some comparisons first.</p>
            </CardContent>
        </Card>
    )
  }

  return (
    <div>
        <h2 className="text-2xl font-bold mb-4">Insights</h2>
        <Card>
        <CardHeader>
            <CardTitle>Comparisons Over Time</CardTitle>
        </CardHeader>
        <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
            <LineChart
                data={data.comparisonsOverTime}
                margin={{
                top: 5,
                right: 30,
                left: 20,
                bottom: 5,
                }}
            >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Line
                type="monotone"
                dataKey="comparisons"
                stroke="#8884d8"
                activeDot={{ r: 8 }}
                />
            </LineChart>
            </ResponsiveContainer>
        </CardContent>
        </Card>
    </div>
  );
}