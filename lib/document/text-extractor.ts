import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Dynamically gets the correct parsing function for a given file type.
 * This prevents heavy libraries from being loaded unless they are needed.
 */
async function getParser(fileType: string) {
  switch (fileType) {
    case "application/pdf": {
      // Dynamically import pdf-parse only when a PDF is being processed
      const pdf = (await import("pdf-parse")).default;
      return (buffer: Buffer) => pdf(buffer).then(data => data.text);
    }
    case "application/vnd.openxmlformats-officedocument.wordprocessingml.document": {
      // Dynamically import mammoth only when a DOCX is being processed
      const mammoth = (await import("mammoth")).default;
      return (buffer: Buffer) => mammoth.extractRawText({ buffer }).then(result => result.value);
    }
    case "text/plain":
      return (buffer: Buffer) => Promise.resolve(buffer.toString("utf-8"));
    default:
      return null;
  }
}

/**
 * Extracts text from a document in Supabase Storage.
 * @param supabase - An admin Supabase client with service_role key.
 * @param documentId - The ID of the document to process.
 * @param userId - The ID of the user who owns the document.
 * @returns The extracted text content as a string.
 */
export async function extractTextFromDocument(
  supabase: SupabaseClient,
  documentId: string,
  userId: string
): Promise<string> {
  // 1. Fetch document metadata from the database
  const { data: document, error: docError } = await supabase
    .from("documents")
    .select("storage_path, file_type, filename")
    .eq("id", documentId)
    .eq("user_id", userId)
    .single();

  if (docError || !document) {
    console.error(`Document not found for id: ${documentId}`, docError);
    throw new Error("Document not found or you don't have permission.");
  }

  // 2. Get the correct parser for the file type
  const parseBuffer = await getParser(document.file_type);
  if (!parseBuffer) {
    throw new Error(`Unsupported file type: ${document.file_type}`);
  }

  // 3. Download the file from Supabase Storage
  const { data: fileData, error: storageError } = await supabase.storage
    .from("documents")
    .download(document.storage_path);

  if (storageError || !fileData) {
    console.error(`Storage error for path ${document.storage_path}:`, storageError);
    throw new Error(`Failed to download "${document.filename}" from storage.`);
  }

  const buffer = Buffer.from(await fileData.arrayBuffer());

  // 4. Parse the buffer and return the text
  try {
    const textContent = await parseBuffer(buffer);
    return textContent.trim() || "Document is empty or contains no extractable text.";
  } catch (error) {
    console.error(`Error parsing ${document.filename}:`, error);
    throw new Error(`Failed to extract text from ${document.filename}. The file may be corrupted.`);
  }
}