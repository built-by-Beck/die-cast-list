# Agent Memory — Die Cast Vault

Shared running notebook and handoff channel for all PBRD agents.

## Project Snapshot

**Project:** Die Cast Vault
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
Install PBRD system into Die Cast Vault project.

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

---

## 2026-05-07 - Rebrand to Die Cast Vault

**Classification:** MEDIUM (docs + UI + package metadata, no auth/data model changes)
**PBRD followed:** YES — explicit user request; scope defined before edits.

**Task:**
Rename the product from Collectors Garage / Collector's Garage to Die Cast Vault everywhere it appeared in-repo.

**Summary:**
- Updated `index.html` document title, landing/login/sidebar copy, inventory/loading strings, add-car success and CTA labels, protected-route loading text.
- Replaced product-scoped "garage" phrasing with vault/collection wording where it referred to the app metaphor (not Hot Wheels series names like HW Dream Garage).
- `package.json` / `package-lock.json` `name` → `die-cast-vault`; support mailto → `support@diecastvault.app`.
- `CLAUDE.md`, `AGENTS.md`, and agent-system headers/project snapshot aligned to Die Cast Vault.

**Files Changed:**
- index.html, package.json, package-lock.json, CLAUDE.md, AGENTS.md
- agent-system/agent-info.md, agent-system/plan.md, agent-system/lessons_learned.md
- src/pages/LandingPage.tsx, src/pages/auth/LoginPage.tsx, src/components/layout/Sidebar.tsx
- src/components/ui/UpgradeWall.tsx, src/routes/ProtectedRoute.tsx, src/pages/InventoryPage.tsx, src/pages/AddEditCarPage.tsx

**Validation:**
- `npm run build` (tsc && vite build) — passed

**Review Verdict:**
ACCEPTED

**Risks / Blockers:**
- Workspace folder path remains `Collectors_Garage` (OneDrive/git rename is manual if desired).
- `support@diecastvault.app` must match real DNS/mailbox when you go live.

**Next Recommended Action:**
Rename local repo folder / Firebase display name if desired; wire real support inbox and legal footer domain.

**Handoff Notes:**
Brand string grep clean for old product names; HW series data unchanged.

---

## 2026-05-07 - Remove mock data; Firestore-backed app

**Classification:** LARGE
**Task:** Remove fake/mock data; use real Firebase or empty states.

**Summary:** Deleted `src/data/mockData.ts` and unrouted `DashboardPage.tsx`. Wired checklists, checklist progress (`usr/.../checklistProgress` + `progressItems`), wanted (`usr/.../wanted`), duplicates (`collectionGroup`), admin CSV → `checklists/.../items`. Removed mock mode / guest login. Added `firestore.indexes.json` and expanded `firestore.rules`.

**Files:** New hooks/helpers `useChecklistsFirestore`, `useWantedList`, `checklistProgressFirestore`, `firestoreConverters`; many page updates.

**Validation:** `npm run build` passed

**Review Verdict:** ACCEPTED WITH MINOR CONCERNS — deploy Firestore rules + indexes before production.

**Next:** `firebase deploy --only firestore` and smoke-test signed-in flows.

---

## 2026-05-07 - Phase 1 membership/list-tracking implementation

**Classification:** LARGE
**Task:** Execute approved Phase 1 PBRD plan for pricing, tracked lists, checklist status model separation, Pro-only series filtering, routing/nav updates, and validation.

**Summary:** Updated plan limits (`Basic` now 10 cars, 1 photo, 1 tracked list; `Pro` now 5000 cars, 1 photo, 25 tracked lists) and pricing copy (`$7/$22`). Added `Choose Lists`, `My Tracked Lists`, `My Vault Dashboard`, and `Marketplace Search` shell page with Pro gate messaging. Extended checklist progress writes to persist separate `privateOwnershipStatus` and `publicIntentStatus`; Basic writes are forced to `publicIntentStatus: 'none'`. Added Pro-only series filtering lock message and Pro intent selectors in checklist detail plus Basic “I own this / I do not own this” controls. Added `usr/{uid}/trackedLists` Firestore rules and Pro-only guard for non-`none` public intent writes.

