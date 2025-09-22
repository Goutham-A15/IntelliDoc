import { createClient } from "@/lib/supabase/server"
import { getPlanById } from "@/lib/billing/subscription-plans"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
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

    const { planId } = await request.json()

    if (!planId) {
      return NextResponse.json({ error: "Plan ID required" }, { status: 400 })
    }

    const plan = getPlanById(planId)
    if (!plan) {
      return NextResponse.json({ error: "Invalid plan ID" }, { status: 400 })
    }

    // For demo purposes, we'll simulate a checkout process
    // In a real app, you'd integrate with Stripe, PayPal, or another payment processor

    if (plan.id === "free") {
      // Handle downgrade to free plan
      const { error: updateError } = await supabase
        .from("users")
        .update({
          subscription_tier: "free",
          usage_limit: 5,
        })
        .eq("id", user.id)

      if (updateError) {
        return NextResponse.json({ error: "Failed to update subscription" }, { status: 500 })
      }

      return NextResponse.json({
        message: "Successfully downgraded to free plan",
        redirect: "/dashboard",
      })
    }

    // For paid plans, create a mock checkout session
    // In production, you would create a real payment session here
    const checkoutSession = {
      id: `cs_${Date.now()}`,
      url: `/billing/checkout-success?plan=${planId}&session_id=cs_${Date.now()}`,
      plan_id: planId,
      amount: plan.price * 100, // amount in cents
      currency: plan.currency,
    }

    return NextResponse.json({
      checkoutUrl: checkoutSession.url,
      sessionId: checkoutSession.id,
    })
  } catch (error) {
    console.error("Checkout API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
