// components/billing/billing-page-client.tsx
"use client";

import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PricingPlans } from "@/components/billing/pricing-plans";
import { UsageMeter } from "@/components/billing/usage-meter";
import { CreditCard } from "lucide-react";

type UserData = {
  subscription_tier: string | null;
  usage_count: number | null;
  usage_limit: number | null;
};

interface BillingPageClientProps {
  userData: UserData | null;
}

export function BillingPageClient({ userData }: BillingPageClientProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="container mx-auto px-4 py-8 max-w-6xl"
    >
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Billing & Usage</h1>
        <p className="text-muted-foreground">Manage your subscription and monitor your usage</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8 mb-12">
        <div className="lg:col-span-1">
          <UsageMeter />
        </div>
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Current Subscription
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Plan:</span>
                  <span className="capitalize">{userData?.subscription_tier || "free"}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium">Usage:</span>
                  <span>
                    {userData?.usage_count || 0} / {userData?.usage_limit === -1 ? "∞" : userData?.usage_limit || 5}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium">Status:</span>
                  <span className="text-green-600">Active</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4">Choose Your Plan</h2>
        <p className="text-muted-foreground mb-6">
          Upgrade or downgrade your plan at any time. Changes take effect immediately.
        </p>
      </div>

      <PricingPlans currentPlan={userData?.subscription_tier || "free"} />
    </motion.div>
  );
}