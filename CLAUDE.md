# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

**Die Cast List / Die Cast Vault** — diecast car collection tracker (Hot Wheels, Matchbox, etc.).
Collectors track inventory, work checklists, manage duplicates, keep a wanted list, and post buy/sell/trade intents.

Built by **built_by_Beck**. Every commit message must contain `built_by_Beck`.
Production: https://diecastlist.com — Firebase project `collectors-garage-app`.

## Commands

```bash
npm run dev            # Vite dev server
npm run typecheck      # tsc --noEmit  (npm run lint is an alias for this)
npm run build          # tsc && vite build
npm run preview        # serve the production build
npm run format         # prettier --write on src + root json/md
npm run deploy:functions   # firebase deploy --only functions --project collectors-garage-app
```

There is **no test framework** in this repo. "Validation" means `npm run typecheck` (or `npm run build`)
plus, for backend changes, `npm --prefix functions run build` / `npm --prefix functions/ai run build`.

Cloud Functions are separate npm packages with their own `node_modules` — install/build inside
`functions/` and `functions/ai/`, not from the repo root.

Deploy targets:

```bash
firebase deploy --only functions:default --project collectors-garage-app   # Stripe
firebase deploy --only functions:ai      --project collectors-garage-app   # Genkit/Gemini
firebase deploy --only hosting,firestore,storage --project collectors-garage-app
```

## Architecture

Single-user SaaS: every user owns their own data. There is **no org/tenant layer** — do not apply
org-based multi-tenant patterns from other projects in this workspace.

### Two root namespaces — this trips people up

| Path | Contents | Who writes it |
|------|----------|---------------|
| `users/{uid}` | `UserDoc` — identity, `role`, `plan`, `subscriptionStatus`, `stripeCustomerId`, `stripeSubscriptionId`, `lifetimeAccess` | Client creates it at signup with safe defaults; **billing/role fields are written only by the Stripe webhook** (blocked client-side by `firestore.rules`) |
| `usr/{uid}/...` | all operational data: `cars`, `wanted`, `trackedLists`, `checklistProgress/{checklistId}/progressItems`, `photos`, `settings` | The owning user |

Global collections: `checklists/{id}` + `checklists/{id}/items` (master checklists — public read, admin
write), `marketplaceIntents` (public read when `isActive`, write requires premium), `adminLogs` (admin only).

`users` vs `usr` is deliberate and load-bearing — mixing them silently breaks security rules.

### Plans and gating

`Plan = 'none' | 'free' | 'basic' | 'premium'`. Firestore stores `'none'` for a new account;
clients must always resolve through `getEffectivePlan(userDoc)` in `src/lib/access.ts`, which returns
`'free'` for any authenticated user without an active subscription and `'premium'` whenever
`lifetimeAccess === true`. Never read `userDoc.plan` directly.

Real limits live in `PLAN_LIMITS` (`src/lib/access.ts`) — treat that constant as the source of truth,
not this table:

| Plan (UI name) | trackedLists | inventoryCars | photos/car | showcase | customChecklists | AI / marketplace |
|---|---|---|---|---|---|---|
| free | 0 | 0 | 0 | 0 | 0 | no |
| basic ("Basic", $7/mo) | 1 | 10 | 1 | 10 | 3 | no |
| premium ("Pro", $22/mo) | 25 | 5000 | 1 | 25 | unlimited | yes |

`premium` is the internal id; the UI and Stripe price call it **Pro**. Free users are inside the app
(checklists work); inventory, showcase, marketplace, and AI are gated.

**Gating is enforced in three places and they must stay in sync:**
1. `src/lib/access.ts` — client-side limits (never scatter plan checks into components)
2. `firestore.rules` — server-side check for `marketplaceIntents` writes and `publicIntentStatus` on progress items
3. `functions/ai/src/index.ts` — `assertPremium` / `assertAdmin` guards on callables

### Billing (Stripe, live)

`src/lib/billing.ts` → callable `createCheckoutSession` (`functions/src/index.ts`) → Stripe Checkout →
`stripeWebhook` maps the subscription's price ID back to `basic`/`premium` and writes
`plan`/`subscriptionStatus`/`stripeCustomerId` onto `users/{uid}`. The webhook **skips users with
`lifetimeAccess: true`** so comped accounts are never downgraded. Success/cancel land on
`/dashboard?checkout=...`.

Secrets (`defineSecret`, Secret Manager): `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`.
Params (`defineString`, `functions/.env`): `PUBLIC_APP_URL`, `STRIPE_PRICE_BASIC_ID`, `STRIPE_PRICE_PRO_ID`.
A value must never be in both places — that combination fails deploy with an "overlaps non secret
environment variable" error.

Comped access is granted by hand: set `lifetimeAccess: true` on the user doc in the Firebase console
(see `LAUNCH.md`). There is no in-app path to grant it, on purpose.