**Files:** `src/lib/access.ts`, `src/types/index.ts`, `src/hooks/useChecklistsFirestore.ts`, `src/lib/checklistProgressFirestore.ts`, `src/pages/ChecklistDetailPage.tsx`, `src/pages/ChecklistsPage.tsx`, `src/pages/LandingPage.tsx`, `src/pages/SettingsPage.tsx`, `src/components/ui/UpgradeWall.tsx`, `src/components/layout/Sidebar.tsx`, `src/components/layout/BottomNav.tsx`, `src/App.tsx`, `src/pages/ChooseListsPage.tsx`, `src/pages/TrackedListsPage.tsx`, `src/pages/DashboardPage.tsx`, `src/pages/MarketplaceSearchPage.tsx`, `src/pages/ShowcasePage.tsx`, `firestore.rules`.

**Validation:** `npm run build` passed. `ReadLints` reports only existing-style warnings about inline style usage.

**Review Verdict:** ACCEPTED WITH MINOR CONCERNS

**Risks / Blockers:**
- Existing repo has many unrelated in-flight changes, so this pass was scoped to additive-safe edits only.
- Firestore intent write guard currently keys off `users/{uid}.plan == 'premium' || lifetimeAccess`; if subscription-status nuances are needed at rules level, add Cloud Functions-backed claims/rule predicates.

**Next:** Implement Phase 2 inventory/photo-limit integration and replace marketplace shell with full query/filter/result flows.

---

## 2026-05-07 - Remaining 5-phase rollout execution

**Classification:** LARGE
**Task:** Implement the approved remaining 5-phase Die Cast Vault rollout continuously with per-phase validation gates.

**Summary:**
- Added centralized `PLAN_LIMITS` config in `src/lib/access.ts` and aligned limit lookups to that source.
- Expanded dashboard delivery with tracked-list progress cards, recently-updated inventory, and quick actions (`Choose Lists`, `Open My Vault`, `Marketplace Search`, `Upgrade to Pro`).
- Hardened inventory/privacy defaults by setting new-car `publicVisible` to `false` and updated photo-limit copy to current 1-photo policy.
- Implemented marketplace intent data layer by syncing Pro intent statuses into top-level `marketplaceIntents` docs from checklist progress writes; Basic users remain forced to `publicIntentStatus: 'none'`.
- Built functional Pro marketplace search UI with filters/results over active `marketplaceIntents`; Basic still sees upgrade wall.
- Added/extended Firestore policies for `usr/{uid}/photos` and `marketplaceIntents`, plus index entries for marketplace queries.
- Upgraded admin importer with MediaWiki source parsing support, deterministic item IDs for safer re-import upserts, and brand-ready checklist/item metadata (`brandId`, `brandName`, year tagging).
- Added `storage.rules` and wired `firebase.json` storage rules config.

**Validation:**
- `npm run build` passed after changes.
- `ReadLints` cleaned introduced accessibility errors; remaining diagnostics are non-blocking inline-style warnings in existing UI patterns.

**Review Verdict:**
ACCEPTED WITH MINOR CONCERNS

**Risks / Blockers:**
- No dedicated `format`, `lint`, or standalone `typecheck` npm scripts currently exist; validation used `npm run build` and IDE lint diagnostics.
- Marketplace search currently filters in client after loading active intents; may need query-scope optimization/index tuning as data grows.
- MediaWiki parser is intentionally pragmatic/minimal and should be expanded with richer table/section edge-case coverage in a follow-up hardening pass.

**Next:**
- Add explicit npm scripts for `format`, `lint`, and `typecheck` to match PBRD gate commands.
- Add targeted automated tests for parser and marketplace intent mapping.

---

## 2026-05-07 - Follow-up fixes: package scripts, marketplace search, parser

**Classification:** MEDIUM
**Task:** Apply requested follow-up fixes for package scripts, marketplace search depth, and parser robustness.

**Summary:**
- Added package scripts in `package.json`: `typecheck`, `lint`, `format`, `format:check`, and installed `prettier`.
- Expanded `MarketplaceSearchPage` with richer filters (brand/year/list/series/intent/search) and list/year context in results while keeping public-safe fields only.
- Extended marketplace intent payload fields (`year`, `listTitle`) for stronger filtering from `checklistProgressFirestore`.
- Improved MediaWiki parsing in `parseChecklist.ts` by accumulating multi-line table rows and flushing on row boundaries (`|-` / `|}`), which better supports common wiki table layouts.
- Ran Prettier checks on newly touched files, plus `npm run typecheck` and `npm run build`.

**Validation:**
- `npm run typecheck` passed
- `npm run build` passed
- `npx prettier --check` passed for touched files
- `ReadLints` shows one non-blocking existing inline-style warning in `DashboardPage.tsx`

**Review Verdict:**
ACCEPTED WITH MINOR CONCERNS

