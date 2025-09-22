"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Download, FileText, Code, Globe } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface ReportGeneratorProps {
  analysisJobId: string
  documentName: string
}

export function ReportGenerator({ analysisJobId, documentName }: ReportGeneratorProps) {
  const [reportType, setReportType] = useState<"pdf" | "json" | "html">("pdf")
  const [isGenerating, setIsGenerating] = useState(false)
  const { toast } = useToast()

  const handleGenerateReport = async () => {
    setIsGenerating(true)

    try {
      const response = await fetch("/api/reports/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          analysisJobId,
          reportType,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to generate report")
      }

      // Get the filename from the response headers
      const contentDisposition = response.headers.get("content-disposition")
      const filename = contentDisposition?.match(/filename="(.+)"/)?.[1] || `report.${reportType}`

      // Create blob and download
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast({
        title: "Report Generated",
        description: `Your ${reportType.toUpperCase()} report has been downloaded successfully.`,
      })
    } catch (error) {
      console.error("Report generation error:", error)
      toast({
        title: "Generation Failed",
        description: error instanceof Error ? error.message : "Failed to generate report",
        variant: "destructive",
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const getReportIcon = (type: string) => {
    switch (type) {
      case "pdf":
        return <FileText className="h-4 w-4" />
      case "json":
        return <Code className="h-4 w-4" />
      case "html":
        return <Globe className="h-4 w-4" />
      default:
        return <FileText className="h-4 w-4" />
    }
  }

  const getReportDescription = (type: string) => {
    switch (type) {
      case "pdf":
        return "Professional PDF report with detailed analysis and formatting"
      case "json":
        return "Structured JSON data for programmatic access and integration"
      case "html":
        return "Interactive HTML report that can be viewed in any web browser"
      default:
        return ""
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Download className="h-5 w-5" />
          Generate Report
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="text-sm font-medium mb-2 block">Report Format</label>
          <Select value={reportType} onValueChange={(value: "pdf" | "json" | "html") => setReportType(value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pdf">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  PDF Report
                </div>
              </SelectItem>
              <SelectItem value="json">
                <div className="flex items-center gap-2">
                  <Code className="h-4 w-4" />
                  JSON Data
                </div>
              </SelectItem>
              <SelectItem value="html">
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  HTML Report
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="p-3 bg-muted rounded-lg">
          <div className="flex items-center gap-2 mb-1">
            {getReportIcon(reportType)}
            <span className="font-medium text-sm">{reportType.toUpperCase()} Format</span>
          </div>
          <p className="text-xs text-muted-foreground">{getReportDescription(reportType)}</p>
        </div>

        <div className="text-sm text-muted-foreground">
          <p>
            <strong>Document:</strong> {documentName}
          </p>
          <p>
            <strong>Report will include:</strong> Executive summary, detailed contradictions, inconsistencies, and
            recommendations
          </p>
        </div>

        <Button onClick={handleGenerateReport} disabled={isGenerating} className="w-full">
          {isGenerating ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Generating Report...
            </>
          ) : (
            <>
              <Download className="h-4 w-4 mr-2" />
              Generate {reportType.toUpperCase()} Report
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  )
}
