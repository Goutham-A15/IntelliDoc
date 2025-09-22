import { createClient } from "@/lib/supabase/server";
import { geminiModel } from "@/lib/ai/gemini-client";
import { extractTextFromDocument } from "@/lib/document/text-extractor";
import { type NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

console.log("LOG: /api/summarize/route.ts file is active.");

// New AI function specifically for summarization
async function summarizeText(text: string): Promise<string> {
  if (!text || text.trim().length < 20) {
    return "The document appears to be empty or has very little content.";
  }

  const prompt = `Summarize the following document text in 2-3 concise lines, capturing its main points:\n\n---\n\n${text}`;

  try {
    const result = await geminiModel.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Error summarizing text with Gemini:", error);
    throw new Error("AI summarization failed.");
  }
}

export async function GET(request: NextRequest) {
  console.log("LOG: GET request received at /api/summarize");
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const idsParam = searchParams.get("documentIds");
    if (!idsParam) {
      return NextResponse.json(
        { error: "Query param 'documentIds' is required (comma-separated)" },
        { status: 400 }
      );
    }

    const documentIds = idsParam.split(",").map((s) => s.trim()).filter(Boolean);
    if (documentIds.length === 0) {
      return NextResponse.json(
        { error: "No valid document IDs provided" },
        { status: 400 }
      );
    }

    const texts = await Promise.all(
      documentIds.map(async (id) => {
        try {
          const text = await extractTextFromDocument(id, user.id);
          console.log(`Extracted text for ${id}:`, text?.slice(0, 500));
          return { id, status: "success", text } as const;
        } catch (e) {
          const message = e instanceof Error ? e.message : "Unknown error";
          console.error(`Extraction failed for ${id}:`, message);
          return { id, status: "error", error: message } as const;
        }
      })
    );

    return NextResponse.json({ status: "success", results: texts });
  } catch (error) {
    console.error("GET /api/summarize error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  console.log("LOG: POST request received at /api/summarize");
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      console.log("LOG: Unauthorized access attempt.");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { documents } = await request.json();
    console.log("LOG: Received documents for summarization:", documents);

    if (!documents || !Array.isArray(documents) || documents.length < 2) {
      return NextResponse.json(
        {
          status: "error",
          error_details: "Please select at least two documents to compare.",
        },
        { status: 400 }
      );
    }

    const summaryPromises = documents.map(
      async (doc: { id: string; name: string }) => {
        try {
          const textContent = await extractTextFromDocument(doc.id, user.id);
          if (!textContent || textContent.trim() === "") {
            throw new Error("File is empty or could not be read.");
          }
          const summary = await summarizeText(textContent);
          return { fileName: doc.name, summary: summary, status: "success" };
        } catch (error) {
          return {
            fileName: doc.name,
            summary: null,
            status: "error",
            error_details:
              error instanceof Error ? error.message : "Unknown parsing error",
          };
        }
      }
    );

    const results = await Promise.all(summaryPromises);
    const failedFile = results.find((res) => res.status === "error");

    if (failedFile) {
      const errorResponse = {
        status: "error",
        error_details: `Failed to process document: ${failedFile.fileName}. Reason: ${failedFile.error_details}`,
        summaries: results,
      };
      console.log("API Response (Error):", JSON.stringify(errorResponse, null, 2));
      return NextResponse.json(errorResponse, { status: 500 });
    }

    const successResponse = {
      status: "success",
      summaries: results.map(({ fileName, summary }) => ({ fileName, summary })),
    };
    
    console.log("API Response (Success):", JSON.stringify(successResponse, null, 2));
    return NextResponse.json(successResponse);

  } catch (error) {
    const errorResponse = {
      status: "error",
      error_details: "An internal server error occurred while processing your request.",
    };
    console.error("API Response (Internal Server Error):", error);
    // THIS LINE WAS MISSING
    return NextResponse.json(errorResponse, { status: 500 });
  }
}
