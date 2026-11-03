# Die Cast List — Launch & Operations Guide

**Production site:** https://diecastlist.com — currently served by **Hostinger**
**Firebase Hosting URL:** https://collectors-garage-app.web.app — serves an **older build**
**Firebase project:** `collectors-garage-app` (display name: Die-Cast-Vault)
**Console:** https://console.firebase.google.com/project/collectors-garage-app

Historical live-system verification recorded: **2026-08-01**. Not reverified on 2026-10-31.

## Development priorities (2026-10-31)

The collector-first goal and approved remaining work are documented in [README.md](README.md) and [ROADMAP.md](ROADMAP.md): shared annual Hot Wheels lists covering every year, private per-member quantities/details, reliable images and regression coverage. The annual catalog import and remaining workflows are planned work. Public showcasing and marketplace expansion are deferred.

Do not use the historical tables below as a current operational check. Current user counts, subscription state and hosting/runtime status are NOT VERIFIED. Verify live state before operational changes. Preserve authentic history and avoid sharing account identifiers unnecessarily.

---

## Historical deployment record (2026-08-01)

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
at this project's `stripeWebhook` function, so payments never became plans. Historical notes record a paid account that did not receive its plan until the synchronization failure was corrected.

**What was done on 2026-08-01:**

1. Created endpoint `<we-id>` →
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

### Historical account remediation

An affected account was manually reconciled during the incident. Individual account IDs, subscription records and payment details are omitted from this guide. Use authorized operational systems for account-specific troubleshooting.

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
| Basic | Die Cast Vault Basic | `<price-id>` | $7.00 / month |
| Pro (`premium`) | Die Cast Vault Pro | `<price-id>` | $22.00 / month |

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

## Historical manual activation fallback (incident response only)

1. You see the payment in the Stripe Dashboard (with the buyer's email).
2. In **Firestore → `users`**, find that buyer's document (match on `email`) and set **both**:
   - `plan` → `basic` or `premium`
   - `subscriptionStatus` → `active`
   > Both are required. Setting `plan` alone does nothing — the app reads `subscriptionStatus`
   > to decide whether the plan is active.
3. To cancel/revoke later: set `subscriptionStatus` to `canceled`.

The webhook is the source of truth and, when processing events, will overwrite manual edits on the
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

- [ ] Reverify the previously recorded webhook registration and confirm a signed event in an isolated/test-mode workflow; registration was recorded as completed on 2026-08-01.
- [ ] Decide on one hosting front door for diecastlist.com; redeploy whichever host is stale.
- [ ] Sign up your account + Keith's at the live site, then grant `lifetimeAccess`.
- [ ] Build out the public profile / showcase pages — the routes exist but render "not found" stubs,
      and `firestore.rules` has no public-read rule for profile data yet.

---
Built by **David Beck**.

## New paid memberships paused (local change, 2026-11-01)

New checkout is disabled in the frontend. The Stripe callable now rejects new sessions unless its CHECKOUT_ENABLED parameter is explicitly true (default false). Deploy the backend with CHECKOUT_ENABLED=false and ship the frontend to make the pause live; local edits alone do not stop the deployed site. Free signup remains available. Existing subscriptions and previously created Checkout sessions are not canceled by this change; review those separately in Stripe if all future charges must stop. Keep webhook processing enabled. Reopening requires deliberate backend and frontend changes.

Deployment retry (2026-11-01): Firebase authentication succeeded, but the project has billing disabled. Secret Manager returned HTTP 403 and the function update did not deploy. The local Stripe runtime declaration is now Node 22 because Firebase rejected Node 20 deployments. Restore project billing before retrying; no live checkout pause is confirmed.
