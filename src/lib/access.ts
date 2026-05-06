import type { UserDoc, Plan, PlanLimits } from '../types';

export function getEffectivePlan(userDoc: UserDoc): Plan {
  if (userDoc.lifetimeAccess === true) return 'premium';
  const status = userDoc.subscriptionStatus ?? '';
  if (status === 'active' || status === 'trialing') {
    return userDoc.plan || 'basic';
  }
  return 'none';
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

export function canAccessApp(userDoc: UserDoc): boolean {
  return getEffectivePlan(userDoc) !== 'none';
}
