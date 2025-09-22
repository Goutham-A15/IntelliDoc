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

    // Get user data
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("usage_count, usage_limit, subscription_tier")
      .eq("id", user.id)
      .single()

    if (userError) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Get current month's document count
    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)

    const { count: documentsThisMonth, error: documentsError } = await supabase
      .from("documents")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .gte("created_at", startOfMonth.toISOString())

    if (documentsError) {
      console.error("Documents count error:", documentsError)
    }

    // Get current month's reports count
    const { count: reportsGenerated, error: reportsError } = await supabase
      .from("reports")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .gte("generated_at", startOfMonth.toISOString())

    if (reportsError) {
      console.error("Reports count error:", reportsError)
    }

    return NextResponse.json({
      current_usage: userData.usage_count,
      usage_limit: userData.usage_limit,
      subscription_tier: userData.subscription_tier,
      documents_this_month: documentsThisMonth || 0,
      reports_generated: reportsGenerated || 0,
    })
  } catch (error) {
    console.error("Usage API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
