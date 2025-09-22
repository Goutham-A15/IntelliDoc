import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { storagePath } = await request.json()

    if (!storagePath) {
      return NextResponse.json({ error: "storagePath is required" }, { status: 400 })
    }

    const { data, error } = await supabase.storage
      .from("documents")
      .createSignedUrl(storagePath, 60) // URL is valid for 60 seconds

    if (error) {
      throw error
    }

    return NextResponse.json({ signedUrl: data.signedUrl })
  } catch (error) {
    console.error("Error creating signed URL:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}