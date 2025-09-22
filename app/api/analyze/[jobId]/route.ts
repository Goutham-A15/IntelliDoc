import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest, { params }: { params: Promise<{ jobId: string }> }) {
  try {
    const { jobId } = await params
    const supabase = await createClient()

    // Check if user is authenticated
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get analysis job with document info
    const { data: analysisJob, error: jobError } = await supabase
      .from("analysis_jobs")
      .select(`
        *,
        documents (
          id,
          filename,
          file_type,
          created_at
        )
      `)
      .eq("id", jobId)
      .eq("user_id", user.id)
      .single()

    if (jobError || !analysisJob) {
      return NextResponse.json({ error: "Analysis job not found" }, { status: 404 })
    }

    return NextResponse.json({ analysisJob })
  } catch (error) {
    console.error("Get analysis job error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
