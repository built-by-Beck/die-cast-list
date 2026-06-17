import { FirebaseError } from 'firebase/app';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { firebaseApp } from './firebase';

export type CheckoutPlan = 'basic' | 'premium';

const DEFAULT_FUNCTIONS_REGION = 'us-central1';
const PENDING_CHECKOUT_PLAN_KEY = 'dcv_pending_checkout_plan';

export function parseCheckoutPlan(
  value: string | null | undefined,
): CheckoutPlan | null {
  return value === 'basic' || value === 'premium' ? value : null;
}

/** Persist selected plan across Google OAuth popup redirect. */
export function stashPendingCheckoutPlan(plan: CheckoutPlan): void {
  sessionStorage.setItem(PENDING_CHECKOUT_PLAN_KEY, plan);
}

export function takePendingCheckoutPlan(): CheckoutPlan | null {
  const raw = sessionStorage.getItem(PENDING_CHECKOUT_PLAN_KEY);
  sessionStorage.removeItem(PENDING_CHECKOUT_PLAN_KEY);
  return parseCheckoutPlan(raw);
}

export function checkoutPlanLabel(plan: CheckoutPlan): string {
  return plan === 'premium' ? 'Pro' : 'Basic';
}

/**
 * Starts Stripe Checkout via the Cloud Function `createCheckoutSession`.
 * Redirects the browser to Stripe on success.
 */
export async function startStripeCheckout(plan: CheckoutPlan): Promise<void> {
  if (!firebaseApp) {
    throw new Error('Firebase is not configured.');
  }

  const region =
    (import.meta.env.VITE_FIREBASE_FUNCTIONS_REGION as string | undefined)?.trim() ||
    DEFAULT_FUNCTIONS_REGION;

  const createCheckoutSession = httpsCallable(
    getFunctions(firebaseApp, region),
    'createCheckoutSession',
  );

  const result = await createCheckoutSession({ plan });
  const data = result.data as { url?: string };

  if (data?.url) {
    window.location.assign(data.url);
    return;
  }

  throw new Error('Checkout did not return a URL.');
}

/** User-facing message for failed checkout / callable errors. */
export function formatCheckoutError(error: unknown): string {
  if (error instanceof FirebaseError) {
    if (error.code === 'functions/failed-precondition') {
      return 'Billing is not configured yet. Deploy Cloud Functions and set Stripe pricing in the Firebase project.';
    }
    if (error.code === 'functions/unauthenticated') {
      return 'Sign in to continue to checkout.';
    }
    return error.message;
  }
  if (error instanceof Error) return error.message;
  return 'Checkout failed. Please try again.';
}
