# Agent Memory — Collectors Garage

Shared running notebook and handoff channel for all PBRD agents.

## Project Snapshot

**Project:** Collectors Garage
**Description:** Diecast car collection tracker for Hot Wheels, Matchbox, and similar brand collectors. Users track inventory, manage checklists, log duplicates, build a wanted list, and share a public showcase.
**Tech Stack:** React 18 + TypeScript + Vite + Tailwind CSS + React Router v6 · Firebase Auth + Firestore + Storage (client-side) · Stripe pending · Firebase Hosting
**Data Model:** User-centric — `usr/{uid}/...` subcollections (NOT org-based)
**Plans:** none → basic (250 cars, 1 photo/car, 10 showcase, 3 custom checklists) → premium (unlimited + 5 photos + 25 showcase) · `lifetimeAccess` override always resolves to premium
**High-Risk Areas:** auth, plan-gating (`src/lib/access.ts`), public visibility logic, Stripe billing (pending), user data deletion, Firestore rules, admin role, production deployment
**Build Commands:** `npm run dev` · `npm run build` (tsc && vite build) · `npm run preview`

## Memory Rules

- Read only the latest relevant entries by default (last 40 lines).
- Do not read this whole file unless task risk justifies it.
- Append concise entries after Plan, Build, Review, and Document work.

## Entry Template

```md
## YYYY-MM-DD - [Mode Or Agent]

**Task:**
[What was requested]

**Summary:**
[What was planned, changed, reviewed, or documented]

**Files Inspected:**
- [path]

**Files Changed:**
- [path or none]

**Validation:**
- [checks run or why not applicable]

**Review Verdict:**
[ACCEPTED | ACCEPTED WITH MINOR CONCERNS | REVISION REQUIRED | REPLANNING REQUIRED | not reviewed yet]

**Risks / Blockers:**
- [risk or none]

**Next Recommended Action:**
[next step]

**Handoff Notes:**
[short handoff]
```

---

## 2026-05-06 - PBRD Setup

**Task:**
Install PBRD system into Collectors Garage project.

**Summary:**
Created CLAUDE.md, AGENTS.md, and agent-system/ files. Project surveyed — React + TypeScript + Vite + Tailwind, Firebase client-side only (no Cloud Functions yet), Stripe pending. User-centric data model (usr/{uid}/...), not org-centric. Plans: none/basic/premium with lifetimeAccess. Plan logic centralized in src/lib/access.ts.

**Files Inspected:**
- src/types/index.ts
- src/lib/access.ts
- package.json

**Files Changed:**
- CLAUDE.md (created)
- AGENTS.md (created)
- agent-system/agent-info.md (created)
- agent-system/plan.md (created)
- agent-system/lessons_learned.md (created)
- agent-system/error_log.jsonl (created)

**Validation:**
- Not applicable (setup only)

**Review Verdict:**
not reviewed yet

**Risks / Blockers:**
- No Firestore security rules written yet — high risk area when addressing
- No Cloud Functions yet — Stripe billing will require them when implemented
- Public visibility logic needs careful review before any changes

**Next Recommended Action:**
Begin first development task using PBRD. Classify task size before editing.

**Handoff Notes:**
Project is active with real pages and data model. First agent should read this file and CLAUDE.md before touching any code.

---

## 2026-05-06 - Phase 1 Direction Update (Pre-PBRD) — RETROACTIVE ENTRY

**Classification:** LARGE (11+ files, major user-facing workflow change)
**PBRD followed:** NO — work was done before PBRD was installed. Documented retroactively.

**Task:**
Rebuild the checklist system to match Hot Wheels Wiki/Fandom style with required columns (toyNumber, collectorNumber, modelName, seriesName, seriesNumber), +/− quantity controls, desktop table view + mobile card view, duplicates page, admin CSV import with wiki markup parser.

**Summary:**
Full checklist system rebuilt from scratch. New types, utility libraries, 24-item mock checklist (6 series), desktop table + mobile card views, series/status filters, +/− quantity buttons, DuplicatesPage, AdminChecklistsPage CSV import using parseChecklistCsv. Fixed DuplicateItemStatus mismatch in AddEditCarPage.

**Files Changed:**
- src/types/index.ts — new MasterChecklistItem shape, ChecklistProgress, ChecklistProgressItem, DuplicateItemStatus
- src/lib/checklistUtils.ts — CREATED: calcQuantityState, incrementQuantity, decrementQuantity, recalculateProgress, DUPLICATE_STATUS_LABELS
- src/lib/parseChecklist.ts — CREATED: cleanWikiMarkup, extractRarityFromTemplates, normalizeChecklistItem, parseChecklistCsv
- src/data/mockData.ts — 24-item 2025 HW Mainline, 6 series, MOCK_CHECKLIST_PROGRESS_ITEMS (Keith pre-seeded)
- src/pages/ChecklistDetailPage.tsx — REWRITTEN: desktop table + mobile cards, +/− qty, series/status filters
- src/pages/DuplicatesPage.tsx — CREATED
- src/pages/admin/AdminChecklistsPage.tsx — added CSV import modal
- src/App.tsx — /duplicates route
- src/components/layout/Sidebar.tsx — Duplicates nav item
- src/pages/ChecklistsPage.tsx — duplicateCount → duplicateItemCount fix
- src/pages/AddEditCarPage.tsx — DuplicateStatus → DuplicateItemStatus fix