**Risks / Blockers:**
- Repo-wide `npm run format:check` still flags many pre-existing files outside this targeted fix scope.

---

## 2026-05-07 - Stripe plan images integrated in app UI

**Classification:** SMALL
**Task:** Integrate newly added Basic/Pro Stripe product images from `media/` into pricing and upgrade surfaces.

**Summary:**
- Wired `media/die-cast-vault-basic.png` and `media/die-cast-vault-pro.png` into `LandingPage` pricing cards.
- Added plan image previews to `UpgradeWall` so gated feature prompts visually match Stripe product assets.
- Added plan image previews in `SettingsPage` under plan limits and upgrade actions.

**Validation:**
- `npm run typecheck` passed
- `npm run lint` passed
- `ReadLints` for touched files returned no diagnostics

**Review Verdict:**
ACCEPTED

---

## 2026-05-08 - Stripe Cloud Functions: Checkout + webhook billing sync

**Classification:** LARGE  
**Task:** Implement minimal Stripe billing via Firebase Cloud Functions (callable checkout session + HTTP webhook) per approved plan; frontend uses callable instead of payment links.

**Summary:**
- Added `functions/` TypeScript project with `createCheckoutSession` (callable) and `stripeWebhook` (HTTP, raw body signature verification).
- Syncs `users/{uid}` billing fields from subscription events; skips writes when `lifetimeAccess` is true.
- Wired `UpgradeWall` and `SettingsPage` to `startStripeCheckout` via `src/lib/billing.ts`; exported `firebaseApp` from `src/lib/firebase.ts` for `getFunctions`.
- Updated `firebase.json` (functions + predeploy build), added `.firebaserc`, root `.env.example` and `README.md` (billing setup without sample secrets), `functions/.env.example`.

**Validation:**
- `npm run build` (root) passed  
- `npm run build` (`functions/`) passed  
- `ReadLints` on touched frontend files: no issues  

**Review Verdict:**  
ACCEPTED WITH MINOR CONCERNS  

**Risks / Blockers:**
- First deploy requires setting Firebase params (`PUBLIC_APP_URL`, `STRIPE_PRICE_BASIC_ID`, `STRIPE_PRICE_PRO_ID`) and secrets (`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`) before checkout works in production.
- `predeploy` uses bash-style `$RESOURCE_DIR`; if Windows deploy fails, run `npm run build` in `functions/` before `firebase deploy --only functions` or adjust predeploy.

---

## 2026-05-08 - Firebase project pinning + functions deploy attempt

**Classification:** SMALL  
**Task:** Ensure deploys target the correct Firebase project (`collectors-garage-app`, matching `VITE_FIREBASE_PROJECT_ID`).

**Summary:**
- Added `production` alias in `.firebaserc`; pinned `npm run deploy:functions` to `--project collectors-garage-app`.
- Fixed `functions/package.json` Node engine from `>=20` to `20` (Firebase CLI rejected range).
- README: Secret Manager API note before first secret-backed deploy.

**Validation:**
- `firebase use collectors-garage-app` succeeded  
- `npm run deploy:functions` failed: Secret Manager API not enabled on project (403); user must enable in Google Cloud Console then redeploy.  
- `gcloud` not available in PATH on this machine to enable API via CLI.

**Review Verdict:**  
ACCEPTED WITH MINOR CONCERNS  

---

## 2026-05-12 - Lists + AI Chat Assistant (PBRD LARGE)

**Classification:** LARGE
**Task:** Fix empty ChooseListsPage, fix AI collection-name bug, add admin URL-based import, build conversational AI chat assistant (Pro-only).

**Summary:**
- Fixed critical bug: `importChecklistFromWiki` was writing to `masterChecklists` collection; frontend reads from `checklists`. Changed to `checklists` throughout.
- Extracted shared `importFromWikiUrl()` helper in `functions/ai/src/index.ts` to eliminate duplication.
- Added `importChecklistAdmin` Cloud Function (admin role check, no Pro requirement) — admins can now import any wiki list by URL without copy-pasting markup.
- Added `askAI` Cloud Function (Pro-only): classifies user intent, searches Firestore `checklists` for matches, returns matched lists + Gemini-generated reply. Handles find_list / billing_help / collection_advice / general intents.
- Built `AIChatPanel.tsx` — floating ✨ button (bottom-right, above BottomNav on mobile). Opens sliding chat panel. Auto-tracks best matched list for the user when AI finds one. Session-only message history.
- Wired `AIChatPanel` into `AppLayout.tsx` — Pro users get the full chat; Basic/Free users see a locked button that explains the Pro upgrade.
- Added "✨ AI Import from URL" section at top of `AdminChecklistsPage` — calls `importChecklistAdmin` via callable.

