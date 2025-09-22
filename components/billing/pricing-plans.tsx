"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Check, Crown, Zap, FileText } from "lucide-react"
import { SUBSCRIPTION_PLANS, type SubscriptionPlan } from "@/lib/billing/subscription-plans"
import { useToast } from "@/hooks/use-toast"

interface PricingPlansProps {
  currentPlan?: string
}

export function PricingPlans({ currentPlan = "free" }: PricingPlansProps) {
  const [loading, setLoading] = useState<string | null>(null)
  const { toast } = useToast()

  // --- CORRECTED: This function now prevents plan upgrades ---
  const handleSelectPlan = async (planId: string) => {
    if (planId === currentPlan) return

    // Show a toast message and stop the process if the user tries to upgrade
    if (planId !== 'free') {
        toast({
            title: "Feature Unavailable",
            description: "Plan upgrades are currently disabled in this demo.",
            variant: "destructive",
        });
        return;
    }

    setLoading(planId)
    try {
        // This part will now only run for downgrading to the free plan
        const response = await fetch("/api/billing/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ planId }),
        })

        if (!response.ok) {
          throw new Error("Failed to create checkout session")
        }

        const { checkoutUrl } = await response.json()
        window.location.href = checkoutUrl
      
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to process request",
        variant: "destructive",
      })
    } finally {
      setLoading(null)
    }
  }

  const getPlanIcon = (planId: string) => {
    switch (planId) {
      case "enterprise": return <Crown className="h-6 w-6 text-yellow-500" />
      case "pro": return <Zap className="h-6 w-6 text-blue-500" />
      default: return <FileText className="h-6 w-6 text-gray-500" />
    }
  }

  const getButtonText = (plan: SubscriptionPlan) => {
    if (plan.id === currentPlan) return "Current Plan"
    if (plan.id === "free") return "Downgrade"
    return `Upgrade to ${plan.name}`
  }

  const getButtonVariant = (plan: SubscriptionPlan) => {
    if (plan.id === currentPlan) return "outline"
    if (plan.popular) return "default"
    return "outline"
  }

  return (
    <div className="grid md:grid-cols-3 gap-6">
      {SUBSCRIPTION_PLANS.map((plan) => (
        <Card key={plan.id} className={`relative ${plan.popular ? "border-primary shadow-lg" : ""}`}>
          {plan.popular && <Badge className="absolute -top-2 left-1/2 transform -translate-x-1/2">Most Popular</Badge>}
          <CardHeader className="text-center pb-4">
            <div className="flex justify-center mb-4">{getPlanIcon(plan.id)}</div>
            <CardTitle className="text-2xl">{plan.name}</CardTitle>
            <div className="text-3xl font-bold">
              ₹{plan.price}
              <span className="text-lg font-normal text-muted-foreground">/{plan.interval}</span>
            </div>
            <p className="text-sm text-muted-foreground">{plan.description}</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <ul className="space-y-3">
              {plan.features.map((feature, index) => (
                <li key={index} className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
            <div className="pt-4">
              <Button
                className="w-full"
                variant={getButtonVariant(plan) as any}
                onClick={() => handleSelectPlan(plan.id)}
                // --- CORRECTED: Disable all non-free plans ---
                disabled={plan.id !== 'free' || plan.id === currentPlan || loading === plan.id}
              >
                {loading === plan.id ? (
                  <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>Processing...</>
                ) : (
                  getButtonText(plan)
                )}
              </Button>
            </div>
            {plan.id === currentPlan && (
              <div className="text-center"><Badge variant="secondary">Active Plan</Badge></div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}