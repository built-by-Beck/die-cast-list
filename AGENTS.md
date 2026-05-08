# Repository AI Instructions — Die Cast Vault

**Diecast car collection tracker for Hot Wheels, Matchbox, and similar brand collectors.**

Built by **built_by_Beck**. All commits must include `built_by_Beck` in the commit message.

## Tech Stack

- React 18 + TypeScript + Vite + Tailwind CSS + React Router v6
- Firebase Auth + Firestore + Firebase Storage (client-side)
- Stripe billing (pending — stripeCustomerId/subscriptionId in UserDoc)
- Firebase Hosting

## Architecture

This is a **user-centric SaaS** (not org/multi-tenant). Data lives under `usr/{uid}/...`.

- All operational data under `usr/{uid}/...` — NOT `org/{orgId}`.
- Plans are user-based: `none`, `basic`, `premium` (+ `lifetimeAccess` override).
- Plan enforcement is centralized in `src/lib/access.ts` — never scatter plan checks.
- Public visibility is controlled by `publicVisible` per item AND `publicProfileEnabled` per user. Both must be true for public exposure.
- When Stripe is added: Stripe is billing source of truth. Client never mutates subscription state directly.
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

- **SMALL**: 1-3 files, no high-risk systems.
- **MEDIUM**: 4-8 files or a workflow/user-facing change.
- **LARGE**: auth, Stripe, plan-gating (`access.ts`), Firestore rules, public visibility logic, user data deletion, admin role, production deployment, or more than 8 files. Full PBRD always.

## Token Budget Rules

- Do not read the whole repo by default.
- Read recent `agent-system/agent-info.md` entries only (last 40 lines default).
- Search lessons by keyword before broad reads.
- Keep plans, reviews, and memory entries concise.

## Build Commands

- `npm run dev` — Vite dev server
- `npm run build` — `tsc && vite build`
- `npm run preview` — serve production build

## Review Verdicts

- ACCEPTED
- ACCEPTED WITH MINOR CONCERNS
- REVISION REQUIRED
- REPLANNING REQUIRED
