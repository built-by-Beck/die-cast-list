# Active PBRD Plan — Die Cast Vault

Use this file for LARGE tasks or when a durable plan handoff is needed.
SMALL tasks use a short mini-plan in the agent response. MEDIUM tasks may use a short plan here or inline.

## Plan Template

```md
# [Task Name]

Classification: [SMALL | MEDIUM | LARGE]

Current stage: Plan

Gate A status: awaiting approval before Build edits

## Goal

[What the user wants and what success means]

## Scope

In scope:
- [item]

Out of scope:
- [item]

## Files To Inspect Or Change

- [path]

## Build Steps

1. [step]
2. [step]
3. [step]

## Validation

- Formatter: `npm run format` (Prettier)
- Linter: `npm run lint` (alias for typecheck — no ESLint on the frontend)
- Typecheck: `npm run typecheck` / `npm run build`
- Functions: `npm --prefix functions run build`, `npm --prefix functions/ai run build`
- Tests: not configured
- Manual checks: [checks]

## Review Focus

- Plan compliance
- Plan-gating correctness — client (src/lib/access.ts), rules (firestore.rules), and functions
  (assertPremium/assertAdmin) must stay in sync
- Public visibility safety (publicVisible + publicProfileEnabled)
- Correct namespace: `users/{uid}` for the UserDoc vs `usr/{uid}/...` for operational data
- Auth and user data access
- Regression risk

## Document Pass

[Required, not needed, or deferred with reason]

## Handoff to build-agent

[Short note — what to start first, any warnings, key context]
```


## 2026-11-01 — Pause new paid memberships

Classification: LARGE (billing). Authorized: stop new paid signups. Plan: default-off backend checkout parameter; frontend guard and disabled purchase entry points; free authentication remains; document deployment boundaries. Review backend rejects before Stripe/Firestore access, old plan URLs cannot initiate checkout, webhooks unchanged. Validate frontend/backend builds and inspect diff before deployment. Existing subscriptions and open sessions require separate live-state review; do not claim they are canceled.

Billing pause review: frontend and Stripe builds passed; mocked checkout guards passed. AI build unverified due missing Genkit dependencies. Deployment attempted and failed during Firebase authentication. Next: authenticate Firebase, deploy targeted guard with CHECKOUT_ENABLED=false, verify rejected checkout, upload frontend to actual hosting.

Checkout pause deployment follow-up: authenticated retry rejected Node 20 as decommissioned. Minimal prerequisite: update Stripe engine and matching lockfile root metadata to Node 22, rebuild and redeploy only createCheckoutSession. Webhook deployment remains out of scope; verify runtime and checkout-disabled environment after success.

Authenticated deployment retry: upgraded local Stripe runtime declaration/lockfile to Node 22; build and checkout guards passed. Discovery succeeded with extended timeout. Deployment stopped at Secret Manager HTTP 403: Firebase billing disabled. Next dependency is restoring billing; do not claim the live checkout block or runtime upgrade shipped.

## 2026-11-02 — Alignerr BYOP submission preparation

Classification: MEDIUM (docs, manifests, lockfiles).

Plan: inspect eligibility against the supplied BYOP rules; make only reversible readiness repairs (lockfile sync, unused conflicting dev dependency, README check evidence); keep private submission drafts outside the repository; do not push, publish, deploy, relicense or rewrite history.

Result: fresh install and all builds pass. Remaining blockers are owner actions and an Alignerr eligibility ruling on personal-data processing. Details in the private readiness report.
