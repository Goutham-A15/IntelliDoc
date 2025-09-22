import { createClient } from "@/lib/supabase/server";
import { type NextRequest, NextResponse } from "next/server";

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

    const { textPath } = await request.json();
    if (!textPath) {
      return NextResponse.json({ error: "textPath is required" }, { status: 400 });
    }

    // Download the .txt file from Supabase Storage
    const { data, error } = await supabase.storage.from("documents").download(textPath);

    if (error) {
      console.error("Error downloading extracted text:", error);
      throw new Error("Could not fetch the extracted text file.");
    }

    // Return the text content
    return new Response(data, { status: 200, headers: { 'Content-Type': 'text/plain' } });

  } catch (error) {
    const message = error instanceof Error ? error.message : "An unknown error occurred.";
    console.error("[API] /get-extracted-text:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}