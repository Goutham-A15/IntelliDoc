import { NextResponse } from "next/server";
import { geminiModel } from "@/lib/ai/gemini-client";

// This tells Next.js to run this on the server, not at the edge
export const runtime = "nodejs";

export async function GET() {
  console.log("[API] Received request to test Gemini API.");

  try {
    // Check if the API key is present
    if (!process.env.GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is not set in the environment variables.");
    }

    const prompt = "In one short sentence, what is a large language model?";
    
    console.log("[API] Sending prompt to Gemini:", prompt);
    const result = await geminiModel.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    console.log("[API] Received successful response from Gemini:", text);
    
    return NextResponse.json({
      status: "success",
      message: "Gemini API call was successful!",
      response: text,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    console.error("[API] Gemini API test failed:", errorMessage);

    // Provide a more helpful error message for common issues
    if (errorMessage.includes("API key not valid")) {
        return NextResponse.json({
            status: "error",
            message: "Authentication failed. Your GEMINI_API_KEY is likely invalid or missing.",
        }, { status: 500 });
    }

    return NextResponse.json({
      status: "error",
      message: "An error occurred while calling the Gemini API.",
      details: errorMessage,
    }, { status: 500 });
  }
}