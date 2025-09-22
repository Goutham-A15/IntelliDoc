import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check if user is authenticated
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { name, email, subject, message } = await request.json()

    if (!subject || !message || !email) {
      return NextResponse.json({ error: "Email, subject, and message are required" }, { status: 400 })
    }

    // Insert the new support ticket
    const { data, error } = await supabase
      .from("support_tickets")
      .insert({
        user_id: user.id,
        name: name,
        email: email,
        subject: subject,
        message: message,
        status: "open",
      })
      .select()

    if (error) {
      console.error("Support ticket error:", error)
      return NextResponse.json({ error: "Failed to create support ticket" }, { status: 500 })
    }

    return NextResponse.json({ message: "Support ticket created successfully", data })
  } catch (error) {
    console.error("Support API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}