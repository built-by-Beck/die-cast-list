# Die Cast Vault — Launch & Operations Guide

**Live site:** https://collectors-garage-app.web.app
**Firebase project:** `collectors-garage-app` (display name: Die-Cast-Vault)
**Console:** https://console.firebase.google.com/project/collectors-garage-app

---

## What is live

| Piece | Status |
|-------|--------|
| App (Firebase Hosting) | ✅ Deployed |
| Firestore database + security rules + indexes | ✅ Deployed |
| Storage rules | ✅ Deployed |
| Auth — Email/Password sign-in | ✅ Enabled |
| Auth — Google sign-in | ✅ Enabled |
| Paid upgrade path (Stripe) | ⚠️ Not finished — see "Turning on paid plans" |

Anyone can sign up today and use the **free tier** (checklists). Inventory, showcase,
and marketplace are Pro features and stay locked until an account is upgraded.

---

## Granting free lifetime Pro (you + Keith)

The app **cannot** give anyone Pro by itself — that is deliberate, so nobody can hand
themselves free access. Permanent free access is the `lifetimeAccess` flag on a user's
record. `lifetimeAccess: true` overrides everything — no Stripe, no subscription needed.

1. The person signs up at https://collectors-garage-app.web.app → **Create Account**.
2. Open **Firebase Console → Firestore Database → `users` collection**.
3. Find their document — match on the `email` field.
4. Set `lifetimeAccess` to `true` (boolean).
5. Optional: set `lifetimeAccessReason`, e.g. `"Founder"` or `"Beta tester — Keith"`.
6. They refresh the app → full Pro, forever.

> **About the Stripe coupon idea:** a 100%-off coupon only makes the *Stripe charge*
> $0 — it does **not** activate the account inside Die Cast Vault. For you + Keith use
> `lifetimeAccess` above. Save coupons for discounting real paying customers.

---

## Turning on paid plans (manual activation)

There is **no automatic billing yet** (that needs Cloud Functions — a later phase).
For now, paying customers are activated by hand:

**One-time setup:**
1. In the **Stripe Dashboard → Payment Links**, create two links:
   - Basic — $7/mo
   - Pro — $22/mo
2. Add them to `.env` (uncomment and fill in the two lines):
   ```
   VITE_STRIPE_BASIC_LINK=https://buy.stripe.com/...
   VITE_STRIPE_PREMIUM_LINK=https://buy.stripe.com/...
   ```
3. Rebuild + redeploy (see below). The in-app upgrade buttons go live.

**Each time someone pays:**
1. You see the payment in the Stripe Dashboard (with the buyer's email).
2. In **Firestore → `users`**, find that buyer's document (match on `email`) and set
   **both** fields:
   - `plan` → `basic` or `premium`
   - `subscriptionStatus` → `active`
   > Both are required. Setting `plan` alone does nothing — the app reads
   > `subscriptionStatus` to decide if the plan is active.
3. To cancel/revoke later: set `subscriptionStatus` to `canceled`.

---

## Redeploying after any change

```
npm run build && firebase deploy
```

To deploy only the website (faster): `firebase deploy --only hosting`.

---

## What still needs you

- [ ] Sign up your account + Keith's at the live site, then grant `lifetimeAccess`.
- [ ] Create the two Stripe Payment Links, add them to `.env`, redeploy.
- [ ] (Optional) Point a custom domain at Firebase Hosting in the Console.

---
Built by **built_by_Beck**.
