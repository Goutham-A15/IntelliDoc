// NodeTest/components/billing/usage-meter.tsx
"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { BarChart3, FileText, Zap, Crown } from "lucide-react"
import { getPlanById } from "@/lib/billing/subscription-plans"
import { fetchFromApi } from "@/lib/api-client"

export interface UsageData {
  credits: number;
  subscription_tier: string;
  operations_performed: number;
  documents_uploaded: number;
}

interface UsageMeterProps {
  onUpgrade?: () => void
  refreshTrigger?: number 
}

export function UsageMeter({ onUpgrade, refreshTrigger }: UsageMeterProps) {
  const [usage, setUsage] = useState<UsageData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchUsage = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetchFromApi("/usage")
        const data = await response.json()
        setUsage(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load usage data")
      } finally {
        setLoading(false)
      }
    }
    fetchUsage()
  }, [refreshTrigger]) 

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-1/3"></div>
            <div className="h-8 bg-muted rounded w-1/4"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error || !usage) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-red-500">{error || "Failed to load usage data"}</p>
        </CardContent>
      </Card>
    )
  }

  const plan = getPlanById(usage.subscription_tier)
  const isNearLimit = usage.credits <= 10; 
  const isOverLimit = usage.credits <= 0;

  const getTierIcon = (tier: string) => {
    switch (tier) {
      case "enterprise": return <Crown className="h-4 w-4 text-yellow-500" />
      case "pro": return <Zap className="h-4 w-4 text-blue-500" />
      default: return <FileText className="h-4 w-4 text-gray-500" />
    }
  }

  const getTierBadge = (tier: string) => {
    const variants = { free: "secondary", pro: "default", enterprise: "destructive" } as const;
    return (
      <Badge variant={variants[tier as keyof typeof variants] || "secondary"} className="flex items-center gap-1">
        {getTierIcon(tier)}
        {plan?.name || tier}
      </Badge>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Usage This Month
          </CardTitle>
          {getTierBadge(usage.subscription_tier)}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
         <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            {/* --- FIX: Use the correct 'documents_uploaded' field --- */}
            <div className="text-2xl font-bold text-blue-600">{usage.documents_uploaded}</div>
            <div className="text-xs text-muted-foreground">Documents Uploaded</div>
          </div>
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{usage.operations_performed}</div>
            <div className="text-xs text-muted-foreground">Operations Performed</div>
          </div>
        </div>
        {(isNearLimit || usage.subscription_tier === "free") && onUpgrade && (
          <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-sm">{isOverLimit ? "Upgrade Required" : "Need More Credits?"}</h4>
                <p className="text-xs text-muted-foreground">
                  {isOverLimit
                    ? "You've used all your credits. Upgrade to continue."
                    : "Upgrade for more credits and advanced features."}
                </p>
              </div>
              <Button size="sm" onClick={onUpgrade}>Upgrade</Button>
            </div>
          </div>
        )}
        {plan && (
          <div className="text-xs text-muted-foreground">
            <p className="font-medium mb-1">Your plan includes:</p>
            <ul className="space-y-1">
              {plan.features.slice(0, 3).map((feature, index) => (
                <li key={index} className="flex items-center gap-1">
                  <span className="w-1 h-1 bg-current rounded-full"></span>
                  {feature}
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  )
}