**Files Changed:**
- `functions/ai/src/index.ts` — bug fix + shared helper + `importChecklistAdmin` + `askAI`
- `src/components/ui/AIChatPanel.tsx` — NEW
- `src/components/layout/AppLayout.tsx` — wired chat + locked button
- `src/pages/admin/AdminChecklistsPage.tsx` — AI URL import section

**Validation:**
- `npm run typecheck` — passed, zero errors
- `cd functions/ai && npm run build` — passed
- `npm run build` (root) — passed, zero errors

**Review Verdict:**
ACCEPTED WITH MINOR CONCERNS

**Risks / Blockers:**
- `functions/ai` requires `GOOGLE_GENAI_API_KEY` secret set in Firebase before `askAI`, `importChecklistAdmin`, and `importChecklistFromWiki` work in production.
- `importChecklistAdmin` requires the calling user to have `role: 'admin'` in Firestore.
- Auto-track in `AIChatPanel` writes directly to Firestore — stays in sync with `trackChecklist` schema but must be updated if that schema changes.

**Next Recommended Action:**
1. Set `GOOGLE_GENAI_API_KEY` secret: `firebase functions:secrets:set GOOGLE_GENAI_API_KEY`
2. Deploy AI functions: `firebase deploy --only functions:ai`
3. Admin: Use "✨ AI Import from URL" on AdminChecklistsPage to seed initial checklists (2025 HW Mainline, 2024 HW Mainline, etc.), then publish them.
4. Test AI chat as a Pro user.

---

## 2026-05-21 - First production launch / go-live

**Classification:** LARGE
**Task:** Deploy the app live so collectors can use it; set up free lifetime Pro for the founder + one beta tester; everyone else pays.

**Summary:**
- Connected the app to its existing Firebase project `collectors-garage-app` (Die-Cast-Vault): pulled web SDK config and created `.env` (gitignored) + `.firebaserc`.
- Ran `npm install` + `npm run build` (clean) and ran `firebase deploy` — Firestore rules, Firestore indexes, Storage rules, and Hosting all released.
- Verified live site responds HTTP 200 at https://collectors-garage-app.web.app.
- Verified Firebase Auth: Email/Password and Google sign-in are both enabled — sign-up works.
- Decision: free lifetime Pro for founder + Keith is granted via the `lifetimeAccess` flag (purpose-built, permanent, Stripe-independent), NOT via a Stripe coupon. A coupon only zeroes the Stripe charge; with no webhook it cannot activate an in-app account.
- Decision: paying customers use manual activation — Stripe Payment Links + hand-setting `plan` + `subscriptionStatus: 'active'` in Firestore. No automated billing (would need Cloud Functions).
- Added `LAUNCH.md` — operations guide covering lifetime grants, manual paid activation, redeploy.

**Validation:**
- `npm run build` passed.
- `firebase deploy` completed; deploy reported all targets released.
- `curl` of the hosting URL returned 200 with `<title>Die Cast Vault</title>`.
- Auth provider config confirmed via Identity Toolkit admin API (email enabled, google.com IdP enabled).

**Risks / Blockers:**
- No automated billing — every paying customer must be activated by hand in Firestore until Cloud Functions + Stripe webhooks are built.
- Stripe Payment Links not yet created by the founder; `VITE_STRIPE_*` vars are commented out in `.env`, so in-app upgrade buttons show "payments unavailable" until added + redeployed.
- Lifetime Pro for founder + Keith is pending — the two accounts must sign up first, then have `lifetimeAccess` set.
- `UpgradeWall` references `support@diecastvault.app`; confirm that mailbox/domain exists or change it.

**Next:**
- Founder + Keith sign up; then set `lifetimeAccess: true` on both `users/{uid}` docs.
- Create Stripe Payment Links, fill `VITE_STRIPE_*` in `.env`, redeploy.

---

## 2026-06-16 - Full ship-readiness review (PBRD Review)

**Classification:** LARGE (review only, no code changes)
**Task:** "Do a full review and see what else we need to get this ready to ship."

