const { supabaseAdmin } = require('../config/supabaseClient');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');

async function extractTextFromDocument(documentId, userId) {
  const { data: document, error: docError } = await supabaseAdmin
    .from("documents")
    .select("storage_path, file_type, filename")
    .eq("id", documentId)
    .eq("user_id", userId)
    .single();

  if (docError || !document) {
    throw new Error("Document not found or you don't have permission.");
  }

  const { data: fileData, error: storageError } = await supabaseAdmin.storage
    .from("documents")
    .download(document.storage_path);

  if (storageError || !fileData) {
    throw new Error(`Failed to download "${document.filename}" from storage.`);
  }

  const buffer = Buffer.from(await fileData.arrayBuffer());
  let textContent = "";

  switch (document.file_type) {
    case "application/pdf":
      const pdfData = await pdfParse(buffer);
      textContent = pdfData.text;
      break;
    case "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
      const docxResult = await mammoth.extractRawText({ buffer });
      textContent = docxResult.value;
      break;
    case "text/plain":
      textContent = buffer.toString("utf-8");
      break;
    default:
      throw new Error(`Unsupported file type: ${document.file_type}`);
  }

  return textContent.trim() || "Document is empty or contains no extractable text.";
}

module.exports = { extractTextFromDocument };