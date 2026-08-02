# Die Cast List

Diecast collection tracker (React + Vite + Firebase + Stripe).

**Production site:** [https://diecastlist.com](https://diecastlist.com) — served from Hostinger
**Firebase Hosting URL:** [https://collectors-garage-app.web.app](https://collectors-garage-app.web.app) — currently an older build

See `LAUNCH.md` for live status, the hosting split, and operational runbooks.

## Scripts

- `npm run dev` — Vite dev server
- `npm run build` — TypeScript check + production build
- `npm run preview` — Serve production build locally
- `npm run typecheck` — TypeScript only (`npm run lint` is an alias)
- `npm run format` — Prettier over `src` and root json/md

No test framework is configured.

## Stripe billing (Cloud Functions)

Paid plans use **Stripe Checkout** via the callable function `createCheckoutSession` and a **webhook** function `stripeWebhook` that syncs subscription state into Firestore `users/{uid}`.

### What you configure

1. **Firebase project** — set frontend env vars (see `.env.example`). Optional: `VITE_FIREBASE_FUNCTIONS_REGION` if your functions are not in `us-central1`.

2. **Functions parameters** (non-secrets) — set named parameters used by the code:

   - `PUBLIC_APP_URL` — HTTPS origin of the hosted app (success/cancel URLs), no trailing slash — use `https://diecastlist.com`
   - `STRIPE_PRICE_BASIC_ID` — Stripe recurring price ID for Basic  
   - `STRIPE_PRICE_PRO_ID` — Stripe recurring price ID for Pro  

   Use the Firebase CLI parameter workflow for your project (for example `firebase deploy` prompts or project-specific `.env` under `functions/` for local emulator only). Do not commit real values.

3. **Secrets** (Stripe + webhook):

   - `STRIPE_SECRET_KEY`  
   - `STRIPE_WEBHOOK_SECRET`  

   Configure these with your platform’s secret manager so they are never in source control.

4. **Stripe Dashboard** — create a webhook endpoint pointing at the deployed `stripeWebhook` URL
   (`https://us-central1-collectors-garage-app.cloudfunctions.net/stripeWebhook`) and subscribe to at least:

   - `checkout.session.completed`  
   - `customer.subscription.created`  
   - `customer.subscription.updated`  
   - `customer.subscription.deleted`  
   - `invoice.payment_failed`  

   > **Status (2026-08-01): this endpoint is not registered yet.** Checkout completes but no plan is
   > written back to Firestore. See `LAUNCH.md` → "Known blocker".

### Deploy

Firebase project must match your frontend `VITE_FIREBASE_PROJECT_ID` (this repo uses **`collectors-garage-app`** — see `.firebaserc`).

**Before the first deploy that uses Stripe secrets:** enable the **Secret Manager API** on your Google Cloud project (same ID as Firebase). If deploy fails with HTTP 403 on `secretmanager.googleapis.com`, open the URL from the error in Google Cloud Console and enable the API, wait a minute, then run `npm run deploy:functions` again.

From the repo root (includes a `predeploy` build for `functions/`):

```bash
npm run deploy:functions
```

That runs `firebase deploy --only functions --project collectors-garage-app` so the CLI cannot target the wrong project by mistake — it deploys **both** function codebases.

To deploy one at a time:

```bash
firebase deploy --only functions:default --project collectors-garage-app   # Stripe
firebase deploy --only functions:ai      --project collectors-garage-app   # AI
```

Full stack example:

```bash
npm run build
firebase deploy --project collectors-garage-app
```

Note that `firebase deploy --only hosting` publishes to `collectors-garage-app.web.app`, **not** to
diecastlist.com — that domain is served from Hostinger. See `LAUNCH.md`.

## AI features (Cloud Functions, `functions/ai`)

A second functions codebase (`ai`) runs Genkit + Gemini and exposes the callables `askAI`,
`suggestCarSeries`, `importChecklistFromWiki`, `importChecklistAdmin`, and `fetchFandomChecklistHtml`.
AI is Pro-only, enforced server-side by `assertPremium` (admin imports use `assertAdmin`).

Requires the secret `GOOGLE_GENAI_API_KEY`:

```bash
firebase functions:secrets:set GOOGLE_GENAI_API_KEY --project collectors-garage-app
```

### Functions packages

`functions/` (Node 20) and `functions/ai/` (Node 22) are separate npm packages with their own
`node_modules` — install and build inside each. Production values belong in Firebase-managed
configuration, not committed files.
