import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { featureRows, pricingPlans } from "@/data/pricing";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { PayPalSubscriptionButton } from "@/components/billing/PayPalSubscriptionButton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useMemo, useState } from "react";

export default function Pricing() {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [selectedPlanId, setSelectedPlanId] = useState<"starter" | "optimizer" | "enterprise" | null>(null);

  const activatePlan = async (planId: "starter" | "optimizer" | "enterprise", subscriptionId: string) => {
    if (!user) return;
    const { error } = await supabase
      .from("profiles")
      .upsert(
        {
          user_id: user.id,
          email: user.email ?? null,
          plan: planId,
          subscription_status: "active",
          stripe_subscription_id: subscriptionId,
        },
        { onConflict: "user_id" }
      );
    if (error) {
      throw error;
    }
    toast({
      title: "Subscription active",
      description: `Your ${planId} plan is now active.`,
    });
  };

  const selectedPlan = useMemo(
    () => pricingPlans.find((p) => p.id === selectedPlanId) ?? null,
    [selectedPlanId]
  );

  const selectedPlanFeatures = useMemo(() => {
    if (!selectedPlanId) return [];
    return featureRows.map((row) => ({
      name: row.name,
      value: row.values[selectedPlanId],
    }));
  }, [selectedPlanId]);

  return (
    <Layout>
      <div className="min-h-screen bg-background">
        <Dialog open={Boolean(selectedPlanId)} onOpenChange={(open) => !open && setSelectedPlanId(null)}>
          <DialogContent className="max-w-2xl">
            {selectedPlan && selectedPlanId && (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center justify-between">
                    <span>{selectedPlan.name}</span>
                    <Badge variant="outline" className="text-accent border-accent">
                      {selectedPlan.price}
                      {selectedPlan.period}
                    </Badge>
                  </DialogTitle>
                  <DialogDescription>{selectedPlan.description}</DialogDescription>
                </DialogHeader>

                <div className="rounded-xl border border-border/60 bg-secondary/30 p-4 space-y-3">
                  <p className="text-sm font-medium text-foreground">What you get</p>
                  <div className="space-y-2">
                    {selectedPlanFeatures.map((item) => (
                      <div key={item.name} className="flex items-start justify-between gap-4 text-sm">
                        <span className="text-muted-foreground">{item.name}</span>
                        <span className="text-foreground font-medium text-right">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {!user ? (
                  <Button variant="accent" onClick={() => navigate("/auth")}>
                    Log in to Subscribe
                  </Button>
                ) : (
                  <PayPalSubscriptionButton
                    plan={selectedPlanId}
                    disabled={profile?.plan === selectedPlanId}
                    onApprove={async (subscriptionId) => {
                      await activatePlan(selectedPlanId, subscriptionId);
                      setSelectedPlanId(null);
                    }}
                  />
                )}
              </>
            )}
          </DialogContent>
        </Dialog>

        {/* Header */}
        <section className="py-16 md:py-24 bg-secondary/30">
          <div className="container mx-auto px-4 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 text-accent text-sm font-medium mb-6">
              <Sparkles className="w-4 h-4" />
              Simple, Transparent Pricing
            </div>
            <h1 className="text-3xl md:text-5xl font-bold text-foreground mb-4">
              Choose Your Plan
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Start free and scale as you grow. Upgrade or cancel anytime.
            </p>
          </div>
        </section>

        {/* Pricing Cards */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-6 max-w-6xl mx-auto">
              {pricingPlans.map((plan) => (
                <div
                  key={plan.id}
                  className={cn(
                    "relative bg-card rounded-2xl border-2 p-7 card-hover",
                    plan.highlight
                      ? "border-accent shadow-glow"
                      : "border-border/60"
                  )}
                >
                  {plan.badge && (
                    <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-accent text-accent-foreground px-4 py-1">
                      {plan.badge}
                    </Badge>
                  )}

                  <h3 className="text-xl font-bold text-foreground mb-2">
                    {plan.name}
                  </h3>

                  <div className="mb-6">
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-bold text-foreground">
                        {plan.price}
                      </span>
                      <span className="text-muted-foreground">{plan.period}</span>
                    </div>
                    <p className="text-muted-foreground mt-2 text-sm">
                      {plan.description}
                    </p>
                  </div>

                  <Button
                    variant={plan.highlight ? "accent" : "outline"}
                    className="w-full mb-6"
                    size="lg"
                    onClick={() => {
                      if (!user) {
                        navigate("/auth");
                        return;
                      }
                      if (plan.id === "free") {
                        toast({ title: "Free plan", description: "You can start immediately on Free." });
                        return;
                      }
                      if (plan.id === "starter" || plan.id === "optimizer" || plan.id === "enterprise") {
                        setSelectedPlanId(plan.id);
                      }
                    }}
                  >
                    {plan.cta}
                    <ArrowRight className="w-4 h-4" />
                  </Button>

                  <div className="rounded-xl border border-border/60 bg-secondary/40 p-4 text-sm">
                    <p className="text-muted-foreground">Best For</p>
                    <p className="font-semibold text-foreground">{plan.bestFor}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Feature Comparison Table */}
        <section className="py-16 bg-secondary/30">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground text-center mb-12">
              Full Feature Comparison
            </h2>

            <div className="max-w-6xl mx-auto overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-4 px-4 font-semibold text-foreground">
                      Feature
                    </th>
                    {pricingPlans.map((plan) => (
                      <th
                        key={plan.id}
                        className="text-center py-4 px-4 font-semibold text-foreground w-40"
                      >
                        <div className="flex items-center justify-center gap-2">
                          {plan.name}
                          {plan.badge && (
                            <Badge variant="outline" className="border-accent text-accent text-xs">
                              {plan.badge}
                            </Badge>
                          )}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {featureRows.map((feature, index) => (
                    <tr
                      key={feature.name}
                      className={cn(
                        "border-b border-border/50",
                        index % 2 === 0 ? "bg-card/50" : ""
                      )}
                    >
                      <td className="py-4 px-4 text-sm text-foreground">
                        {feature.name}
                      </td>
                      {pricingPlans.map((plan) => (
                        <td
                          key={plan.id}
                          className={cn(
                            "py-4 px-4 text-center",
                            plan.highlight ? "bg-accent/5" : ""
                          )}
                        >
                          <span
                            className={cn(
                              "text-sm",
                              plan.highlight ? "font-medium text-accent" : "text-foreground"
                            )}
                          >
                            {feature.values[plan.id]}
                          </span>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* FAQ / CTA */}
        <section className="py-16">
          <div className="container mx-auto px-4 text-center">
            <div className="max-w-2xl mx-auto">
              <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
                Still Have Questions?
              </h2>
              <p className="text-muted-foreground mb-8">
                Our team is here to help you find the perfect plan for your business needs.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Button variant="accent" size="lg">
                  Contact Sales
                </Button>
                <Button variant="outline" size="lg">
                  View FAQ
                </Button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </Layout>
  );
}