**Validation:**
- `npm run build` passed, zero TypeScript errors

**Review Verdict:**
not reviewed yet

**Risks / Blockers:**
- Quantity state is local (React state) — will need Firestore persistence in Phase 2
- MOCK_CHECKLIST_PROGRESS_ITEMS only seeds checklist-1; other checklists show empty progress

---

## 2026-05-06 - Keith Account Removal + Landing Page (Pre-PBRD) — RETROACTIVE ENTRY

**Classification:** LARGE (touched AuthContext.tsx — HIGH-RISK per CLAUDE.md)
**PBRD followed:** NO — done before PBRD installed.

**Task:**
Remove Keith's hardcoded lifetime-premium mock account so he must authenticate via Stripe like all other users. Fix landing page pricing copy (was claiming "It's Free" with no free tier). Add a proper 3-tier pricing section.

**Summary:**
Removed MOCK_USER_DOC and MOCK_USER_PROFILE from mockData.ts. Removed auto-login from AuthContext — without Firebase configured the app now lands on the public landing page (logged out). Simplified PublicProfilePage and PublicShowcasePage to stub "not found" (Phase 5 handles real lookups). Rewrote LandingPage with honest copy: "Get Started Free · Full inventory from $5/month", 3-tier pricing (Free/Basic/Premium).

**Files Changed:**
- src/data/mockData.ts — removed MOCK_USER_DOC, MOCK_USER_PROFILE
- src/contexts/AuthContext.tsx — removed mock auto-login; no Firebase = logged out
- src/pages/ProfilePage.tsx — empty defaults + useAuth() for displayName
- src/pages/PublicProfilePage.tsx — stub (Phase 5)
- src/pages/PublicShowcasePage.tsx — stub (Phase 5)
- src/pages/LandingPage.tsx — 3-tier pricing, honest CTA copy

**Validation:**
- `npm run build` passed, zero TypeScript errors

**Review Verdict:**
not reviewed yet

**Risks / Blockers:**
- AuthContext no longer has mock mode — app requires real Firebase env vars to be usable
- CLAUDE.md plan table still lists 'none' but not 'free' — update when Phase 2 adds free-tier gating
- access.ts returns 'none' for unauthenticated/unsubscribed users — 'free' plan type and upgrade walls are Phase 2 work

**Next Recommended Action:**
Phase 2 planning — Firebase Auth (email/password + Google), Firestore security rules, Stripe billing, plan enforcement / upgrade walls. Use full PBRD (LARGE classification) for all Phase 2 work.

**Handoff Notes:**
App is now auth-gated — requires real Firebase env vars. No mock users. Landing page is accurate. Phase 2 is the next major milestone: real auth + Stripe + plan gating.

---

## 2026-05-06 - Phase 2 Build — Firebase Auth + Free Plan + Upgrade Walls

**Classification:** LARGE (auth HIGH-RISK; 14 files changed/created)
**PBRD followed:** YES — plan reviewed and approved before build.

**Task:**
Wire Firebase Auth, add 'free' plan tier (checklist-only), enforce upgrade walls on paid features, establish Firestore security rules, surface Stripe Payment Link upgrade CTAs.

**Summary:**
- `src/types/index.ts`: Added 'free' to Plan type
- `src/lib/access.ts`: getEffectivePlan now returns 'free' (not 'none') for authenticated unsubscribed users; added canAddCar() helper; updated canAccessApp() to allow 'free'
- `src/pages/auth/LoginPage.tsx`: Full Firebase Auth wiring — email/password sign-in + register (with displayName), Google OAuth (signInWithPopup), forgot-password flow (sendPasswordResetEmail), user doc bootstrap (setDoc with safe initial values), error code → friendly message mapping
- `src/routes/ProtectedRoute.tsx`: Fixed broken mock-mode bypass (was `isMockMode && userDoc` — userDoc is always null in mock mode; changed to `isMockMode`); removed unused userDoc import
- `src/components/ui/UpgradeWall.tsx`: NEW — reusable locked-feature component with Stripe Payment Link buttons; disabled state for unconfigured env
- `src/pages/InventoryPage.tsx`: Upgrade wall for free/none plan users
- `src/pages/ShowcasePage.tsx`: Upgrade wall for free/none plan users (before existing numeric limit logic)
- `src/pages/WantedListPage.tsx`: Upgrade wall for free/none plan users
- `src/pages/ForSaleTradePage.tsx`: Upgrade wall for free/none plan users
- `src/pages/SettingsPage.tsx`: Live upgrade CTA buttons linking to Stripe Payment Links; conditional display by plan; 'free' planLabel added
- `src/pages/DashboardPage.tsx`: 'free' planLabel added
- `firestore.rules`: NEW — user doc rules (read own, create with restricted fields, update blocking billing/role fields); usr/{uid} subcollection rules; checklist public-read/admin-write; adminLogs admin-only
- `firebase.json`: NEW — Firestore rules pointer + Firebase Hosting config
- `.env.example`: Added VITE_STRIPE_BASIC_LINK and VITE_STRIPE_PREMIUM_LINK with comments
- `CLAUDE.md`: Updated plan table to include free tier; updated plans description

