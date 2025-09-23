"use client"

import { useState } from "react"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { FileUpload } from "@/components/upload/file-upload"
import { DocumentList } from "@/components/documents/document-list"
import { AnalysisResults } from "@/components/analysis/analysis-results"
import { ReportGenerator } from "@/components/reports/report-generator"
import { UsageMeter } from "@/components/billing/usage-meter"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { FileText, BarChart3, Download, Upload, GitCompareArrows } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import type { Document } from "@/lib/types/database"
import { motion } from "framer-motion"
import { ComparisonResults } from "@/components/analysis/comparison-results"

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState("upload")
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null)
  const [selectedAnalysisJobId, setSelectedAnalysisJobId] = useState<string | null>(null)
  const [comparisonDocuments, setComparisonDocuments] = useState<{ id: string, name: string, text_storage_path?: string | null }[]>([])
  const [comparisonResult, setComparisonResult] = useState<any>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const { toast } = useToast()
  const router = useRouter()

  const triggerRefresh = () => setRefreshTrigger(prev => prev + 1);

  const handleUploadComplete = () => {
    toast({
      title: "Upload Successful",
      description: "Your file(s) have been uploaded successfully.",
    })
    triggerRefresh(); // CORRECTED: Use the new handler
    setActiveTab("documents")
  }

  const handleCompareDocuments = (documents: { id: string, name: string, text_storage_path?: string | null }[]) => {
    setComparisonDocuments(documents)
    setActiveTab("comparison")
  }
  
  const handleGenerateReport = (jobId: string) => {
    setSelectedAnalysisJobId(jobId)
    setActiveTab("reports")
  }

  const handleDeleteDocument = () => {
    triggerRefresh(); // CORRECTED: Use the new handler
    toast({
      title: "Document Deleted",
      description: "Document has been removed successfully",
    })
  }

  const handleAnalysisComplete = (result: any) => {
      setComparisonResult(result);
      triggerRefresh(); // This will update the usage meter
  }

  const handleUpgradeClick = () => {
    router.push("/billing")
  }

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
                {/* CORRECTED: Pass the refreshTrigger prop here */}
                <UsageMeter onUpgrade={handleUpgradeClick} refreshTrigger={refreshTrigger} />
                <Card>
                  <CardHeader><CardTitle className="text-lg">Quick Actions</CardTitle></CardHeader>
                  <CardContent className="space-y-3">
                    <Button variant="outline" className="w-full justify-start bg-transparent" onClick={() => setActiveTab("upload")}><Upload className="h-4 w-4 mr-2" />Upload Document</Button>
                    <Button variant="outline" className="w-full justify-start bg-transparent" onClick={() => setActiveTab("documents")}><FileText className="h-4 w-4 mr-2" />View Documents</Button>
                    <Button variant="outline" className="w-full justify-start bg-transparent" onClick={() => setActiveTab("analysis")}><BarChart3 className="h-4 w-4 mr-2" />View Analysis</Button>
                    <Button variant="outline" className="w-full justify-start bg-transparent" onClick={() => setActiveTab("comparison")}><GitCompareArrows className="h-4 w-4 mr-2" />Compare Documents</Button>
                    <Button variant="outline" className="w-full justify-start bg-transparent" onClick={() => setActiveTab("reports")}><Download className="h-4 w-4 mr-2" />Generate Report</Button>
                  </CardContent>
                </Card>
              </div>
            </div>
            <div className="lg:col-span-3">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-5">
                  <TabsTrigger value="upload">Upload</TabsTrigger>
                  <TabsTrigger value="documents">Documents</TabsTrigger>
                  <TabsTrigger value="analysis">Analysis</TabsTrigger>
                  <TabsTrigger value="comparison">Comparison</TabsTrigger>
                  <TabsTrigger value="reports">Reports</TabsTrigger>
                </TabsList>
                <TabsContent value="upload" className="space-y-6">
                  <Card>
                    <CardHeader><CardTitle>Upload Documents</CardTitle><p className="text-sm text-muted-foreground">Upload your documents to analyze them for contradictions and inconsistencies</p></CardHeader>
                    <CardContent><FileUpload onUploadComplete={handleUploadComplete} /></CardContent>
                  </Card>
                </TabsContent>
                <TabsContent value="documents" className="space-y-6">
                  <Card>
                    <CardHeader><CardTitle>Your Documents</CardTitle><p className="text-sm text-muted-foreground"></p></CardHeader>
                    {/* CORRECTED: Pass the refreshTrigger prop here */}
                    <CardContent><DocumentList onCompare={handleCompareDocuments} onDelete={handleDeleteDocument} refreshTrigger={refreshTrigger} /></CardContent>
                  </Card>
                </TabsContent>
                <TabsContent value="analysis" className="space-y-6">
                  {selectedAnalysisJobId ? (
                    <AnalysisResults jobId={selectedAnalysisJobId} onGenerateReport={handleGenerateReport} />
                  ) : (
                    <Card><CardContent className="p-8 text-center"><BarChart3 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" /><h3 className="text-lg font-medium mb-2">No Analysis Selected</h3><p className="text-muted-foreground mb-4">Analysis results for single documents will appear here.</p></CardContent></Card>
                  )}
                </TabsContent>
                <TabsContent value="comparison" className="space-y-6">
                  {comparisonDocuments.length === 2 ? (
                    <ComparisonResults 
                      documents={comparisonDocuments} 
                      onAnalysisComplete={handleAnalysisComplete}
                      initialData={comparisonResult}
                    />
                  ) : (
                    <Card>
                      <CardContent className="p-8 text-center">
                        <GitCompareArrows className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                        <h3 className="text-lg font-medium mb-2">Select Documents to Compare</h3>
                        <p className="text-muted-foreground mb-4">Go to the 'Documents' tab and click on two files to start a comparison.</p>
                        <Button onClick={() => setActiveTab("documents")}>View Documents</Button>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>
                <TabsContent value="reports" className="space-y-6">
                  {selectedAnalysisJobId && selectedDocument ? (
                    <ReportGenerator analysisJobId={selectedAnalysisJobId} documentName={selectedDocument.filename} />
                  ) : (
                    <Card>
                      <CardContent className="p-8 text-center">
                        <Download className="h-12 w-12 mx-auto mb-4 text-muted-foreground" /><h3 className="text-lg font-medium mb-2">No Analysis Available</h3><p className="text-muted-foreground mb-4">Complete an analysis first to generate reports</p>
                        <Button onClick={() => setActiveTab("documents")}>View Documents</Button>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </motion.div>
      </div>
    </ProtectedRoute>
  )
}