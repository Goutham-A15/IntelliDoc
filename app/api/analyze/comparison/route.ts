console.log("Hell Yeah baby");

import { createClient } from "@/lib/supabase/server"
import { analyzeDocumentForContradictions } from "@/lib/ai/gemini-client"
import { extractTextFromDocument } from "@/lib/document/text-extractor"
import { type NextRequest, NextResponse } from "next/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { documentIds, documentNames } = await request.json()

    if (!documentIds || documentIds.length !== 2) {
      return NextResponse.json({ error: "Two document IDs are required for comparison" }, { status: 400 })
    }

    const [documentId1, documentId2] = documentIds
    
    const doc1Name = documentNames.find((doc: {id: string}) => doc.id === documentId1)?.name || 'Document 1';
    const doc2Name = documentNames.find((doc: {id: string}) => doc.id === documentId2)?.name || 'Document 2';

    // Extract text from both documents in parallel
    const [documentText1, documentText2] = await Promise.all([
      extractTextFromDocument(documentId1, user.id),
      extractTextFromDocument(documentId2, user.id),
    ])
    
    const combinedText = `
      Document 1 (Filename: ${doc1Name}):
      ---
      ${documentText1}
      ---

      Document 2 (Filename: ${doc2Name}):
      ---
      ${documentText2}
      ---
    `;

    // Perform AI analysis to compare the two documents
    const analysisResult = await analyzeDocumentForContradictions(combinedText, "contradiction")

    // Create a comparison job entry in the database
    const { data: analysisJob, error: jobError } = await supabase
      .from("analysis_jobs")
      .insert({
        user_id: user.id,
        document_id: documentId1, // Link to the first document for reference
        status: "completed",
        analysis_type: "comparison",
        ai_model: "gemini-1.5-flash",
        results: analysisResult,
        processing_time_ms: analysisResult.processing_time_ms,
      })
      .select()
      .single()

    if (jobError) {
      console.error("Failed to create comparison job:", jobError)
      // Don't block the user, just log the error
    }


    return NextResponse.json({
      message: "Comparison completed successfully",
      results: analysisResult,
      analysisJobId: analysisJob?.id,
    })
  } catch (error) {
    console.error("Comparison API error:", error)
    return NextResponse.json({ error: error instanceof Error ? error.message : "Internal server error" }, { status: 500 })
  }
}