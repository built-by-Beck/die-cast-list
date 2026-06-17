import * as logger from "firebase-functions/logger";
import { initializeApp } from "firebase-admin/app";
import { FieldValue, getFirestore } from "firebase-admin/firestore";
import { onCall, onRequest, HttpsError } from "firebase-functions/v2/https";
import { defineSecret, defineString } from "firebase-functions/params";
import Stripe from "stripe";

initializeApp();
const db = getFirestore();

const stripeSecretKey = defineSecret("STRIPE_SECRET_KEY");
const stripeWebhookSecret = defineSecret("STRIPE_WEBHOOK_SECRET");

const publicAppUrl = defineString("PUBLIC_APP_URL", {
  description:
    "HTTPS origin of the hosted app (success/cancel URLs), no trailing slash",
});

const priceBasicId = defineString("STRIPE_PRICE_BASIC_ID", {
  description: "Stripe recurring Price ID for Basic",
});

const priceProId = defineString("STRIPE_PRICE_PRO_ID", {
  description: "Stripe recurring Price ID for Pro",
});

const functionsRegion = "us-central1";

type AppPlanField = "none" | "basic" | "premium";

function getStripe(): Stripe {
  return new Stripe(stripeSecretKey.value(), {
    // Use the Stripe account's default API version
    typescript: true,
  });
}

function planFromPriceId(
  priceId: string | undefined,
  basicId: string,
  proId: string,
): AppPlanField {
  if (!priceId) return "none";
  if (priceId === proId) return "premium";
  if (priceId === basicId) return "basic";
  return "none";
}

function mapStripeSubscriptionStatus(
  status: Stripe.Subscription.Status,
): "active" | "trialing" | "canceled" | "past_due" | "unpaid" | null {
  switch (status) {
    case "active":
      return "active";
    case "trialing":
      return "trialing";
    case "past_due":
      return "past_due";
    case "unpaid":
      return "unpaid";
    case "canceled":
    case "incomplete_expired":
      return "canceled";
    case "incomplete":
      return "unpaid";
    case "paused":
      return "canceled";
    default:
      return "canceled";
  }
}

function resolvePriceIdFromSubscription(sub: Stripe.Subscription): string | undefined {
  const first = sub.items.data[0];
  return first?.price?.id ?? undefined;
}

async function findUidByStripeCustomerId(
  customerId: string,
): Promise<string | null> {
  const snap = await db
    .collection("users")
    .where("stripeCustomerId", "==", customerId)
    .limit(1)
    .get();
  if (snap.empty) return null;
  return snap.docs[0].id;
}

async function syncSubscriptionToFirestore(
  stripe: Stripe,
  uid: string,
  sub: Stripe.Subscription,
  basicId: string,
  proId: string,
): Promise<void> {
  const userRef = db.collection("users").doc(uid);
  const userSnap = await userRef.get();
  if (!userSnap.exists) {
    logger.error("User not found for subscription sync", { uid });
    return;
  }

  const userData = userSnap.data() as { lifetimeAccess?: boolean };
  if (userData.lifetimeAccess === true) {
    logger.info("Skipping subscription write for lifetime user", { uid });
    return;
  }

  const priceId = resolvePriceIdFromSubscription(sub);
  const status = mapStripeSubscriptionStatus(sub.status);
  const customerId =
    typeof sub.customer === "string" ? sub.customer : sub.customer.id;

  const paidAccess =
    sub.status === "active" || sub.status === "trialing";
  const planField: AppPlanField = paidAccess
    ? planFromPriceId(priceId, basicId, proId)
    : "none";

  await userRef.set(
    {
      stripeCustomerId: customerId,
      stripeSubscriptionId: sub.id,
      subscriptionStatus: status,
      plan: planField,
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true },
  );
}

/**
 * Authenticated callable — creates a Stripe Checkout session for Basic or Pro.
 */
