"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { FileText, Download, Calendar } from "lucide-react"
import { formatDistanceToNow } from "date-fns"

interface Report {
  id: string
  report_type: string
  generated_at: string
  report_data: {
    metadata: {
      documentName: string
      analysisType: string
    }
    summary: {
      contradictionsCount: number
      inconsistenciesCount: number
      confidenceScore: number
    }
  }
  analysis_jobs: {
    documents: {
      filename: string
    }
  }
}

export function ReportsList() {
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const response = await fetch("/api/reports")
        if (!response.ok) {
          throw new Error("Failed to fetch reports")
        }
        const data = await response.json()
        setReports(data.reports)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load reports")
      } finally {
        setLoading(false)
      }
    }

    fetchReports()
  }, [])

  const getReportTypeIcon = (type: string) => {
    return <FileText className="h-4 w-4" />
  }

  const getReportTypeBadge = (type: string) => {
    const colors = {
      pdf: "default",
      json: "secondary",
      html: "outline",
    }
    return <Badge variant={colors[type as keyof typeof colors] as any}>{type.toUpperCase()}</Badge>
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading reports...</p>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-red-500">{error}</p>
        </CardContent>
      </Card>
    )
  }

  if (reports.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-medium mb-2">No reports generated</h3>
          <p className="text-muted-foreground">Generate your first report from an analysis to see it here.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <CardHeader className="px-0">
        <CardTitle>Generated Reports ({reports.length})</CardTitle>
      </CardHeader>
      {reports.map((report) => (
        <Card key={report.id}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {getReportTypeIcon(report.report_type)}
                <div>
                  <h3 className="font-medium">{report.analysis_jobs.documents.filename}</h3>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    {formatDistanceToNow(new Date(report.generated_at), { addSuffix: true })}
                    <span>•</span>
                    <span>{report.report_data.metadata.analysisType} analysis</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-red-500">
                      {report.report_data.summary.contradictionsCount} contradictions
                    </span>
                    <span className="text-yellow-500">
                      {report.report_data.summary.inconsistenciesCount} inconsistencies
                    </span>
                  </div>
                  <div className="text-muted-foreground">
                    {Math.round(report.report_data.summary.confidenceScore * 100)}% confidence
                  </div>
                </div>
                {getReportTypeBadge(report.report_type)}
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-1" />
                  Download
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
