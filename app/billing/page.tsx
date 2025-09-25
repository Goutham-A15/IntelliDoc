// NodeTest/app/billing/page.tsx
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { BillingPageClient } from "@/components/billing/billing-page-client";

export default async function BillingPage() {
  const supabase = await createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) {
    redirect("/auth/login");
  }

  // Get user subscription info for the main card display
  const { data: userData } = await supabase
    .from("users")
    .select("subscription_tier, usage_count, usage_limit")
    .eq("id", user.id)
    .single();

  return <BillingPageClient userData={userData} />;
}