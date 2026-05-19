import type { UserDoc, Plan, PlanLimits } from "../types";

export const PLAN_LIMITS = {
  basic: {
    name: "Basic",
    priceMonthly: 7,
    trackedLists: 1,
    inventoryCars: 10,
    photosPerCar: 1,
    advancedStatuses: false,
    marketplaceSearch: false,
    marketplaceIntents: false,
    seriesFiltering: false,
    showcaseCars: 10,
    customChecklists: 3,
  },
  premium: {
    name: "Pro",
    priceMonthly: 22,
    trackedLists: 25,
    inventoryCars: 5_000,
    photosPerCar: 1,
    advancedStatuses: true,
    marketplaceSearch: true,
    marketplaceIntents: true,
    seriesFiltering: true,
    showcaseCars: 25,
    customChecklists: 999_999,
  },
  free: {
    name: "Free",
    priceMonthly: 0,
    trackedLists: 0,
    inventoryCars: 0,
    photosPerCar: 0,
    advancedStatuses: false,
    marketplaceSearch: false,
    marketplaceIntents: false,
    seriesFiltering: false,
    showcaseCars: 0,
    customChecklists: 0,
  },
} as const;

export function getEffectivePlan(userDoc: UserDoc): Plan {
  if (userDoc.lifetimeAccess === true) return "premium";
  const status = userDoc.subscriptionStatus ?? "";
  if (status === "active" || status === "trialing") {
    return userDoc.plan || "basic";
  }
  // Authenticated users with no active subscription get free-tier checklist access
  return "free";
}

export function getPlanLimits(effectivePlan: Plan): PlanLimits {
  const cfg =
    effectivePlan === "premium"
      ? PLAN_LIMITS.premium
      : effectivePlan === "basic"
        ? PLAN_LIMITS.basic
        : PLAN_LIMITS.free;
  return {
    maxCars: cfg.inventoryCars,
    maxPhotosPerCar: cfg.photosPerCar,
    maxShowcaseCars: cfg.showcaseCars,
    maxCustomChecklists: cfg.customChecklists,
    maxTrackedLists: cfg.trackedLists,
  };
}

export function getPlanConfig(effectivePlan: Plan) {
  if (effectivePlan === "premium") return PLAN_LIMITS.premium;
  if (effectivePlan === "basic") return PLAN_LIMITS.basic;
  return PLAN_LIMITS.free;
}

export function canAccessPremium(userDoc: UserDoc): boolean {
  return getEffectivePlan(userDoc) === "premium";
}

export function canUseAI(userDoc: UserDoc): boolean {
  return getEffectivePlan(userDoc) === "premium";
}

// Free users are in the app (checklists), just gated from paid features
export function canAccessApp(userDoc: UserDoc): boolean {
  const plan = getEffectivePlan(userDoc);
  return plan !== "none";
}

export function canAddCar(userDoc: UserDoc, currentCarCount: number): boolean {
  return getPlanLimits(getEffectivePlan(userDoc)).maxCars > currentCarCount;
}

export function canTrackAnotherList(
  userDoc: UserDoc,
  trackedListCount: number,
): boolean {
  return (
    getPlanLimits(getEffectivePlan(userDoc)).maxTrackedLists > trackedListCount
  );
}
