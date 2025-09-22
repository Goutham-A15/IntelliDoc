export interface SubscriptionPlan {
  id: string
  name: string
  description: string
  price: number
  currency: "INR" | "USD" // Updated to reflect INR
  interval: "month" | "year"
  features: string[]
  limits: {
    documents_per_month: number
    analyses_per_month: number
    storage_gb: number
    report_formats: string[]
    priority_support: boolean
  }
  popular?: boolean
}

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: "free",
    name: "Free",
    description: "Perfect for trying out Smart Doc Checker",
    price: 0,
    currency: "INR", // Changed
    interval: "month",
    features: ["5 document analyses per month", "Basic contradiction detection", "PDF reports", "Email support"],
    limits: {
      documents_per_month: 5,
      analyses_per_month: 5,
      storage_gb: 1,
      report_formats: ["pdf"],
      priority_support: false,
    },
  },
  {
    id: "pro",
    name: "Pro",
    description: "For professionals and small teams",
    price: 2499, // Changed
    currency: "INR", // Changed
    interval: "month",
    features: [
      "100 document analyses per month",
      "Advanced AI analysis",
      "All report formats (PDF, JSON, HTML)",
      "Priority email support",
      "Analysis history",
    ],
    limits: {
      documents_per_month: 100,
      analyses_per_month: 100,
      storage_gb: 10,
      report_formats: ["pdf", "json", "html"],
      priority_support: true,
    },
    popular: true,
  },
  {
    id: "enterprise",
    name: "Enterprise",
    description: "For large organizations with high volume needs",
    price: 7999, // Changed
    currency: "INR", // Changed
    interval: "month",
    features: [
      "Unlimited document analyses",
      "Custom AI model training",
      "All report formats + API access",
      "Dedicated support manager",
      "Custom integrations",
      "SLA guarantee",
    ],
    limits: {
      documents_per_month: -1, // unlimited
      analyses_per_month: -1, // unlimited
      storage_gb: 100,
      report_formats: ["pdf", "json", "html", "api"],
      priority_support: true,
    },
  },
]

export function getPlanById(planId: string): SubscriptionPlan | undefined {
  return SUBSCRIPTION_PLANS.find((plan) => plan.id === planId)
}

export function getUserPlanLimits(subscriptionTier: string) {
  const plan = getPlanById(subscriptionTier)
  return plan?.limits || SUBSCRIPTION_PLANS[0].limits // fallback to free plan
}