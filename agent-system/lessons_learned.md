# Lessons Learned — Die Cast Vault

Use this file for avoidable mistakes, repeated issues, bad assumptions, or process failures.
The goal is to prevent the same mistake from happening twice.

Do not add routine completion notes here. Use `agent-info.md` for normal handoffs.

## Lesson Template

```md
## YYYY-MM-DD - [Short Lesson Title]

**What happened:**
[Short explanation]

**Impact:**
[What risk, failure, or wasted work happened]

**Root cause:**
[Underlying cause]

**Fix used:**
[What fixed it]

**Prevention rule:**
[Permanent guardrail future agents should follow]
```

---

## Standing Rules (Pre-loaded)

These are architectural guardrails for this project — treat them as lessons already learned:

**Never scatter plan checks** — all plan/limit logic must go through `src/lib/access.ts`. Adding plan checks inline in components leads to inconsistent enforcement.

**Public visibility requires two conditions** — an item is publicly visible only when BOTH `car.publicVisible === true` AND `userProfile.publicProfileEnabled === true`. Checking only one condition exposes private data.

**Stripe state must never be mutated by the client** — `plan`, `stripeCustomerId`, `subscriptionStatus`, and `lifetimeAccess` on `UserDoc` are set only by the `stripeWebhook` Cloud Function. The client reads these values but never writes them, and `firestore.rules` enforces it by rejecting updates that touch those keys.

**`users/{uid}` and `usr/{uid}/...` are different namespaces** — the UserDoc (role, plan, billing) lives at `users/{uid}`; all operational collections live under `usr/{uid}/`. Security rules depend on the distinction, so writing to the wrong prefix fails silently or gets denied.

**`lifetimeAccess` overrides subscription status** — always call `getEffectivePlan(userDoc)` from `src/lib/access.ts` rather than checking `userDoc.plan` directly. `lifetimeAccess: true` resolves to premium regardless of subscription state.

## 2026-05-07 - Mock removal must wire Firestore + rules

**What happened:** Stripping `mockData.ts` and mock branches left pages that still expected in-memory data unless real Firestore listeners and security rules (including `wanted`, nested `progressItems`, and `collectionGroup`) were implemented.

**Impact:** Incomplete removal would compile but show empty screens or runtime permission/index errors.

**Root cause:** Mock data masked missing persistence paths.

**Fix used:** Load checklists from `checklists/` + items; persist progress under `usr/{uid}/checklistProgress/{checklistId}` and subcollection `progressItems`; wanted list under `usr/{uid}/wanted`; deploy `firestore.indexes.json` for collection-group duplicate query.

**Prevention rule:** When removing demo data, map every former mock consumer to a real collection path (or intentional empty UI) before deleting the fixture file.

## 2026-06-16 - Remove dead JSX cleanly; don't gate with `{false && ...}`

**What happened:** While replacing the legacy CSV import modal, an intermediate edit wrapped the old block in `{false && (<Modal>...)}` instead of deleting it. The dead block still referenced state/handlers that had been removed (`importDone`, `parseResult`, `csvText`, `sourceMode`, `handleParse`, `handleImport`), which would have failed `tsc`.

**Impact:** Caught before any build/commit; no shipped breakage. Wasted one edit cycle.

**Root cause:** Tried to "disable" a large block quickly rather than removing it in one clean StrReplace.

**Fix used:** Replaced the entire legacy block (open `{/* CSV Import modal */}` through its closing `</Modal>`) with nothing, leaving only the new `<ImportCarsModal />` usage.

**Prevention rule:** When superseding a component, delete the old block entirely in one edit. Never leave `{false && ...}`-gated JSX that references deleted state — TypeScript still type-checks it.

## 2026-08-01 - Project docs drifted far from the live system

**What happened:** A documentation audit found `CLAUDE.md`, `AGENTS.md`, `LAUNCH.md`, and the `agent-info.md` snapshot all describing a system that no longer existed: "Cloud Functions not yet implemented" (7 were deployed), "Stripe pending" (Checkout + webhook shipped), plan limits wrong on every row (250 cars / 5 photos / $5 / $20 vs the real 10 / 1 / $7 / $22), and the whole data model described as `usr/{uid}` when the UserDoc actually lives at `users/{uid}`. `LAUNCH.md` still instructed the operator to paste Stripe Payment Links into `VITE_STRIPE_BASIC_LINK` / `VITE_STRIPE_PREMIUM_LINK` env vars that no code reads.

**Impact:** Every agent started from a false model of the app. Following `LAUNCH.md` literally would have wasted an operator's time on dead config. The drift also hid a live revenue bug: no Stripe webhook endpoint is registered, so paid checkouts never activate a plan.

**Root cause:** Docs were written at plan time and never re-checked after the features actually shipped. Nothing ever compared them against deployed state.

**Fix used:** Rewrote the docs from the code, and verified live state directly — `firebase functions:list`, response headers on both domains (which revealed diecastlist.com is on Hostinger, not Firebase Hosting), and the Stripe API for products/prices/webhook endpoints.

**Prevention rule:** Treat docs as claims, not facts. Before relying on or restating "what is live" — hosting, deployed functions, billing wiring, plan pricing — verify it against the real system or the code, and date the claim in the doc. When a feature ships, update the doc in the same task.

