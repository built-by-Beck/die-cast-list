# Die Cast Vault — Launch & Operations Guide

**Production site:** https://diecastlist.com — currently served by **Hostinger**
**Firebase Hosting URL:** https://collectors-garage-app.web.app — serves an **older build**
**Firebase project:** `collectors-garage-app` (display name: Die-Cast-Vault)
**Console:** https://console.firebase.google.com/project/collectors-garage-app

Last verified against live systems: **2026-08-01**.

---

## What is live

| Piece | Status |
|-------|--------|
| Frontend on diecastlist.com (Hostinger) | ✅ Serving the current branding/build |
| Frontend on collectors-garage-app.web.app (Firebase Hosting) | ⚠️ Older build still deployed |
| Firestore database + security rules + indexes | ✅ Deployed |
| Storage rules | ✅ Deployed |
| Auth — Email/Password + Google sign-in | ✅ Enabled |
| Cloud Functions — Stripe (`createCheckoutSession`, `stripeWebhook`) | ✅ Deployed, us-central1 |
| Cloud Functions — AI (`askAI`, `suggestCarSeries`, 2 import fns, fandom fetch) | ✅ Deployed, us-central1 |
| Stripe products + prices (Basic $7, Pro $22) | ✅ Created, live mode |
| Stripe webhook endpoint | ✅ Created + signing secret set + functions redeployed (2026-08-01) |

Anyone can sign up today and use the **free tier** (checklists). Inventory, showcase,
marketplace, and AI are paid features.

---

## The billing outage of 2026-06 → 2026-08 (fixed)

Checkout always worked; the **return path** was missing. Until 2026-08-01 no webhook endpoint pointed
at this project's `stripeWebhook` function, so payments never became plans. A real customer paid $7
on 2026-07-20 and sat on the free tier for twelve days before this was caught.

**What was done on 2026-08-01:**

1. Created endpoint `we_1TzoZJAzoOtBRx5Sw3CunVUr` →
   `https://us-central1-collectors-garage-app.cloudfunctions.net/stripeWebhook`, subscribed to
   `checkout.session.completed`, `customer.subscription.created/updated/deleted`, `invoice.payment_failed`.
2. Stored the endpoint's signing secret as `STRIPE_WEBHOOK_SECRET` version 2.
3. Redeployed `functions:default` so `stripeWebhook` binds version 2 (revision `stripewebhook-00002-taq`).
4. Confirmed routing: an unsigned POST to the registered URL returns
   `400 Missing stripe-signature header`, i.e. it reaches the real handler.

**Still worth doing once:** confirm a *signed* event succeeds. Stripe Dashboard → the endpoint →
**Send test webhook**. A `200` proves signature verification passes. (The handler will log
"could not resolve user" for a synthetic test event — that is expected and still a 200.) After that,
the real proof is the next paid signup landing on `plan: basic|premium` automatically.

If deliveries ever start failing again, check that the secret version bound to the deployed function
matches the endpoint — `firebase functions:log --only stripeWebhook` shows
"Webhook signature verification failed" when it does not.

### Accounts fixed by hand

| Date | uid | What happened |
|------|-----|----------------|
| 2026-08-01 | `RCm8f66gwLXmDaerkDVVDWQnJbm2` | Paid $7 Basic on 2026-07-20 (`sub_1TvIKdAzoOtBRx5S1Ssdu4Li`), never activated. `plan`, `subscriptionStatus`, `stripeCustomerId`, `stripeSubscriptionId` set manually. Consider a refund or comp month for the lost time. |

**Not a customer:** the $22 Pro subscription `sub_1Tf4PsAzoOtBRx5SSnKdmifX` (customer
`cus_UeN3OA5TC31bXj`, since 2026-06-04) was the owner's own live-mode test. Deliberately left
unlinked to any account, and cancelled. Nothing to reconcile.

> **Test in test mode, not live mode.** Live-mode test purchases cost ~$0.94 in Stripe fees per
> cycle and clutter real revenue reporting. Use test-mode keys and card `4242 4242 4242 4242`
> instead — free, unlimited, and it exercises the same Checkout + webhook path. A test-mode webhook
> endpoint pointing at the same function URL is needed for the return path to work in test mode.

---

## How paid plans work now

The old "create a Payment Link and paste it into `.env`" flow is **gone** — `VITE_STRIPE_BASIC_LINK`
and `VITE_STRIPE_PREMIUM_LINK` are not read by any code. Ignore any instructions mentioning them.

