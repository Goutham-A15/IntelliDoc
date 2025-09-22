import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check if user is authenticated
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "10")
    const offset = (page - 1) * limit

    // Get user's reports with pagination
    const { data: reports, error: reportsError } = await supabase
      .from("reports")
      .select(`
        *,
        analysis_jobs (
          id,
          analysis_type,
          created_at,
          documents (
            filename
          )
        )
      `)
      .eq("user_id", user.id)
      .order("generated_at", { ascending: false })
      .range(offset, offset + limit - 1)

    if (reportsError) {
      console.error("Reports error:", reportsError)
      return NextResponse.json({ error: "Failed to fetch reports" }, { status: 500 })
    }

    // Get total count for pagination
    const { count, error: countError } = await supabase
      .from("reports")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)

    if (countError) {
      console.error("Count error:", countError)
      return NextResponse.json({ error: "Failed to get report count" }, { status: 500 })
    }

    return NextResponse.json({
      reports,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    })
  } catch (error) {
    console.error("Reports API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
