import { createClient } from "@/lib/supabase/server"
import { getPlanById } from "@/lib/billing/subscription-plans"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    // In a real app, you'd verify the webhook signature here
    const body = await request.json()

    // Mock webhook event structure
    const { type, data } = body

    const supabase = await createClient()

    switch (type) {
      case "payment.succeeded":
        await handlePaymentSucceeded(supabase, data)
        break
      case "subscription.cancelled":
        await handleSubscriptionCancelled(supabase, data)
        break
      case "subscription.updated":
        await handleSubscriptionUpdated(supabase, data)
        break
      default:
        console.log(`Unhandled webhook event: ${type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error("Webhook error:", error)
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 })
  }
}

async function handlePaymentSucceeded(supabase: any, data: any) {
  const { user_id, plan_id, amount, transaction_id } = data

  const plan = getPlanById(plan_id)
  if (!plan) {
    throw new Error(`Invalid plan ID: ${plan_id}`)
  }

  // Update user subscription
  const { error: userError } = await supabase
    .from("users")
    .update({
      subscription_tier: plan_id,
      usage_limit: plan.limits.analyses_per_month,
      usage_count: 0, // Reset usage count on new subscription
    })
    .eq("id", user_id)

  if (userError) {
    throw new Error(`Failed to update user subscription: ${userError.message}`)
  }

  // Record payment
  const { error: paymentError } = await supabase.from("payments").insert({
    user_id,
    amount: amount / 100, // convert from cents
    currency: plan.currency,
    payment_status: "completed",
    transaction_id,
    subscription_period_start: new Date().toISOString(),
    subscription_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
  })

  if (paymentError) {
    console.error("Failed to record payment:", paymentError)
  }
}

async function handleSubscriptionCancelled(supabase: any, data: any) {
  const { user_id } = data

  // Downgrade to free plan
  const { error } = await supabase
    .from("users")
    .update({
      subscription_tier: "free",
      usage_limit: 5,
    })
    .eq("id", user_id)

  if (error) {
    throw new Error(`Failed to downgrade user: ${error.message}`)
  }
}

async function handleSubscriptionUpdated(supabase: any, data: any) {
  const { user_id, plan_id } = data

  const plan = getPlanById(plan_id)
  if (!plan) {
    throw new Error(`Invalid plan ID: ${plan_id}`)
  }

  const { error } = await supabase
    .from("users")
    .update({
      subscription_tier: plan_id,
      usage_limit: plan.limits.analyses_per_month,
    })
    .eq("id", user_id)

  if (error) {
    throw new Error(`Failed to update subscription: ${error.message}`)
  }
}
