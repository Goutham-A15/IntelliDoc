import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
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

    // Get total documents count
    const { count: totalDocuments, error: documentsError } = await supabase
      .from("documents")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)

    if (documentsError) {
      console.error("Documents count error:", documentsError)
    }

    // Get total analyses count
    const { count: totalAnalyses, error: analysesError } = await supabase
      .from("analysis_jobs")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("status", "completed")

    if (analysesError) {
      console.error("Analyses count error:", analysesError)
    }

    // Get total reports count
    const { count: totalReports, error: reportsError } = await supabase
      .from("reports")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)

    if (reportsError) {
      console.error("Reports count error:", reportsError)
    }

    // Get this month's analyses count
    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)

    const { count: thisMonthAnalyses, error: monthAnalysesError } = await supabase
      .from("analysis_jobs")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("status", "completed")
      .gte("created_at", startOfMonth.toISOString())

    if (monthAnalysesError) {
      console.error("Month analyses count error:", monthAnalysesError)
    }

    return NextResponse.json({
      totalDocuments: totalDocuments || 0,
      totalAnalyses: totalAnalyses || 0,
      totalReports: totalReports || 0,
      thisMonthAnalyses: thisMonthAnalyses || 0,
    })
  } catch (error) {
    console.error("Dashboard stats API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
