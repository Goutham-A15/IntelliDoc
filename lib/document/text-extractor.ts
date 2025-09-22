import { createClient } from "@/lib/supabase/server";

// This helper function dynamically imports and returns the correct parsing function.
async function getParser(fileType: string) {
  switch (fileType) {
    case "application/pdf":
      // --- NEW: Using pdfjs-dist for robust PDF parsing ---
      const pdfjs = await import("pdfjs-dist");
      // Required setup for running in a Node.js environment
      pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.mjs`;

      return async (buffer: Buffer) => {
        const data = new Uint8Array(buffer);
        const doc = await pdfjs.getDocument(data).promise;
        let allText = "";
        for (let i = 1; i <= doc.numPages; i++) {
          const page = await doc.getPage(i);
          const textContent = await page.getTextContent();
          allText += textContent.items.map(item => ('str' in item ? item.str : '')).join(" ") + "\n";
        }
        return allText;
      };

    case "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
      const { default: mammoth } = await import("mammoth");
      return (buffer: Buffer) => mammoth.extractRawText({ buffer }).then(result => result.value);

    case "text/plain":
      return (buffer: Buffer) => Promise.resolve(buffer.toString("utf-8"));

    default:
      return null;
  }
}

export async function extractTextFromDocument(documentId: string, userId: string): Promise<string> {
  const supabase = await createClient();

  const { data: document, error: docError } = await supabase
    .from("documents")
    .select("storage_path, file_type, filename")
    .eq("id", documentId)
    .eq("user_id", userId)
    .single();

  if (docError || !document) {
    throw new Error("Document not found or you don't have permission.");
  }

  const parseBuffer = await getParser(document.file_type);
  if (!parseBuffer) {
    throw new Error(`Unsupported file type for parsing: ${document.file_type}`);
  }

  const { data: fileData, error: storageError } = await supabase.storage
    .from("documents")
    .download(document.storage_path);

  if (storageError || !fileData) {
    throw new Error(`Failed to download "${document.filename}" from storage.`);
  }

  const buffer = Buffer.from(await fileData.arrayBuffer());

  try {
    const textContent = await parseBuffer(buffer);
    return textContent.trim() || "Document is empty or no text could be extracted.";
  } catch (error) {
    console.error(`Error parsing ${document.filename}:`, error);
    throw new Error(`Failed to extract text from ${document.filename}. The file may be corrupted.`);
  }
}