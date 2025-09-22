import { createClient } from "@/lib/supabase/server";
import { type NextRequest, NextResponse } from "next/server";
import { extractTextFromDocument } from "@/lib/document/text-extractor";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { documentId } = await request.json();

    if (!documentId) {
      return NextResponse.json({ error: "Document ID is required" }, { status: 400 });
    }

    console.log(`[API] Received request to parse document: ${documentId}`);

    // Call the text extractor which handles all parsing logic
    const textContent = await extractTextFromDocument(documentId, user.id);

    console.log(`[API] Successfully parsed document: ${documentId}. Returning content.`);

    // Return the successfully parsed text
    return NextResponse.json({ text: textContent });

  } catch (error) {
    const message = error instanceof Error ? error.message : "An unknown error occurred.";
    console.error("[API] Error parsing document:", message);
    return NextResponse.json({ error: `Server failed to parse file. Reason: ${message}` }, { status: 500 });
  }
}