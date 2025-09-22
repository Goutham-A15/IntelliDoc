import { createClient } from "@/lib/supabase/server";
import { type NextRequest, NextResponse } from "next/server";
import pdfParse from "pdf-parse";
import mammoth from "mammoth";

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

    const { storagePath, fileType, fileName } = await request.json();

    if (!storagePath || !fileType || !fileName) {
      return NextResponse.json({ error: "storagePath, fileType, and fileName are required" }, { status: 400 });
    }

    // 1. Download the file directly from Supabase Storage into a buffer.
    const { data: fileData, error: storageError } = await supabase.storage
      .from("documents")
      .download(storagePath);

    if (storageError || !fileData) {
      console.error(`Supabase storage error for ${fileName}:`, storageError);
      throw new Error(`Failed to download "${fileName}" from storage.`);
    }

    const buffer = Buffer.from(await fileData.arrayBuffer());

    // 2. Parse the buffer based on the file type.
    let textContent = "";
    if (fileType === "application/pdf") {
      const data = await pdfParse(buffer);
      textContent = data.text;
    } else if (fileType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
      const result = await mammoth.extractRawText({ buffer });
      textContent = result.value;
    } else if (fileType === "text/plain") {
      textContent = buffer.toString("utf-8");
    } else {
      throw new Error(`Unsupported file type for parsing: ${fileType}`);
    }
    
    if (!textContent || textContent.trim() === "") {
        textContent = "Document is empty or no text could be extracted."
    }

    // 3. Return the successfully parsed text.
    return NextResponse.json({ text: textContent });

  } catch (error) {
    const message = error instanceof Error ? error.message : "An unknown error occurred.";
    console.error("Error in /api/documents/parse-file:", message);
    return NextResponse.json({ error: `Server failed to parse file. Reason: ${message}` }, { status: 500 });
  }
}