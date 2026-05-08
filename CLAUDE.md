# Claude — Die Cast Vault

**Diecast car collection tracker for collectors of Hot Wheels, Matchbox, and similar brands.**
Collectors track their inventory, log checklists, manage duplicates, build a wanted list, and share a public showcase page.

Built by **built_by_Beck**. All commits must include `built_by_Beck` in the commit message.

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS + React Router v6
- **Backend**: Firebase Auth + Firestore + Firebase Storage (client-side SDK)
- **Cloud Functions**: not yet implemented — all logic is client-side today
- **Billing**: Stripe (stripeCustomerId/subscriptionId stored in UserDoc — integration pending)
- **Deployment**: Firebase Hosting

## Build Commands

- `npm run dev` — start Vite dev server
- `npm run build` — TypeScript check + Vite production build (`tsc && vite build`)
- `npm run preview` — serve the production build locally

## Architecture (This Project Is User-Centric, Not Org-Centric)

Die Cast Vault is a **single-user SaaS** — each user owns their own data. The data model lives under `usr/{uid}/...` subcollections, NOT `org/{orgId}/...`.

This differs from the workspace default. Do not apply org-based multi-tenant patterns here.

Key rules:
1. **All user operational data goes under `usr/{uid}/...`** (cars, checklists, wanted, photos, etc.)
2. **Plans are user-based** (none → free → basic → premium + lifetimeAccess override). `getEffectivePlan()` returns `'free'` for any authenticated user with no active subscription — Firestore stores `plan: 'none'` but clients always resolve via `getEffectivePlan()`.
3. **Plan enforcement is centralized in `src/lib/access.ts`** — do not scatter plan checks across components
4. **Public profile/showcase** — items are only publicly visible when `publicVisible: true` AND the user has `publicProfileEnabled: true`. Never expose private items.
5. **Stripe will be billing source of truth** — when implemented, Firestore caches the subscription state. The client must never directly mutate `plan`, `stripeCustomerId`, `subscriptionStatus`, or `lifetimeAccess`.
6. **Admin role** (`role: 'admin'`) has elevated access — changes to admin-gated logic are always LARGE.

## Plans

| Plan | maxCars | maxPhotosPerCar | maxShowcaseCars | maxCustomChecklists | Notes |
|------|---------|-----------------|-----------------|---------------------|-------|
| none / free | 0 | 0 | 0 | 0 | Checklists fully accessible; inventory/showcase gated |
| basic | 250 | 1 | 10 | 3 | $5/mo |
| premium | unlimited | 5 | 25 | unlimited | $20/mo |

`lifetimeAccess: true` always resolves to premium regardless of subscription status.

## Key Files

- `src/types/index.ts` — all TypeScript types (Car, UserDoc, UserProfile, Checklist*, etc.)
- `src/lib/access.ts` — plan resolution and limit logic (`getEffectivePlan`, `getPlanLimits`)
- `src/lib/firebase.ts` — Firebase app initialization
- `src/contexts/AuthContext.tsx` — auth state and user document listener
- `src/lib/checklistUtils.ts` — checklist logic
- `src/lib/parseChecklist.ts` — checklist parsing utilities
- `src/lib/checklistProgressFirestore.ts` — persist checklist qty/favorites under `usr/{uid}/checklistProgress/...`

## PBRD Workflow

Follow PBRD for every task: Plan → Build → Review → Document.
See workspace `CLAUDE.md` and `docs/AI_WORKFLOW.md` for the full workflow.

### Before Any Work

1. Read this file.
2. Read recent entries in `agent-system/agent-info.md` (last 40 lines default).
3. Search `agent-system/lessons_learned.md` by keyword when risk or repetition is likely.
4. Classify the task as SMALL, MEDIUM, or LARGE before editing anything.

### Task Sizing

- **SMALL**: 1-3 files, no high-risk systems. Use PBRD Lite.
- **MEDIUM**: 4-8 files or a user-facing workflow change. Focused Plan + Build + Review.
- **LARGE**: auth, Stripe billing, plan-gating logic in `access.ts`, Firestore rules, public visibility logic, user data deletion, admin role changes, or more than 8 files. Full PBRD always.

### High-Risk Areas For This Project

- Auth (`src/contexts/AuthContext.tsx`, Firebase Auth rules)
- Stripe billing integration (when added — Cloud Functions required)
- Plan-gating (`src/lib/access.ts`) — any change here affects every plan-limited feature
- Public visibility (`publicVisible`, `publicProfileEnabled`) — wrong logic exposes private data
- User data deletion — must clean up all subcollections
- Firestore security rules (when written)
- Production deployment

## Environment Variables

```
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID
VITE_STRIPE_PUBLISHABLE_KEY  (when Stripe is added)
```

## Memory

Append concise results to `agent-system/agent-info.md`. Add prevention rules to `agent-system/lessons_learned.md` only for avoidable mistakes.
