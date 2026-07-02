import type { Plan } from "@prisma/client";

/**
 * Single source of truth for what each plan can do.
 * Every gate in the product reads from here — UI and API alike.
 */
export interface PlanLimits {
  maxWatches: number; // Infinity = unlimited
  maxProjects: number;
  impactReportsPerMonth: number;
  instantAlerts: boolean;
  webhooks: boolean;
  canRemoveAttribution: boolean;
}

export const PLAN_LIMITS: Record<Plan, PlanLimits> = {
  FREE: {
    maxWatches: 5,
    maxProjects: 1,
    impactReportsPerMonth: 2,
    instantAlerts: false, // weekly digest only
    webhooks: false,
    canRemoveAttribution: false,
  },
  PRO: {
    maxWatches: Number.POSITIVE_INFINITY,
    maxProjects: 5,
    impactReportsPerMonth: 50,
    instantAlerts: true,
    webhooks: false,
    canRemoveAttribution: true,
  },
  TEAM: {
    maxWatches: Number.POSITIVE_INFINITY,
    maxProjects: 25,
    impactReportsPerMonth: 500,
    instantAlerts: true,
    webhooks: true,
    canRemoveAttribution: true,
  },
};

export const PLAN_PRICES = {
  PRO: { monthly: 12, yearly: 115 },
  TEAM: { monthly: 29, yearly: 278 },
} as const;

export type PaidPlan = "PRO" | "TEAM";
export type BillingInterval = "month" | "year";
