"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { AlertTriangle, CheckCircle, Clock, FileText, Download } from "lucide-react"
import type { AnalysisJob } from "@/lib/types/database"
import type { AnalysisResult, Contradiction, Inconsistency } from "@/lib/ai/gemini-client"

interface AnalysisResultsProps {
  jobId: string
  onGenerateReport?: (jobId: string) => void
}

interface AnalysisJobWithDocument extends AnalysisJob {
  documents: {
    id: string
    filename: string
    file_type: string
    created_at: string
  }
}

export function AnalysisResults({ jobId, onGenerateReport }: AnalysisResultsProps) {
  const [analysisJob, setAnalysisJob] = useState<AnalysisJobWithDocument | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchAnalysisJob = async () => {
      try {
        const response = await fetch(`/api/analysis/${jobId}`)
        if (!response.ok) {
          throw new Error("Failed to fetch analysis results")
        }
        const data = await response.json()
        setAnalysisJob(data.analysisJob)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load analysis results")
      } finally {
        setLoading(false)
      }
    }

    fetchAnalysisJob()
  }, [jobId])

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading analysis results...</p>
        </CardContent>
      </Card>
    )
  }

  if (error || !analysisJob) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-red-500" />
          <p className="text-red-500">{error || "Analysis results not found"}</p>
        </CardContent>
      </Card>
    )
  }

  const results = analysisJob.results as AnalysisResult
  const getStatusIcon = () => {
    switch (analysisJob.status) {
      case "completed":
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case "processing":
        return <Clock className="h-5 w-5 text-yellow-500" />
      case "failed":
        return <AlertTriangle className="h-5 w-5 text-red-500" />
      default:
        return <Clock className="h-5 w-5 text-gray-500" />
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "high":
        return "destructive"
      case "medium":
        return "default"
      case "low":
        return "secondary"
      default:
        return "outline"
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                {analysisJob.documents.filename}
              </CardTitle>
              <div className="flex items-center gap-2 mt-2">
                {getStatusIcon()}
                <span className="text-sm text-muted-foreground capitalize">{analysisJob.status}</span>
                {analysisJob.processing_time_ms && (
                  <span className="text-sm text-muted-foreground">
                    • {(analysisJob.processing_time_ms / 1000).toFixed(1)}s
                  </span>
                )}
              </div>
            </div>
            {analysisJob.status === "completed" && onGenerateReport && (
              <Button onClick={() => onGenerateReport(jobId)}>
                <Download className="h-4 w-4 mr-2" />
                Generate Report
              </Button>
            )}
          </div>
        </CardHeader>
      </Card>

      {analysisJob.status === "processing" && (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              <div className="flex-1">
                <p className="font-medium">Analysis in progress...</p>
                <p className="text-sm text-muted-foreground">This may take a few moments</p>
              </div>
            </div>
            <Progress value={undefined} className="mt-4" />
          </CardContent>
        </Card>
      )}

      {analysisJob.status === "failed" && (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3 text-red-500">
              <AlertTriangle className="h-6 w-6" />
              <div>
                <p className="font-medium">Analysis Failed</p>
                <p className="text-sm">{analysisJob.error_message || "An error occurred during analysis"}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {analysisJob.status === "completed" && results && (
        <>
          {/* Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Analysis Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-500">{results.contradictions?.length || 0}</div>
                  <div className="text-sm text-muted-foreground">Contradictions</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-500">{results.inconsistencies?.length || 0}</div>
                  <div className="text-sm text-muted-foreground">Inconsistencies</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-500">
                    {Math.round((results.confidence_score || 0) * 100)}%
                  </div>
                  <div className="text-sm text-muted-foreground">Confidence</div>
                </div>
              </div>
              <p className="text-muted-foreground">{results.summary}</p>
            </CardContent>
          </Card>

          {/* Detailed Results */}
          <Tabs defaultValue="contradictions" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="contradictions">Contradictions ({results.contradictions?.length || 0})</TabsTrigger>
              <TabsTrigger value="inconsistencies">
                Inconsistencies ({results.inconsistencies?.length || 0})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="contradictions" className="space-y-4">
              {results.contradictions && results.contradictions.length > 0 ? (
                results.contradictions.map((contradiction: Contradiction) => (
                  <Card key={contradiction.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">Contradiction Found</CardTitle>
                        <Badge variant={getSeverityColor(contradiction.severity) as any}>
                          {contradiction.severity} severity
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <h4 className="font-medium text-red-600 mb-2">Statement 1:</h4>
                        <p className="text-sm bg-red-50 p-3 rounded border-l-4 border-red-500">
                          "{contradiction.statement1}"
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">Location: {contradiction.location1}</p>
                      </div>
                      <div>
                        <h4 className="font-medium text-red-600 mb-2">Statement 2:</h4>
                        <p className="text-sm bg-red-50 p-3 rounded border-l-4 border-red-500">
                          "{contradiction.statement2}"
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">Location: {contradiction.location2}</p>
                      </div>
                      <div>
                        <h4 className="font-medium mb-2">Explanation:</h4>
                        <p className="text-sm text-muted-foreground">{contradiction.explanation}</p>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>Confidence: {Math.round(contradiction.confidence * 100)}%</span>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Card>
                  <CardContent className="p-8 text-center">
                    <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
                    <h3 className="text-lg font-medium mb-2">No Contradictions Found</h3>
                    <p className="text-muted-foreground">The document appears to be internally consistent.</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="inconsistencies" className="space-y-4">
              {results.inconsistencies && results.inconsistencies.length > 0 ? (
                results.inconsistencies.map((inconsistency: Inconsistency) => (
                  <Card key={inconsistency.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">Inconsistency Detected</CardTitle>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{inconsistency.type}</Badge>
                          <Badge variant={getSeverityColor(inconsistency.severity) as any}>
                            {inconsistency.severity} severity
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <h4 className="font-medium text-yellow-600 mb-2">Issue:</h4>
                        <p className="text-sm bg-yellow-50 p-3 rounded border-l-4 border-yellow-500">
                          {inconsistency.issue}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">Location: {inconsistency.location}</p>
                      </div>
                      <div>
                        <h4 className="font-medium mb-2">Suggestion:</h4>
                        <p className="text-sm text-muted-foreground">{inconsistency.suggestion}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Card>
                  <CardContent className="p-8 text-center">
                    <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
                    <h3 className="text-lg font-medium mb-2">No Inconsistencies Found</h3>
                    <p className="text-muted-foreground">The document appears to be logically consistent.</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  )
}