> As of 2026-08-01 the Stripe account has **no webhook endpoint registered** for this project, so
> checkout completes but no plan is ever written back. Check `LAUNCH.md` → "Known blocker" before
> touching or testing billing.

### AI codebase (`functions/ai`, Genkit + Gemini)

Callables `suggestCarSeries`, `importChecklistFromWiki`, `importChecklistAdmin`,
`fetchFandomChecklistHtml`, `askAI`. Secret: `GOOGLE_GENAI_API_KEY`. Node 22 here vs Node 20 in
`functions/` — keep the engines fields as they are.

### Frontend structure

- `src/App.tsx` — all routes. Public: `/`, `/login`, `/p/:slug`, `/showcase/:userId`.
  Everything else nests under `ProtectedRoute` → `AppLayout`, with `/admin/*` inside `AdminRoute`.
- `src/contexts/AuthContext.tsx` — `onAuthStateChanged` + a live `onSnapshot` on `users/{uid}`; exposes
  `{ user, userDoc, loading }` via `useAuth()`.
- `src/hooks/` — `useInventory`, `useWantedList`, `useChecklistsFirestore` own their Firestore listeners.
  Prefer extending a hook over adding raw Firestore calls in a page.
- `src/lib/firebase.ts` — Firebase only initializes when `VITE_FIREBASE_API_KEY` is set; otherwise
  `auth`/`db`/`storage` are undefined and the app renders logged-out. Don't assume `db` exists at import time.
- `src/lib/parseChecklist.ts` / `parseFandomPaste.ts` — checklist import parsing;
  `firestoreConverters.ts` maps docs to types.
- Types live in `src/types/index.ts`. Tailwind, no component library; shared primitives in `src/components/ui/`.

### Things that will bite you

- **`ownerUid` on progress items** — `src/lib/checklistProgressFirestore.ts` stamps `ownerUid` on every
  `progressItems` doc. The duplicates view queries them by `collectionGroup`, and both `firestore.rules`
  and `firestore.indexes.json` depend on that field. Omitting it breaks reads with a permission error.
- **Checklist item status is computed** from `quantityOwned` (`need`/`owned`/`duplicate`) — never set it directly.
- **Attribution fields** on `MasterChecklist` (`sourceName`, `sourceUrl`, `sourceLicense`,
  `sourceAttribution`) exist for source licensing. Do not drop them from imports.
- **Public visibility needs both** `item.publicVisible === true` **and** the owner's
  `publicProfileEnabled === true`. Checking one exposes private data.
- **Public profile/showcase are unfinished** — `PublicProfilePage` and `PublicShowcasePage` are 15-line
  "not found" stubs, `UserProfile`/`UserSettings` have no Firestore read/write wiring yet, and
  `firestore.rules` has no public-read rule for profile data. Building this out is a LARGE task that
  requires new rules.
- **Storage paths use `users/{uid}/...`** (`src/lib/uploads.ts`, `storage.rules`) — note that's `users`,
  matching the user-doc namespace, not `usr`.
- **The frontend is served from two places** (verified 2026-08-01):
  `diecastlist.com` is served by **Hostinger** (`platform: hostinger` response header) from an uploaded
  `dist/`, while `collectors-garage-app.web.app` is Firebase Hosting running an older build. Both talk to
  the same Firebase backend. So `firebase deploy --only hosting` does **not** ship to the production
  domain — that needs a `dist/` upload to Hostinger, and `public/.htaccess` is the live SPA-fallback
  config for it (not dead code). Ask before assuming which host a frontend change is meant for.

## Environment

Frontend `.env` (see `.env.example`): `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`,
`VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_STORAGE_BUCKET`, `VITE_FIREBASE_MESSAGING_SENDER_ID`,
`VITE_FIREBASE_APP_ID`, optional `VITE_FIREBASE_FUNCTIONS_REGION` (default `us-central1`) and
`VITE_SITE_URL`. No Stripe secret ever goes in a `VITE_` var.

## PBRD Workflow

Plan → Build → Review → Document. Before any work:

1. Read this file.
2. Read the last ~40 lines of `agent-system/agent-info.md`.
3. Keyword-search `agent-system/lessons_learned.md` when the task is risky or repetitive.
4. Classify the task before editing.

**Sizing** — SMALL: 1-3 files, no high-risk system (PBRD Lite). MEDIUM: 4-8 files or a user-facing
workflow change. LARGE (full PBRD): auth, Stripe/billing, `src/lib/access.ts`, `firestore.rules`,
`storage.rules`, public visibility, user data deletion, admin role, production deploy, or >8 files.

Review verdicts: ACCEPTED / ACCEPTED WITH MINOR CONCERNS / REVISION REQUIRED / REPLANNING REQUIRED.

Append a concise entry to `agent-system/agent-info.md` after meaningful work; add to
`agent-system/lessons_learned.md` only for avoidable mistakes.
