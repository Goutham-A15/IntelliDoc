
import { NextResponse } from "next/server";
import { geminiModel } from "@/lib/ai/gemini-client";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

// The prompt for the Gemini model
function createComparisonPrompt(text1: string, fileName1: string, text2: string, fileName2: string): string {
  return `
    You are an expert document analyzer. Your task is to meticulously compare the two text documents provided below and identify any contradictions, discrepancies, or significant differences between them.

    DOCUMENT 1 (Filename: "${fileName1}"):
    ---
    ${text1}
    ---

    DOCUMENT 2 (Filename: "${fileName2}"):
    ---
    ${text2}
    ---

    Analyze the documents and return your findings in a structured JSON format. The JSON object should have two properties: "summary" and "contradictions".

    1.  **summary**: A brief, neutral, one-paragraph summary of the key differences or similarities found. If there are no contradictions, state that the documents are generally consistent.
    2.  **contradictions**: An array of objects, where each object represents a specific contradiction you found. Each object in the array must have the following properties:
        - "id": A unique string identifier for the contradiction (e.g., "contradiction_1").
        - "statement1": The exact quote from Document 1 that is part of the contradiction.
        - "statement2": The corresponding exact quote from Document 2.
        - "explanation": A clear and concise explanation of why these two statements are contradictory.
        - "severity": Your assessment of the contradiction's severity, which must be one of "low", "medium", or "high".

    If you find no contradictions, return an empty array for the "contradictions" property.
    Respond ONLY with the valid JSON object and nothing else.
  `;
}

// Function to parse and validate the AI's JSON response
function parseGeminiResponse(responseText: string) {
    try {
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (!jsonMatch) throw new Error("No valid JSON object found in the AI response.");
        
        const parsed = JSON.parse(jsonMatch[0]);
        
        // Basic validation
        if (typeof parsed.summary !== 'string' || !Array.isArray(parsed.contradictions)) {
            throw new Error("The AI response JSON is missing required properties ('summary', 'contradictions').");
        }
        
        return parsed;
    } catch (error) {
        console.error("Failed to parse Gemini JSON response:", error);
        throw new Error("The AI returned a response in an unexpected format. Please try again.");
    }
}


export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { document1, document2 } = await request.json();

    if (!document1?.text || !document2?.text || !document1?.name || !document2?.name) {
      return NextResponse.json({ error: "Two documents with text content and names are required." }, { status: 400 });
    }

    const prompt = createComparisonPrompt(document1.text, document1.name, document2.text, document2.name);
    
    const result = await geminiModel.generateContent(prompt);
    const responseText = result.response.text();
    
    const analysisResult = parseGeminiResponse(responseText);

    return NextResponse.json(analysisResult);

  } catch (error) {
    const message = error instanceof Error ? error.message : "An unknown error occurred.";
    console.error("[API] /compare-documents error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}