export const createCheckoutSession = onCall(
  {
    region: functionsRegion,
    secrets: [stripeSecretKey],
    cors: true,
  },
  async (request) => {
    if (!request.auth?.uid) {
      throw new HttpsError(
        "unauthenticated",
        "You must be signed in to start checkout.",
      );
    }

    const rawPlan = request.data?.plan as string | undefined;
    if (rawPlan !== "basic" && rawPlan !== "premium") {
      throw new HttpsError(
        "invalid-argument",
        'plan must be "basic" or "premium".',
      );
    }

    const basicId = priceBasicId.value().trim();
    const proId = priceProId.value().trim();
    const baseUrl = publicAppUrl.value().trim().replace(/\/$/, "");

    if (!basicId || !proId) {
      throw new HttpsError(
        "failed-precondition",
        "Stripe Price IDs are not configured for Cloud Functions.",
      );
    }
    if (!baseUrl || !baseUrl.startsWith("https://")) {
      throw new HttpsError(
        "failed-precondition",
        "PUBLIC_APP_URL must be set to an https:// URL for checkout redirects.",
      );
    }

    const priceId = rawPlan === "premium" ? proId : basicId;
    const uid = request.auth.uid;
    const email =
      (request.auth.token.email as string | undefined)?.trim() || undefined;

    const userRef = db.collection("users").doc(uid);
    const userSnap = await userRef.get();
    const existingCustomerId = userSnap.exists
      ? ((userSnap.data() as { stripeCustomerId?: string | null })
          .stripeCustomerId as string | null)
      : null;

    const stripe = getStripe();

    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${baseUrl}/dashboard?checkout=success`,
      cancel_url: `${baseUrl}/dashboard?checkout=cancel`,
      client_reference_id: uid,
      metadata: {
        firebaseUid: uid,
        plan: rawPlan,
      },
      subscription_data: {
        metadata: {
          firebaseUid: uid,
          plan: rawPlan,
        },
      },
    };

    if (existingCustomerId) {
      sessionParams.customer = existingCustomerId;
    } else if (email) {
      sessionParams.customer_email = email;
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

    if (!session.url) {
      throw new HttpsError("internal", "Checkout session missing redirect URL.");
    }

    return { url: session.url };
  },
);

/**
 * Stripe webhook — verifies signature and syncs subscription state to Firestore.
 */
export const stripeWebhook = onRequest(
  {
    region: functionsRegion,
    secrets: [stripeSecretKey, stripeWebhookSecret],
    cors: false,
    invoker: "public",
  },
  async (req, res): Promise<void> => {
    if (req.method !== "POST") {
      res.status(405).send("Method Not Allowed");
      return;
    }

    const basicId = priceBasicId.value().trim();
    const proId = priceProId.value().trim();
    if (!basicId || !proId) {
      logger.error("STRIPE_PRICE_BASIC_ID / STRIPE_PRICE_PRO_ID not configured");
      res.status(500).send("Server misconfiguration");
      return;
    }

    const stripe = getStripe();
    const sig = req.headers["stripe-signature"];
    if (!sig || typeof sig !== "string") {
      res.status(400).send("Missing stripe-signature header");
      return;
    }

    const rawBody = req.rawBody;
    if (!rawBody) {
      logger.error("Missing raw body on webhook request");
      res.status(400).send("Missing body");
      return;
    }

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(
        rawBody,
        sig,
        stripeWebhookSecret.value(),
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : "verify failed";
      logger.error("Webhook signature verification failed", message);
      res.status(400).send(`Webhook Error: ${message}`);
      return;
    }

    try {
      switch (event.type) {
        case "checkout.session.completed": {
          const session = event.data.object as Stripe.Checkout.Session;
          const uid =
            session.client_reference_id ||
            session.metadata?.firebaseUid ||
            null;
          const subId =
            typeof session.subscription === "string"
              ? session.subscription
              : session.subscription && "id" in session.subscription
                ? session.subscription.id
                : null;

          if (!uid || !subId) {
            logger.error("checkout.session.completed missing uid or subscription", {
              uid,
              subId,
            });
            break;
          }

          const sub = await stripe.subscriptions.retrieve(subId);
          await syncSubscriptionToFirestore(stripe, uid, sub, basicId, proId);
          break;
        }

        case "customer.subscription.created":
        case "customer.subscription.updated":
        case "customer.subscription.deleted": {
          const sub = event.data.object as Stripe.Subscription;
          let uid: string | null = sub.metadata?.firebaseUid ?? null;

          if (!uid) {
            const customerId =
              typeof sub.customer === "string"
                ? sub.customer
                : sub.customer.id;
            uid = await findUidByStripeCustomerId(customerId);
          }

          if (!uid) {
            logger.warn("Subscription event: could not resolve user", {
              subscriptionId: sub.id,
            });
            break;
          }

          await syncSubscriptionToFirestore(stripe, uid, sub, basicId, proId);
          break;
        }

        case "invoice.payment_failed": {
          const invoice = event.data.object as Stripe.Invoice;
          const subId =
            typeof invoice.subscription === "string"
              ? invoice.subscription
              : invoice.subscription?.id;

          if (!subId) break;

          const sub = await stripe.subscriptions.retrieve(subId);
          let uid: string | null = sub.metadata?.firebaseUid ?? null;
          if (!uid) {
            const customerId =
              typeof sub.customer === "string"
                ? sub.customer
                : sub.customer?.id;
            if (customerId) {
              uid = await findUidByStripeCustomerId(customerId);
            }
          }
          if (!uid) break;

          await syncSubscriptionToFirestore(stripe, uid, sub, basicId, proId);
          break;
        }

        default:
          logger.info("Ignoring unhandled Stripe event type", {
            type: event.type,
          });
      }
    } catch (err) {
      logger.error("Webhook handler error", err);
      res.status(500).send("Webhook handler failed");
      return;
    }

    res.json({ received: true });
  },
);
