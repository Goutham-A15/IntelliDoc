import { GoogleGenerativeAI } from "@google/generative-ai"

// Initialize Gemini client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

export const geminiModel = genAI.getGenerativeModel({
  model: "gemini-1.5-flash-8b-latest",
  generationConfig: {
    temperature: 0.1,
    topK: 32,
    topP: 0.95,
    maxOutputTokens: 8192,
  },
})

export interface AnalysisResult {
  contradictions: Contradiction[]
  inconsistencies: Inconsistency[]
  summary: string
  confidence_score: number
  processing_time_ms: number
}

export interface Contradiction {
  id: string
  statement1: string
  statement2: string
  location1: string
  location2:string
  severity: "low" | "medium" | "high"
  explanation: string
  confidence: number
}

export interface Inconsistency {
  id: string
  issue: string
  location: string
  suggestion: string
  type: "factual" | "logical" | "temporal" | "numerical"
  severity: "low" | "medium" | "high"
}

export async function analyzeDocumentForContradictions(
  documentText: string,
  analysisType: "contradiction" | "consistency" | "fact_check" = "contradiction",
): Promise<AnalysisResult> {
  const startTime = Date.now()

  try {
    const prompt = generateAnalysisPrompt(documentText, analysisType)

    const result = await geminiModel.generateContent(prompt)
    const response = await result.response
    const text = response.text()

    // Add this line to log the raw AI response for debugging
    console.log("Gemini API Response:", text);

    // Parse the structured response
    const analysisResult = parseGeminiResponse(text)

    const processingTime = Date.now() - startTime

    return {
      ...analysisResult,
      processing_time_ms: processingTime,
    }
  } catch (error) {
    console.error("Gemini analysis error:", error)
    throw new Error(`AI analysis failed: ${error instanceof Error ? error.message : "Unknown error"}`)
  }
}

function generateAnalysisPrompt(documentText: string, analysisType: string): string {
  const basePrompt = `
You are an expert document analyzer specializing in detecting contradictions, inconsistencies, and logical errors in text documents.

Analyze the following document and provide a detailed analysis in JSON format.

Document Text:
"""
${documentText}
"""

Please analyze this document for:
1. Direct contradictions (statements that directly oppose each other)
2. Logical inconsistencies (statements that don't align logically)
3. Factual inconsistencies (potential factual errors or conflicting facts)
4. Temporal inconsistencies (timeline conflicts)
5. Numerical inconsistencies (conflicting numbers or calculations)

Return your analysis in the following JSON format:
{
  "contradictions": [
    {
      "id": "unique_id",
      "statement1": "first contradictory statement",
      "statement2": "second contradictory statement", 
      "location1": "approximate location/context of first statement",
      "location2": "approximate location/context of second statement",
      "severity": "low|medium|high",
      "explanation": "detailed explanation of the contradiction",
      "confidence": 0.85
    }
  ],
  "inconsistencies": [
    {
      "id": "unique_id",
      "issue": "description of the inconsistency",
      "location": "approximate location/context",
      "suggestion": "suggested correction or clarification",
      "type": "factual|logical|temporal|numerical",
      "severity": "low|medium|high"
    }
  ],
  "summary": "Overall summary of findings",
  "confidence_score": 0.85
}

Focus on:
- High-confidence contradictions and inconsistencies
- Provide specific quotes from the text
- Explain why each item is problematic
- Rate severity based on impact on document credibility
- Only include findings you are confident about (>70% confidence)

Respond ONLY with valid JSON, no additional text or formatting.
`

  return basePrompt
}

function parseGeminiResponse(responseText: string): Omit<AnalysisResult, "processing_time_ms"> {
  try {
    // Clean the response text to extract JSON
    const jsonMatch = responseText.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error("No JSON found in response")
    }

    const jsonText = jsonMatch[0]
    const parsed = JSON.parse(jsonText)

    // Validate and structure the response
    return {
      contradictions: (parsed.contradictions || []).map((c: any, index: number) => ({
        id: c.id || `contradiction_${index}`,
        statement1: c.statement1 || "",
        statement2: c.statement2 || "",
        location1: c.location1 || "",
        location2: c.location2 || "",
        severity: c.severity || "medium",
        explanation: c.explanation || "",
        confidence: c.confidence || 0.5,
      })),
      inconsistencies: (parsed.inconsistencies || []).map((i: any, index: number) => ({
        id: i.id || `inconsistency_${index}`,
        issue: i.issue || "",
        location: i.location || "",
        suggestion: i.suggestion || "",
        type: i.type || "logical",
        severity: i.severity || "medium",
      })),
      summary: parsed.summary || "Analysis completed",
      confidence_score: parsed.confidence_score || 0.5,
    }
  } catch (error) {
    console.error("Failed to parse Gemini response:", error)
    throw new Error("Failed to parse AI analysis results")
  }
}