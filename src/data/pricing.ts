export type PlanId = "free" | "starter" | "optimizer" | "enterprise";

export interface PricingPlan {
  id: PlanId;
  name: string;
  price: string;
  period: string;
  description: string;
  bestFor: string;
  cta: string;
  highlight?: boolean;
  badge?: string;
}

export interface FeatureRow {
  name: string;
  values: Record<PlanId, string>;
}

export const pricingPlans: PricingPlan[] = [
  {
    id: "free",
    name: "Free",
    price: "$0",
    period: "/mo",
    description: "Try the basics and validate your first AI workflow.",
    bestFor: "Testing & Hobby",
    cta: "Get Started",
  },
  {
    id: "starter",
    name: "Starter 🌱",
    price: "$10",
    period: "/mo",
    description: "Perfect for side hustles and solo operators.",
    bestFor: "Side Hustles / Solo",
    cta: "Start Starter",
  },
  {
    id: "optimizer",
    name: "Optimizer 🚀",
    price: "$100",
    period: "/mo",
    description: "Built for local shops and SMBs scaling fast.",
    bestFor: "Local Shops / SMBs",
    cta: "Start Optimizer",
    highlight: true,
    badge: "Most Popular",
  },
  {
    id: "enterprise",
    name: "Enterprise 👑",
    price: "$300",
    period: "/mo",
    description: "Advanced features for growing AI agencies.",
    bestFor: "Growing AI Agencies",
    cta: "Talk to Sales",
  },
];

export const featureRows: FeatureRow[] = [
  {
    name: "AI Bot",
    values: {
      free: "Standard Chat (limited)",
      starter: "Standard Chat",
      optimizer: "Pro + Logic",
      enterprise: "Multi-Agent Flow",
    },
  },
  {
    name: "Client List",
    values: {
      free: "Basic Table (limited)",
      starter: "Basic Table",
      optimizer: "CRM Integration",
      enterprise: "Full Admin Panel",
    },
  },
  {
    name: "Booking",
    values: {
      free: "Link Only",
      starter: "Link Only",
      optimizer: "Live Calendar",
      enterprise: "Automated Sync",
    },
  },
  {
    name: "Support",
    values: {
      free: "Community",
      starter: "Community",
      optimizer: "Email",
      enterprise: "Priority Chat",
    },
  },
];
