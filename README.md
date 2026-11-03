# Die Cast List

Built by **David Beck**. A diecast collection tracker originally intended to help his friend Keith remember which Hot Wheels he owns, still needs, and has duplicates of.

The central goal is a shared catalog covering every Hot Wheels release year, with a separate checklist for each member. Entering `1` means one owned copy; `3` means three copies and two duplicates. Catalog records describe releases; member quantities and collection details belong to that member. Coverage of every year is a goal, not a claim about the current database.

## Current status

This is an independently developed application under active development. The repository contains React screens and Firebase persistence for checklists, quantities, inventory, wanted lists and marketplace intents, plus Stripe subscription integration and Gemini-assisted features. These integrations have not been verified end to end.

Known incomplete areas:

- Profile and preference screens display success without persisting their edits.
- Public profile and showcase routes are stubs.
- Image support is unfinished: upload/import helpers and image fields exist, but reliable upload, source-image capture and display require implementation review and verification.
- Marketplace listings/intents exist; messaging is marked coming soon. Completed trades, member-to-member checkout and payments are not established by this review.
- Annual catalog coverage, source permissions and import reliability need auditing.
- No automated test suite or Firebase emulator setup is configured.

See [ROADMAP.md](ROADMAP.md) for approved remaining work and proposed details awaiting design decisions. Sharing and marketplace expansion are deferred behind tracking reliability.

## Stack and data

React 18, TypeScript, Vite, Tailwind CSS and React Router; Firebase Authentication, Firestore and Storage; Stripe billing; Genkit/Gemini Cloud Functions.

- `users/{uid}` stores account identity and protected billing/role state.
- `usr/{uid}/...` stores private member inventory, wanted lists and checklist progress.
- `checklists/{id}/items` stores shared master lists. Member quantities do not modify this catalog.
- `functions/` contains Stripe functions (declares Node 22).
- `functions/ai/` contains AI/import functions (declares Node 22).

Plan resolution and limits live in `src/lib/access.ts`. Subscription billing is separate from any proposed member-to-member trading or sales functionality. Do not change gating as part of catalog work without an explicit access-policy decision.

## Local setup

Prerequisites: Git, npm and a Node version compatible with the package being built. Use an isolated development Firebase project for authenticated workflows. Do not point review sessions at production data. Both backend packages now declare Node 22; verify deployment state separately.

```bash
npm ci
cp .env.example .env.local
npm run dev
```

The frontend can render its logged-out surface without Firebase configuration; authenticated collection workflows require Firebase. Fill the `VITE_FIREBASE_*` placeholders with your development project's client configuration. Optional variables are `VITE_FIREBASE_FUNCTIONS_REGION` and `VITE_SITE_URL`. Vite exposes `VITE_` values to the browser: never put server credentials there. Vite bundles configured environment values into production builds.

Backend dependencies are separate:

```bash
npm --prefix functions ci
npm --prefix functions/ai ci
npm --prefix functions run build
npm --prefix functions/ai run build
```

Stripe requires server-side `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` in Secret Manager and non-secret parameters `PUBLIC_APP_URL`, `STRIPE_PRICE_BASIC_ID`, `STRIPE_PRICE_PRO_ID`. AI functions require the server-side secret `GOOGLE_GENAI_API_KEY`. Never commit or share production secrets. See [LAUNCH.md](LAUNCH.md) for operational boundaries.

## Checks and scripts

```bash
npm run typecheck
npm run build
npm run preview
```

`npm run lint` is an alias for the TypeScript check, not a separate lint suite. `npm run format:check` checks formatting; `npm run format` rewrites files. No automated frontend test suite is configured.

Verified on 2026-11-02 from a fresh dependency install: `npm ci`, `npm run typecheck` and `npm run build` pass on Node 24. `npm --prefix functions run build` and `npm --prefix functions/ai run build` also pass after `npm --prefix functions/ai ci`. There is no automated test suite, so these checks prove the code compiles and bundles, not that the product works end to end.

## Catalog sources and licensing

The intended source is [Hot Wheels Wiki on Fandom](https://hotwheels.fandom.com/wiki/List_of_Hot_Wheels), including its annual release lists. Future imports must record source URLs, revisions when available, attribution and applicable content licenses, with preview and duplicate reconciliation before publication. Images require their own rights review. Missing source years must be reported, not filled with invented entries. See roadmap CAT-01 through CAT-03.

Original project code is licensed under the [Apache License 2.0](LICENSE). Copyright 2026 David Beck; see [NOTICE](NOTICE). Third-party text, data, images and dependencies retain their respective terms; the code license does not relicense them.

## Deployment

Historical repository records dated 2026-08-01 describe `diecastlist.com` on Hostinger and `collectors-garage-app.web.app` on Firebase Hosting, sharing Firebase project `collectors-garage-app`. Those deployments have not been reverified. Do not assume a Firebase Hosting deployment updates the custom domain. Deployment is a separate, explicitly authorized operation.

## New paid memberships paused (local change, 2026-11-01)

New checkout is disabled in the frontend. The Stripe callable now rejects new sessions unless its CHECKOUT_ENABLED parameter is explicitly true (default false). Deploy the backend with CHECKOUT_ENABLED=false and ship the frontend to make the pause live; local edits alone do not stop the deployed site. Free signup remains available. Existing subscriptions and previously created Checkout sessions are not canceled by this change; review those separately in Stripe if all future charges must stop. Keep webhook processing enabled. Reopening requires deliberate backend and frontend changes.

Deployment retry (2026-11-01): Firebase authentication succeeded, but the project has billing disabled. Secret Manager returned HTTP 403 and the function update did not deploy. The local Stripe runtime declaration is now Node 22 because Firebase rejected Node 20 deployments. Restore project billing before retrying; no live checkout pause is confirmed.