Current flow:

1. User clicks upgrade (landing page, `UpgradeWall`, or Settings) → `startStripeCheckout(plan)`
2. → callable `createCheckoutSession` builds a Stripe Checkout Session
3. → Stripe redirects back to `/dashboard?checkout=success|cancel`
4. → `stripeWebhook` maps the purchased price ID to `basic`/`premium` and writes
   `plan`, `subscriptionStatus`, `stripeCustomerId`, `stripeSubscriptionId` onto `users/{uid}`

Live prices (Stripe, live mode):

| Plan | Product | Price ID | Amount |
|------|---------|----------|--------|
| Basic | Die Cast Vault Basic | `price_1TUfLCAzoOtBRx5S8VwXuRF5` | $7.00 / month |
| Pro (`premium`) | Die Cast Vault Pro | `price_1TUfQ4AzoOtBRx5Sgpi5sqd2` | $22.00 / month |

These must match the `STRIPE_PRICE_BASIC_ID` / `STRIPE_PRICE_PRO_ID` function params, or the webhook
maps the subscription to `none` and the customer gets nothing.

**Configuration split — getting this wrong breaks deploys:**

- Secret Manager (`firebase functions:secrets:set`): `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`
- `functions/.env` params: `PUBLIC_APP_URL`, `STRIPE_PRICE_BASIC_ID`, `STRIPE_PRICE_PRO_ID`

A value must never be in both places — that produces
`Secret environment variable overlaps non secret environment variable` at deploy time.

---

## Granting free lifetime Pro (you + Keith)

The app **cannot** give anyone Pro by itself — deliberate, so nobody can hand themselves free access.
`lifetimeAccess: true` overrides everything: no Stripe, no subscription needed. The webhook also
skips users with this flag, so a comped account can never be downgraded by a Stripe event.

1. The person signs up at https://diecastlist.com → **Create Account**.
2. Firebase Console → **Firestore Database → `users` collection**.
3. Find their document — match on the `email` field.
4. Set `lifetimeAccess` to `true` (boolean).
5. Optional: set `lifetimeAccessReason`, e.g. `"Founder"` or `"Beta tester — Keith"`.
6. They refresh the app → full Pro, forever.

> **About the Stripe coupon idea:** a 100%-off coupon only makes the *Stripe charge* $0 — it does
> **not** activate the account inside Die Cast Vault. For you + Keith use `lifetimeAccess`.
> Save coupons for discounting real paying customers.

---

## Manual activation fallback (until the webhook is registered)

1. You see the payment in the Stripe Dashboard (with the buyer's email).
2. In **Firestore → `users`**, find that buyer's document (match on `email`) and set **both**:
   - `plan` → `basic` or `premium`
   - `subscriptionStatus` → `active`
   > Both are required. Setting `plan` alone does nothing — the app reads `subscriptionStatus`
   > to decide whether the plan is active.
3. To cancel/revoke later: set `subscriptionStatus` to `canceled`.

Once the webhook is registered it becomes the source of truth and will overwrite manual edits on the
next subscription event — which is what you want. Prefer `lifetimeAccess` for permanent comps.

---

## Deploying

**Backend / rules (Firebase):**

```bash
npm run build
firebase deploy --only firestore,storage --project collectors-garage-app
npm run deploy:functions                      # both function codebases
firebase deploy --only functions:default --project collectors-garage-app   # Stripe only
firebase deploy --only functions:ai      --project collectors-garage-app   # AI only
```

**Frontend:** `firebase deploy --only hosting` publishes to
`collectors-garage-app.web.app` — **not** to diecastlist.com. The production domain is on Hostinger,
so shipping there means uploading the contents of `dist/` (including `.htaccess`, which provides the
React Router SPA fallback) to the Hostinger web root.

Worth deciding: either point diecastlist.com at Firebase Hosting and retire the Hostinger upload, or
keep Hostinger as the front door. Running both means the two hosts drift apart, which they already
have.

---

## What still needs you

- [ ] **Register the Stripe webhook endpoint** and set `STRIPE_WEBHOOK_SECRET` (see Known blocker).
- [ ] Decide on one hosting front door for diecastlist.com; redeploy whichever host is stale.
- [ ] Sign up your account + Keith's at the live site, then grant `lifetimeAccess`.
- [ ] Build out the public profile / showcase pages — the routes exist but render "not found" stubs,
      and `firestore.rules` has no public-read rule for profile data yet.

---
Built by **built_by_Beck**.
