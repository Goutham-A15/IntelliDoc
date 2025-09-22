import { createClient } from "@/lib/supabase/server"
import { generatePDFReport, generateJSONReport, generateHTMLReport, type ReportData } from "@/lib/reports/pdf-generator"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check if user is authenticated
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { analysisJobId, reportType = "pdf" } = await request.json()

    if (!analysisJobId) {
      return NextResponse.json({ error: "Analysis job ID required" }, { status: 400 })
    }

    // Get analysis job with document info
    const { data: analysisJob, error: jobError } = await supabase
      .from("analysis_jobs")
      .select(`
        *,
        documents (
          id,
          filename,
          created_at
        )
      `)
      .eq("id", analysisJobId)
      .eq("user_id", user.id)
      .single()

    if (jobError || !analysisJob) {
      return NextResponse.json({ error: "Analysis job not found" }, { status: 404 })
    }

    if (analysisJob.status !== "completed") {
      return NextResponse.json({ error: "Analysis not completed yet" }, { status: 400 })
    }

    // Prepare report data
    const reportData: ReportData = {
      documentName: analysisJob.documents.filename,
      analysisDate: new Date(analysisJob.created_at).toLocaleDateString(),
      analysisType: analysisJob.analysis_type,
      results: analysisJob.results,
      userEmail: user.email || "Unknown",
    }

    let reportContent: Buffer | string
    let contentType: string
    let filename: string

    // Generate report based on type
    switch (reportType) {
      case "pdf":
        reportContent = generatePDFReport(reportData)
        contentType = "application/pdf"
        filename = `analysis-report-${analysisJob.id}.pdf`
        break
      case "json":
        reportContent = generateJSONReport(reportData)
        contentType = "application/json"
        filename = `analysis-report-${analysisJob.id}.json`
        break
      case "html":
        reportContent = generateHTMLReport(reportData)
        contentType = "text/html"
        filename = `analysis-report-${analysisJob.id}.html`
        break
      default:
        return NextResponse.json({ error: "Invalid report type" }, { status: 400 })
    }

    // Save report to database
    const { data: reportRecord, error: reportError } = await supabase
      .from("reports")
      .insert({
        user_id: user.id,
        analysis_job_id: analysisJobId,
        report_type: reportType,
        report_data: {
          metadata: {
            documentName: reportData.documentName,
            analysisDate: reportData.analysisDate,
            analysisType: reportData.analysisType,
            userEmail: reportData.userEmail,
            generatedAt: new Date().toISOString(),
          },
          summary: {
            contradictionsCount: reportData.results.contradictions?.length || 0,
            inconsistenciesCount: reportData.results.inconsistencies?.length || 0,
            confidenceScore: reportData.results.confidence_score,
          },
        },
      })
      .select()
      .single()

    if (reportError) {
      console.error("Failed to save report:", reportError)
      // Continue anyway, just log the error
    }

    // Return the report as a download
    const response = new NextResponse(reportContent, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": Buffer.isBuffer(reportContent)
          ? reportContent.length.toString()
          : reportContent.length.toString(),
      },
    })

    return response
  } catch (error) {
    console.error("Generate report error:", error)
    return NextResponse.json({ error: "Failed to generate report" }, { status: 500 })
  }
}