**Validation run:**
- `npm run typecheck` (root) — PASS
- `npm run build` (root, tsc && vite build) — PASS (warns: 829KB JS bundle; plan PNGs ~1.8MB each)
- `functions/` `npm run build` — PASS
- `functions/ai/` `npm run build` — PASS (3.5s) AFTER running `npm install` there. Root cause of earlier "hang": `functions/ai/node_modules` was missing, so `npx tsc` blocked fetching TypeScript. Deps now installed; build is clean.

**Ship blockers found (advertised but not implemented):**
1. PublicShowcasePage + PublicProfilePage are Phase-5 stubs — always show private/not-found. Routes `/showcase/:userId` and `/p/:slug` non-functional; "Public View" button leads to dead stub.
2. Photo upload not implemented (AddEditCarPage + ProfilePage "Phase 4" placeholders). Storage initialized but unused; `primaryPhotoUrl` never populated. Landing advertises photos on paid plans.
3. ProfilePage.handleSubmit only console.logs (no Firestore write) — displayName/bio/publicProfileEnabled never persist.
4. SettingsPage.handleSave is fake (no persistence) — simpleChecklistMode not saved.
5. firestore.rules has NO public-read path for `usr/{uid}/cars` (publicVisible) or `users/{uid}` profile — public showcase will hit permission errors once built. Must scope to publicVisible + publicProfileEnabled.

**Consistency / docs:**
- Plan mismatch: CLAUDE.md/AGENTS.md say Basic=250 cars/$5, Premium=unlimited/$20. Code+landing say Basic=10 cars/$7, Premium=5,000/$22. Docs stale — pick source of truth.
- Account deletion is manual ("contact support"); no self-serve deletion + subcollection cleanup.

**Polish:** large image assets/bundle; AdminDashboard has no user listing; `lint` is just typecheck (no ESLint); no automated tests.

**Review Verdict:** REVISION REQUIRED (not ship-ready — core advertised features are stubs)

**Next Recommended Action:** Decide scope — either build the 5 blockers (showcase/profile public pages, photo upload, profile+settings persistence, public-read rules) or descope/relabel those features before launch.

---

## 2026-06-16 - Beginner-friendly "Import Cars" workflow (PBRD LARGE)

**Classification:** LARGE (new parser, item schema additions, redesigned admin import workflow, new admin cloud function).

**Task:** Replace admin "Import CSV" with a non-technical "Import Cars" flow: Paste-from-Fandom (default), Fandom URL Import, and Advanced (CSV/MediaWiki/HTML), with auto-tagging, preview, inline edit, and duplicate detection.