**Files Changed:**
- src/types/index.ts
- src/lib/access.ts
- src/pages/auth/LoginPage.tsx
- src/routes/ProtectedRoute.tsx
- src/pages/DashboardPage.tsx
- src/pages/SettingsPage.tsx
- src/pages/InventoryPage.tsx
- src/pages/ShowcasePage.tsx
- src/pages/WantedListPage.tsx
- src/pages/ForSaleTradePage.tsx
- src/components/ui/UpgradeWall.tsx (created)
- firestore.rules (created)
- firebase.json (created)
- .env.example
- CLAUDE.md

**Validation:**
- `npm run build` passed, zero TypeScript errors

**Review Verdict:**
not reviewed yet

**Risks / Blockers:**
- Stripe Payment Links not yet created in Stripe dashboard — upgrade buttons are disabled until VITE_STRIPE_BASIC_LINK / VITE_STRIPE_PREMIUM_LINK env vars are set
- Subscription activation is manual in Phase 2 — admin must update Firestore user doc after payment; Phase 3 automates via Cloud Functions + webhooks
- Firestore rules not yet deployed — requires `firebase deploy --only firestore:rules` with Firebase CLI configured
- Mock mode now passes through without auth (ProtectedRoute fix) — all pages render with null userDoc showing 'free' plan and empty data

**Next Recommended Action:**
1. Create Firebase project + configure .env with VITE_FIREBASE_* vars
2. Create Stripe Payment Links for Basic ($5/mo) and Premium ($20/mo); add to .env
3. Deploy Firestore rules: `firebase deploy --only firestore:rules`
4. Phase 3: Cloud Functions for Stripe webhook automation + subscription sync

**Handoff Notes:**
Phase 2 complete. App now has real Firebase Auth. Free users get checklist access; inventory/showcase/wanted/for-sale-trade show upgrade walls. SettingsPage has live Stripe upgrade buttons. Firestore rules written but need deployment. Next phase is Cloud Functions for automated billing.

---

## 2026-05-07 - Checklist-First Navigation + Year Browser

**Classification:** MEDIUM (6 files, major UX change to primary feature)
**PBRD followed:** YES — plan reviewed inline before build.

**Task:**
Make checklists the homepage/primary feature. Add year-based set browser. Add 2024 HW Mainline (24 items) + stub checklists for 2023 and 2022. All with +/- quantity per car.

**Summary:**
- ChecklistsPage fully redesigned: year selector (horizontal scroll), grouped cards by year, search. Replaced "Browse/My Lists" tab pattern.
- mockData.ts: Added hw-2024-main (24 items, 4 series: HW Dream Garage/Factory Fresh/Nightspeed/HW Race Day), hw-2024-cc (Car Culture stub), hw-2023-main (stub), hw-2022-main (stub). Updated existing checklist descriptions.
- App.tsx: /dashboard now redirects to /checklists. DashboardPage import removed.
- BottomNav: Home tab → Lists (/checklists). Showcase replaces old Checklists slot.
- Sidebar: Checklists moved to first position. Logo link → /checklists.

**Files Changed:**
- src/data/mockData.ts
- src/pages/ChecklistsPage.tsx (rewritten)
- src/App.tsx
- src/components/layout/BottomNav.tsx
- src/components/layout/Sidebar.tsx

**Validation:**
- `npm run build` passed, zero TypeScript errors

**Review Verdict:**
ACCEPTED

**Risks / Blockers:**
- 2023/2022/2024-CC/2025-STH checklists are stubs with no items — admin CSV import needed to populate
- Quantity state still in React local state — will need Firestore persistence in Phase 3
- DashboardPage.tsx still exists as a file but is no longer routed (safe to delete later)

**Next Recommended Action:**
Phase 3: Firestore persistence for checklist progress (quantity tracking persisted per user).
