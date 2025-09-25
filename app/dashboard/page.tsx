// NodeTest/app/dashboard/page.tsx
"use client"

import { useState, useEffect, useCallback, Suspense } from "react";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { FileUpload } from "@/components/upload/file-upload";
import { DocumentList } from "@/components/documents/document-list";
import { ComparisonResults } from "@/components/analysis/comparison-results";
import { UsageMeter } from "@/components/billing/usage-meter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { FileText, Upload, GitCompareArrows, History as HistoryIcon, AreaChart } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useRouter, useSearchParams } from "next/navigation";
import type { Document } from "@/lib/types/database";
import { motion } from "framer-motion";
import { fetchFromApi } from "@/lib/api-client";
import { ReportSummary } from "@/components/reports/report-summary";
import { ReportInsights } from "@/components/reports/report-insights";
import { DetailedReportsTable } from "@/components/reports/detailed-reports-table";
import { HistoryDetailsModal } from "@/components/history/HistoryDetailsModal";
import type { SummaryData, InsightsData, Report } from "@/components/reports/types";

function DashboardComponent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || "upload");
  const [comparisonDocuments, setComparisonDocuments] = useState<{ id: string, name: string, text_storage_path?: string | null }[]>([]);
  const [comparisonResult, setComparisonResult] = useState<any>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [analysisRunId, setAnalysisRunId] = useState<string | null>(null);
  const [comparisonCompletedIds, setComparisonCompletedIds] = useState<string[]>([]);

  // State for Reports Tab
  const [summaryData, setSummaryData] = useState<SummaryData | null>(null);
  const [insightsData, setInsightsData] = useState<InsightsData | null>(null);
  const [reportsList, setReportsList] = useState<Report[]>([]);
  const [loadingReports, setLoadingReports] = useState(true);
  const [selectedReport, setSelectedReport] = useState<any | null>(null);

  useEffect(() => {
    const tabFromUrl = searchParams.get('tab');
    if (tabFromUrl) setActiveTab(tabFromUrl);
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

  const triggerRefresh = () => setRefreshTrigger(prev => prev + 1);

  const handleUploadComplete = () => {
    toast({ title: "Upload Successful", description: "Your file(s) have been uploaded successfully." });
    triggerRefresh();
    handleTabChange("documents");
  };

  const handleCompareDocuments = async (documents: { id: string, name: string }[]) => {
    setComparisonResult(null);
    setComparisonDocuments(documents);
    setAnalysisRunId(`run-${Date.now()}`);
    handleTabChange("comparison");
  };

  const handleAnalysisComplete = useCallback((result: any, documentIds: string[]) => {
    setComparisonResult(result);
    setComparisonCompletedIds(documentIds);
    triggerRefresh();
  }, []);

  const handleDeleteDocument = () => {
    triggerRefresh();
    toast({ title: "Document Deleted", description: "The document has been successfully removed." });
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    router.push(`/dashboard?tab=${value}`, { scroll: false });
  };
  
  const handleViewReportDetails = (report: Report) => {
    let parsedResults = null;
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

    if (!parsedResults.contradictions) {
        parsedResults.contradictions = [];
    }

    setSelectedReport({
      results: parsedResults,
      document_names: report.document_names,
      related_document_ids: report.related_document_ids || []
    });
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="container mx-auto px-4 py-8"
        >
          <div className="grid lg:grid-cols-4 gap-8">
            <div className="lg:col-span-1">
              <div className="space-y-6">
                <UsageMeter onUpgrade={() => router.push('/billing')} refreshTrigger={refreshTrigger} />
                 <Card>
                  <CardHeader><CardTitle className="text-lg">Quick Actions</CardTitle></CardHeader>
                  <CardContent className="space-y-3">
                    <Button variant="outline" className="w-full justify-start bg-transparent" onClick={() => handleTabChange("upload")}><Upload className="h-4 w-4 mr-2" />Upload Document</Button>
                    <Button variant="outline" className="w-full justify-start bg-transparent" onClick={() => handleTabChange("documents")}><FileText className="h-4 w-4 mr-2" />View Documents</Button>
                    <Button variant="outline" className="w-full justify-start bg-transparent" onClick={() => router.push('/dashboard/history')}><HistoryIcon className="h-4 w-4 mr-2" />View History</Button>
                  </CardContent>
                </Card>
              </div>
            </div>
            <div className="lg:col-span-3">
              <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="upload">Upload</TabsTrigger>
                  <TabsTrigger value="documents">Documents</TabsTrigger>
                  <TabsTrigger value="comparison">Comparison</TabsTrigger>
                  <TabsTrigger value="reports">Reports</TabsTrigger>
                </TabsList>
                <TabsContent value="upload"><FileUpload onUploadComplete={handleUploadComplete} /></TabsContent>
                <TabsContent value="documents">
                  <DocumentList
                    onCompare={handleCompareDocuments}
                    onDelete={handleDeleteDocument}
                    refreshTrigger={refreshTrigger}
                    comparisonCompletedIds={comparisonCompletedIds}
                  />
                </TabsContent>
                <TabsContent value="comparison">
                  {comparisonDocuments.length >= 2 ? (
                    <ComparisonResults
                      documents={comparisonDocuments}
                      onAnalysisComplete={(result) => handleAnalysisComplete(result, comparisonDocuments.map(d => d.id))}
                      initialData={comparisonResult}
                      runId={analysisRunId}
                    />
                  ) : (
                    <Card><CardContent className="p-8 text-center">
                      <GitCompareArrows className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                      <h3 className="text-lg font-medium">Select Documents to Compare</h3>
                      <p className="text-muted-foreground">Go to the 'Documents' tab and select at least two files.</p>
                       <Button onClick={() => handleTabChange("documents")} className="mt-4">View Documents</Button>
                    </CardContent></Card>
                  )}
                </TabsContent>
                 <TabsContent value="reports" className="space-y-6">
                   {loadingReports ? (
                     <div className="flex items-center justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>
                   ) : (
                     <>
                      <ReportSummary data={summaryData} />
                      <ReportInsights data={insightsData} />
                      <DetailedReportsTable reports={reportsList} onViewDetails={handleViewReportDetails} />
                     </>
                   )}
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </motion.div>
        <HistoryDetailsModal
          isOpen={!!selectedReport}
          onClose={() => setSelectedReport(null)}
          historyItem={selectedReport}
        />
      </div>
    </ProtectedRoute>
  )
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}>
      <DashboardComponent />
    </Suspense>
  )
}