**Summary:**
- Extended `MasterChecklistItem` + `NormalizedChecklistItem` with OPTIONAL fields: `tags`, `isTreasureHunt`, `isSuperTreasureHunt`, `isExclusive`, `exclusiveStore` (backward-compatible, no migration).
- New `src/lib/parseFandomPaste.ts`: `parseFandomPaste()` (toy-number token `^[A-Z]{2,4}\d{2,4}$` starts each row; tolerant of tabs/newlines/extra label cells), `detectFandomTags()` (TH/STH/New-for-YEAR/store exclusives/Red Edition/Zamac/Ryu's Rides; bare TH/STH matched case-sensitively to avoid "5th"), `enrichWithTags()`/`enrichItemsWithTags()` for the existing parsers, `computeImportStats()`.
- `normalizedToMasterItem()` now persists the 5 new fields with safe defaults (never `undefined`).
- New `src/components/admin/ImportCarsModal.tsx`: 3 method tabs converging on one preview (stat cards, editable row cards, dedupe radios skip/update/import-anyway, plain-language messages only — no raw parser errors). Dedupe compares against existing item IDs via `buildStableItemId`.
- `AdminChecklistsPage`: removed legacy inline CSV modal + its state/handlers; per-checklist button relabeled "⬆️ Import Cars" opens the new modal. Quick Import + AI URL sections left intact.
- New admin-only callable `fetchFandomChecklistHtml` in `functions/ai/src/index.ts`: fetches Fandom `api.php?action=parse&prop=text` server-side (bypasses CORS), returns rendered HTML for client-side parse/preview; no Firestore write.

**Files Changed:**
- `src/types/index.ts`, `src/lib/parseChecklist.ts`, `src/lib/parseFandomPaste.ts` (NEW), `src/lib/firestoreConverters.ts`, `src/components/admin/ImportCarsModal.tsx` (NEW), `src/pages/admin/AdminChecklistsPage.tsx`, `functions/ai/src/index.ts`

**Validation:**
- `npm run typecheck` (root) — PASS
- `npm run build` (root, tsc && vite build) — PASS (pre-existing 838KB bundle + plan PNG warnings only)
- `functions/ai` `npm run build` — PASS

**Review Verdict:** ACCEPTED WITH MINOR CONCERNS

**Risks / Blockers:**
- `fetchFandomChecklistHtml` requires `role: 'admin'` and a redeploy: `firebase deploy --only functions:ai`. URL import tab shows a friendly fallback until deployed.
- Quick Import path still writes items without auto-tags (only the new Import Cars flow enriches tags); acceptable, out of scope.
- Dedupe key uses `buildStableItemId` (brand+year+col+toy+model+variant) scoped to the target checklist's items — satisfies the toyNumber+collectorNumber+modelName+checklistId requirement.

**Next Recommended Action:** Deploy `functions:ai`, then test as an admin: paste a real Fandom table, verify counts/tags/dedupe, and confirm member checklist tracking is unaffected.

---

## 2026-06-16 - Ship: Import Cars workflow (deploy)

**Validation:** typecheck + root build + functions/ai build — PASS before commit.

**Git:** `0a9b8f3` → rebased/pushed to `origin/main` as `9c621ce` — `feat: beginner-friendly Import Cars workflow with Fandom paste, URL fetch, preview built_by_Beck`

**Deploy:** `firebase deploy --only hosting,functions:ai` to `collectors-garage-app` — SUCCESS. Hosting live at https://collectors-garage-app.web.app. New `ai:fetchFandomChecklistHtml` created; other ai functions updated.

**Skipped:** `functions` (default/Stripe codebase) — blocked: `STRIPE_WEBHOOK_SECRET` not set in Secret Manager. Run `firebase functions:secrets:set STRIPE_WEBHOOK_SECRET` then `firebase deploy --only functions:default` when Stripe webhooks are ready.

---

## 2026-06-16 - Stripe signup → checkout → webhook flow wired

**Task:** When a user signs up via Basic/Pro on the landing page, create account then redirect to Stripe Checkout; webhook syncs subscription to Firestore.

**Classification:** LARGE (billing + auth flow). Backend (`createCheckoutSession`, `stripeWebhook`) already existed in `functions/src/index.ts` but was not deployed.

**Build:**
- `LandingPage`: Get Basic/Pro → `/login?mode=register&plan=basic|premium`; Start Free → `?mode=register`.
- `LoginPage`: reads plan from URL; after auth + `bootstrapUserDoc`, calls `startStripeCheckout(plan)`; Google OAuth stashes plan in sessionStorage.
- `billing.ts`: `parseCheckoutPlan`, `stash/takePendingCheckoutPlan`, `checkoutPlanLabel`.
- `DashboardPage`: checkout success/cancel banners from `?checkout=` param.
- `functions/src/index.ts`: success/cancel URLs → `/dashboard?checkout=...`.

**Validation:** `npm run typecheck`, `npm run build`, `functions` tsc — PASS.

**Deploy:** NOT run — requires `STRIPE_WEBHOOK_SECRET` in Secret Manager + Stripe Dashboard webhook endpoint.

**Review Verdict:** ACCEPTED WITH MINOR CONCERNS (deploy + Stripe Dashboard webhook setup still manual).

**Next:** Set secrets, deploy `functions:default`, register webhook URL in Stripe, deploy hosting.

---

## 2026-06-16 - Stripe functions deploy fix + success

**Issue:** Deploy failed — `Secret environment variable overlaps non secret environment variable: STRIPE_SECRET_KEY`. Cause: `STRIPE_SECRET_KEY` was in both `functions/.env` (plain env) and Secret Manager (`defineSecret`).

**Fix:** Removed secrets from `functions/.env`; kept only `defineString` params (`PUBLIC_APP_URL`, price IDs). Clarified `functions/.env.example`.

**Deploy:** `firebase deploy --only functions:default` — SUCCESS.
- `createCheckoutSession` (callable, us-central1)
- `stripeWebhook` URL: `https://us-central1-collectors-garage-app.cloudfunctions.net/stripeWebhook`

**Note:** User also set `PUBLIC_APP_URL` / price IDs as secrets — unnecessary; code uses `defineString` from `.env`. Only `STRIPE_SECRET_KEY` + `STRIPE_WEBHOOK_SECRET` belong in Secret Manager.

**Next:** Create Stripe webhook endpoint with deployed URL → copy real `whsec_` → `firebase functions:secrets:set STRIPE_WEBHOOK_SECRET` → redeploy functions.

