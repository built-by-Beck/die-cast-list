import type { UserDoc, Plan, PlanLimits } from '../types';

export function getEffectivePlan(userDoc: UserDoc): Plan {
  if (userDoc.lifetimeAccess === true) return 'premium';
  const status = userDoc.subscriptionStatus ?? '';
  if (status === 'active' || status === 'trialing') {
    return userDoc.plan || 'basic';
  }
  // Authenticated users with no active subscription get free-tier checklist access
  return 'free';
}

export function getPlanLimits(effectivePlan: Plan): PlanLimits {
  if (effectivePlan === 'premium') {
    return {
      maxCars: 999_999,
      maxPhotosPerCar: 5,
      maxShowcaseCars: 25,
      maxCustomChecklists: 999_999,
    };
  }

  if (effectivePlan === 'basic') {
    return {
      maxCars: 250,
      maxPhotosPerCar: 1,
      maxShowcaseCars: 10,
      maxCustomChecklists: 3,
    };
  }

  // 'free' and 'none' — zero inventory limits; checklists remain accessible
  return {
    maxCars: 0,
    maxPhotosPerCar: 0,
    maxShowcaseCars: 0,
    maxCustomChecklists: 0,
  };
}

export function canAccessPremium(userDoc: UserDoc): boolean {
  return getEffectivePlan(userDoc) === 'premium';
}

// Free users are in the app (checklists), just gated from paid features
export function canAccessApp(userDoc: UserDoc): boolean {
  const plan = getEffectivePlan(userDoc);
  return plan !== 'none';
}

export function canAddCar(userDoc: UserDoc, currentCarCount: number): boolean {
  return getPlanLimits(getEffectivePlan(userDoc)).maxCars > currentCarCount;
}
