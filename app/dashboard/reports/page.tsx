"use client";

import { useState, useEffect, Suspense } from "react";
import { motion } from "framer-motion";
import { fetchFromApi } from "@/lib/api-client";
import { ReportSummary } from "@/components/reports/report-summary";
import { ReportInsights } from "@/components/reports/report-insights";
import { DetailedReportsTable } from "@/components/reports/detailed-reports-table";
import { HistoryDetailsModal } from "@/components/history/HistoryDetailsModal";
import type { SummaryData, InsightsData, Report } from "@/components/reports/types";
import { useSearchParams, useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";

function DashboardComponent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || "upload");
  const [summaryData, setSummaryData] = useState<SummaryData | null>(null);
  const [insightsData, setInsightsData] = useState<InsightsData | null>(null);
  const [reportsList, setReportsList] = useState<Report[]>([]);
  const [loadingReports, setLoadingReports] = useState(true);
  const [selectedReport, setSelectedReport] = useState<any | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const tabFromUrl = searchParams.get('tab');
    if (tabFromUrl) {
      setActiveTab(tabFromUrl);
    }
  }, [searchParams]);

  useEffect(() => {
    const fetchReportData = async () => {
      try {
        setLoadingReports(true);
        const [summaryRes, reportsRes] = await Promise.all([
          fetchFromApi("/reports/summary"),
          fetchFromApi("/reports"),
        ]);
        const summary = await summaryRes.json();
        const { reports } = await reportsRes.json();
        setSummaryData(summary);
        setInsightsData(summary);
        setReportsList(reports);
      } catch (error) {
        toast({ title: "Error", description: "Could not load report data.", variant: "destructive" });
      } finally {
        setLoadingReports(false);
      }
    };
    fetchReportData();
  }, [toast]);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    router.push(`/dashboard?tab=${value}`, { scroll: false });
  };

  const handleViewReportDetails = (report: Report) => {
    let parsedResults = null;

    // Safely parse the results which may be a JSON string
    if (typeof report.results === "string") {
      try {
        parsedResults = JSON.parse(report.results);
      } catch (e) {
        console.error("Failed to parse report results JSON:", e);
        parsedResults = { summary: "Could not load results.", contradictions: [] };
      }
    } else {
      parsedResults = report.results || { summary: "No results found.", contradictions: [] };
    }

    // Ensure the contradictions property is always an array to prevent runtime errors
    if (!parsedResults.contradictions) {
        parsedResults.contradictions = [];
    }

    setSelectedReport({
      results: parsedResults, // Pass the safely parsed object
      document_names: report.document_names,
      related_document_ids: report.related_document_ids || []
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-8"
    >
      <div>
        <h1 className="text-3xl font-bold mb-2">Reports & Insights</h1>
        <p className="text-muted-foreground">
          An overview of your document analysis activity.
        </p>
      </div>
      {loadingReports ? (
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (
        <>
          <ReportSummary data={summaryData} />
          <ReportInsights data={insightsData} />
          <DetailedReportsTable reports={reportsList} onViewDetails={handleViewReportDetails} />
        </>
      )}
      <HistoryDetailsModal
        isOpen={!!selectedReport}
        onClose={() => setSelectedReport(null)}
        historyItem={selectedReport}
      />
    </motion.div>
  );
}

// Keep the main page export that wraps the component in Suspense
export default function ReportsPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <DashboardComponent />
    </Suspense>
  )
}