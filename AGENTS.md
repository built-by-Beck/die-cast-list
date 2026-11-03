# Repository AI Instructions — Die Cast Vault / Die Cast List

**Diecast car collection tracker for Hot Wheels, Matchbox, and similar brand collectors.**

Built by **David Beck**. All commits must include `built_by_Beck` in the commit message.

`CLAUDE.md` is the detailed architecture reference — read it first. This file is the short
process contract that applies to every agent working in this repo.

## Product Direction

`README.md` describes current capabilities; `ROADMAP.md` records approved remaining work. Prioritize every-year Hot Wheels checklist coverage, independent per-member quantities/details, and images. Catalog duplicate detection is distinct from a member owning multiple copies. Public showcase and marketplace expansion are deferred. Apache 2.0 covers original project code; preserve separate source-content licenses. Build only the approved task scope; production publication requires authorization.

## Tech Stack

- React 18 + TypeScript + Vite + Tailwind CSS + React Router (v7 package, v6-style APIs)
- Firebase Auth + Firestore + Storage (client SDK)
- Cloud Functions — **two deployed codebases**: `functions/` (Stripe, Node 22) and
  `functions/ai/` (Genkit + Gemini, Node 22), both in `us-central1`
- Stripe billing — **live**: Checkout via callable `createCheckoutSession`, state synced by `stripeWebhook`
- Hosting — Firebase project `collectors-garage-app`; the `diecastlist.com` domain is currently
  served from Hostinger, not Firebase Hosting

## Architecture

User-centric SaaS (not org/multi-tenant). Two root namespaces, and they are not interchangeable:

- `users/{uid}` — the `UserDoc`: `role`, `plan`, `subscriptionStatus`, Stripe IDs, `lifetimeAccess`.
  Billing and role fields are webhook-owned; `firestore.rules` blocks the client from writing them.
- `usr/{uid}/...` — all operational data: `cars`, `wanted`, `trackedLists`,
  `checklistProgress/{checklistId}/progressItems`, `photos`, `settings`.
- Global: `checklists/{id}` + `/items` (public read, admin write), `marketplaceIntents`
  (public read when active, premium-only write), `adminLogs`.

Rules:

- Plans are `none | free | basic | premium`. Always resolve with `getEffectivePlan(userDoc)` from
  `src/lib/access.ts` — never read `userDoc.plan` directly. `lifetimeAccess: true` → premium.
- Plan limits come from `PLAN_LIMITS` in `src/lib/access.ts`. Do not scatter plan checks into components.
- Gating lives in three synchronized places: `src/lib/access.ts`, `firestore.rules`, and the
  `assertPremium`/`assertAdmin` guards in `functions/ai/src/index.ts`.
- Public visibility requires **both** `publicVisible` on the item and `publicProfileEnabled` on the
  owner. Public profile/showcase pages are still unbuilt stubs with no supporting security rules.
- Stripe is the billing source of truth. The client never mutates subscription state.
- Admin role (`role: 'admin'`) changes are always LARGE.

## Required PBRD Workflow

Plan → Build → Review → Document.

1. Classify every task before editing: SMALL, MEDIUM, or LARGE.
2. Use Plan before Build for non-trivial work.
3. Build only approved scope.
4. Review before accepting changes.
5. Run Document when docs or user-facing behavior changed.
6. Update `agent-system/agent-info.md` after meaningful work.
7. Add lessons to `agent-system/lessons_learned.md` for avoidable mistakes.

## Task Classification

- **SMALL**: 1-3 files, no high-risk system.
- **MEDIUM**: 4-8 files or a workflow/user-facing change.
- **LARGE**: auth, Stripe/billing, plan-gating (`access.ts`), `firestore.rules`, `storage.rules`,
  public visibility, user data deletion, admin role, production deployment, or more than 8 files.

## Token Budget Rules

- Do not read the whole repo by default.
- Read recent `agent-system/agent-info.md` entries only (last 40 lines default).
- Search lessons by keyword before broad reads.
- Keep plans, reviews, and memory entries concise.

## Commands

- `npm run dev` — Vite dev server
- `npm run typecheck` / `npm run lint` — `tsc --noEmit` (same thing)
- `npm run build` — `tsc && vite build`
- `npm run format` — Prettier
- `npm run deploy:functions` — deploy Cloud Functions to `collectors-garage-app`

No test framework is configured. Validation = typecheck/build, plus
`npm --prefix functions run build` and `npm --prefix functions/ai run build` for backend changes.

## Verify Before Documenting

Deployment and billing state drift from what these files claim. When a task depends on
"what is actually live", check it (`firebase functions:list`, response headers on the live domain,
the Stripe Dashboard) instead of trusting a doc — several stale claims have already been corrected
this way.

## Review Verdicts

- ACCEPTED
- ACCEPTED WITH MINOR CONCERNS
- REVISION REQUIRED
- REPLANNING REQUIRED
