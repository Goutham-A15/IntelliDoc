import { Suspense } from "react"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle } from "lucide-react"
import Link from "next/link"

interface CheckoutSuccessProps {
  searchParams: Promise<{
    plan?: string
    session_id?: string
  }>
}

async function CheckoutSuccessContent({ searchParams }: CheckoutSuccessProps) {
  const params = await searchParams
  const supabase = await createClient()

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()
  if (error || !user) {
    redirect("/auth/login")
  }

  // In a real app, you'd verify the session_id with your payment processor
  // For demo purposes, we'll simulate the upgrade
  if (params.plan && params.session_id) {
    const planLimits = {
      pro: 100,
      enterprise: -1,
    }

    const limit = planLimits[params.plan as keyof typeof planLimits] || 5

    await supabase
      .from("users")
      .update({
        subscription_tier: params.plan,
        usage_limit: limit,
        usage_count: 0, // Reset usage on upgrade
      })
      .eq("id", user.id)
  }

  return (
    <div className="container mx-auto px-4 py-16 max-w-2xl">
      <Card className="text-center">
        <CardHeader>
          <div className="flex justify-center mb-4">
            <CheckCircle className="h-16 w-16 text-green-500" />
          </div>
          <CardTitle className="text-2xl">Payment Successful!</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-muted-foreground">
            Thank you for upgrading to the {params.plan} plan. Your account has been updated and you can now enjoy all
            the benefits of your new subscription.
          </p>

          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="font-medium text-green-800 mb-2">What's Next?</h3>
            <ul className="text-sm text-green-700 space-y-1">
              <li>• Your usage limit has been increased</li>
              <li>• All premium features are now available</li>
              <li>• You can start analyzing documents immediately</li>
            </ul>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild>
              <Link href="/dashboard">Go to Dashboard</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/billing">View Billing</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function CheckoutSuccessPage(props: CheckoutSuccessProps) {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <CheckoutSuccessContent {...props} />
    </Suspense>
  )
}
