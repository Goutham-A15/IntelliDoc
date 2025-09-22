import { createClient } from "@/lib/supabase/server"
import { analyzeDocumentForContradictions } from "@/lib/ai/gemini-client"
import { extractTextFromDocument } from "@/lib/document/text-extractor"
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

    const { documentId, analysisType = "contradiction" } = await request.json()

    if (!documentId) {
      return NextResponse.json({ error: "Document ID required" }, { status: 400 })
    }

    // Check if user has reached usage limit
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("usage_count, usage_limit")
      .eq("id", user.id)
      .single()

    if (userError) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    if (userData.usage_count >= userData.usage_limit) {
      return NextResponse.json({ error: "Usage limit exceeded. Please upgrade your plan." }, { status: 429 })
    }

    // Create analysis job
    const { data: analysisJob, error: jobError } = await supabase
      .from("analysis_jobs")
      .insert({
        user_id: user.id,
        document_id: documentId,
        status: "processing",
        analysis_type: analysisType,
        ai_model: "gemini-1.5-flash",
      })
      .select()
      .single()

    if (jobError) {
      console.error("Failed to create analysis job:", jobError)
      return NextResponse.json({ error: "Failed to create analysis job" }, { status: 500 })
    }

    try {
      // Extract text from document
      const documentText = await extractTextFromDocument(documentId, user.id)

      if (!documentText || documentText.trim().length < 50) {
        throw new Error("Document appears to be empty or unreadable")
      }

      // Perform AI analysis
      const analysisResult = await analyzeDocumentForContradictions(documentText, analysisType as any)

      // Update analysis job with results
      const { error: updateError } = await supabase
        .from("analysis_jobs")
        .update({
          status: "completed",
          results: analysisResult,
          processing_time_ms: analysisResult.processing_time_ms,
        })
        .eq("id", analysisJob.id)

      if (updateError) {
        console.error("Failed to update analysis job:", updateError)
        return NextResponse.json({ error: "Failed to save analysis results" }, { status: 500 })
      }

      // Increment user usage count
      const { error: usageError } = await supabase
        .from("users")
        .update({ usage_count: userData.usage_count + 1 })
        .eq("id", user.id)

      if (usageError) {
        console.error("Failed to update usage count:", usageError)
      }

      return NextResponse.json({
        message: "Analysis completed successfully",
        analysisJobId: analysisJob.id,
        results: analysisResult,
      })
    } catch (error) {
      console.error("Analysis error:", error)

      // Update analysis job with error
      await supabase
        .from("analysis_jobs")
        .update({
          status: "failed",
          error_message: error instanceof Error ? error.message : "Analysis failed",
        })
        .eq("id", analysisJob.id)

      return NextResponse.json({ error: error instanceof Error ? error.message : "Analysis failed" }, { status: 500 })
    }
  } catch (error) {
    console.error("Analyze API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
