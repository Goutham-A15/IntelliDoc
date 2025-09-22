import { createClient } from "@/lib/supabase/server";
import { type NextRequest, NextResponse } from "next/server";
import { extractTextFromDocument } from "@/lib/document/text-extractor";
import path from "path";

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

    console.log(`[API] Received request to extract text for document: ${documentId}`);

    // 1. Extract the text content from the original file.
    const textContent = await extractTextFromDocument(documentId, user.id);

    // 2. Determine the new path for the extracted .txt file.
    const { data: docData } = await supabase.from("documents").select("storage_path").eq("id", documentId).single();
    const originalPath = docData?.storage_path;
    if (!originalPath) {
        throw new Error("Could not find original storage path for the document.");
    }
    const parsedPath = path.parse(originalPath);
    const newTextPath = `${parsedPath.dir}/${parsedPath.name}_extracted.txt`;

    // 3. Upload the extracted text as a new file to Supabase Storage.
    const { error: uploadError } = await supabase.storage
      .from("documents")
      .upload(newTextPath, textContent, {
        contentType: "text/plain;charset=utf-8",
        upsert: true, // Overwrite if it already exists
      });

    if (uploadError) {
      console.error("[API] Error uploading extracted text:", uploadError);
      throw new Error("Failed to save extracted text to storage.");
    }

    // 4. Update the document's record in the database with the new text file's path.
    const { error: updateError } = await supabase
      .from("documents")
      .update({ text_storage_path: newTextPath })
      .eq("id", documentId);

    if (updateError) {
      console.error("[API] Error updating document with text path:", updateError);
      throw new Error("Failed to update document metadata.");
    }

    console.log(`[API] Successfully extracted and saved text for document: ${documentId} at ${newTextPath}`);
    return NextResponse.json({ message: "Text extracted and saved successfully.", textPath: newTextPath });

  } catch (error) {
    const message = error instanceof Error ? error.message : "An unknown server error occurred.";
    console.error("[API] /extract-and-save-text:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}