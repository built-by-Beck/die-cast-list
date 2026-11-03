# Die Cast List — Roadmap

Updated 2026-10-31. Owner: David Beck. Core direction approved by Beck: help Keith and other collectors track their own cars, needs and duplicates; cover every Hot Wheels year; finish image workflows before expanding showcases and trading.

## Product model and scope

A shared master catalog describes releases. Each member uses the same lists as their own private checklist: quantity 0 means needed, 1 means owned, and 3 means three owned copies with two duplicates. Quantities already have code support; this roadmap hardens and extends it rather than describing it as entirely unbuilt. Catalog deduplication and member duplicate ownership are different operations.

“Every year” means annual release-list coverage from the earliest source-documented year through the current year, with a repeatable process for future years. Special series, premium lines, recolors and overlapping lists need an explicit coverage taxonomy; not every wiki page is automatically part of annual mainline scope. Source gaps remain visible. Annual catalog coverage still needs to be audited.

Detailed tracking is approved in principle. Condition, packaging, location, notes and optional acquisition details are candidate fields based on existing inventory types. Exact fields, per-copy records versus grouped quantities, and paid-plan access remain design decisions with Beck. Do not silently finalize them. Existing free checklist access and current paid features remain governed by access.ts until separately approved.

## Approved core milestones

Estimates cover remaining hands-on engineering, review and verification, excluding completed work, waiting, external approval and a later production deployment. They are provisional planning ranges. Each item is approved at the stated outcome level; prerequisite design decisions still gate implementation.

### CAT-01 — Audit annual source coverage and reuse requirements

- Type: investigation. Priority: P1. Status: approved, not started; prerequisite decisions pending where listed.
- Evidence/reason: User requested every Hot Wheels year; current imports and source-attribution fields exist.
- Benefit and scope: Give collectors a trustworthy year browser. Inventory source annual lists from the earliest documented release year through the current release year; distinguish mainline lists, variants and separate series.
- Acceptance: A coverage manifest gives every year a source or explicit gap, source/revision metadata, applicable terms, counts and image-rights status; no claim of completeness for unavailable years.
- Dependencies/assumptions: Source access and content reuse review; resolve taxonomy before bulk import.
- Estimate: **6–10 hours**, including item-specific review and verification. Source complexity and existing-code defects may change the range after investigation.
- First useful session: First session: inspect representative early, middle and recent annual lists and draft the coverage manifest.

### CAT-02 — Build repeatable annual checklist imports

- Type: feature. Priority: P1. Status: approved, not started; prerequisite decisions pending where listed.
- Evidence/reason: User requested all years; src/lib/parseChecklist.ts, parseFandomPaste.ts and admin import UI provide a starting point.
- Benefit and scope: Import annual master lists with stable release identities, dry-run previews, validation, attribution and resumable batches; distinguish catalog duplicates from member-owned duplicates.
- Acceptance: Fixtures from different table formats parse correctly; ambiguous variants are flagged; retries create no duplicate releases; updates preserve member links and quantities; preview reports additions/changes/removals before approval.
- Dependencies/assumptions: CAT-01; source access, stable identifier design and isolated Firebase environment.
- Estimate: **12–20 hours**, including item-specific review and verification. Source complexity and existing-code defects may change the range after investigation.
- First useful session: First session: define canonical release identity and validate one annual-list fixture without database writes.

### CAT-03 — Populate and reconcile every annual list in staging

- Type: feature. Priority: P1. Status: approved, not started; prerequisite decisions pending where listed.
- Evidence/reason: User explicitly requested every year on the site; live coverage has not been inspected.
- Benefit and scope: Run the approved importer across the coverage manifest, verify counts and variants, and produce an auditable staging catalog for later publication.
- Acceptance: Every year has a verified imported list or documented source blocker; sample early/middle/recent years reconcile to sources; attribution is retained; rerun changes nothing unexpectedly; publication has a backup and explicit approval.
- Dependencies/assumptions: CAT-02; source availability and rights; production publication is separately authorized. Estimate assumes representative formats and up to roughly 60 annual lists; expand honestly if exceptions require more work.
- Estimate: **10–18 hours**, including item-specific review and verification. Source complexity and existing-code defects may change the range after investigation.
- First useful session: First session: import and reconcile one complete annual list in staging; no production writes.

### TRK-01 — Verify and harden member quantity tracking

- Type: bug. Priority: P1. Status: approved, not started; prerequisite decisions pending where listed.
- Evidence/reason: User requires independent quantities; src/lib/checklistProgressFirestore.ts persists quantities and summary state.
- Benefit and scope: Make quantity entry, needed/owned/duplicate summaries and save feedback dependable on mobile; investigate batch limits, concurrent edits and failed writes.
- Acceptance: Two synthetic members have independent progress; quantities 0, 1 and 3 produce correct states and two duplicates for 3; refresh retains values; failed writes are visible and recoverable; large-list saves respect actual operation limits; repeated saves do not reset unrelated detail.
- Dependencies/assumptions: Isolated Firebase test setup; preserve ownerUid and current namespace conventions. Suspected concurrency/batch issues require reproduction before a fix.
- Estimate: **8–14 hours**, including item-specific review and verification. Source complexity and existing-code defects may change the range after investigation.
- First useful session: First session: reproduce 0/1/3 transitions and a failed save using synthetic accounts.

### TRK-02 — Add detailed member collection records linked to checklists

- Type: feature. Priority: P1. Status: approved, not started; prerequisite decisions pending where listed.
- Evidence/reason: User requested more detail than counts; Car already models condition, packaging, location, notes, purchase price and checklist linkage.
- Benefit and scope: Design and implement an agreed first version of member-only detail linked to stable catalog releases, using existing inventory fields where possible. Per-copy records are a proposed design, not yet an approved requirement.
- Acceptance: An agreed field/model specification precedes implementation; members can save, reload and edit selected details without changing master entries; aggregate quantities reconcile; one member cannot read another member’s private records; existing records remain usable.
- Dependencies/assumptions: TRK-01 and stable catalog IDs; Beck must choose fields, per-copy versus grouped quantities and access policy before implementation. No gating changes assumed.
- Estimate: **8–14 hours**, including item-specific review and verification. Source complexity and existing-code defects may change the range after investigation.
- First useful session: First session: review a three-copy example with Beck, choose fields and produce the model and reconciliation rules.

### IMG-01 — Complete private collection photo workflow

- Type: feature. Priority: P1. Status: approved, not started; prerequisite decisions pending where listed.
- Evidence/reason: Beck reports image features were not built; src/lib/uploads.ts, image fields and UI placeholders exist.
- Benefit and scope: Audit and complete selected-file upload, progress/errors, primary display and replacement/removal using existing Storage paths.
- Acceptance: A supported image survives upload and refresh; invalid files and upload failures get useful feedback; replacing/removing photos follows a documented storage policy; private images remain private; existing plan limits are respected; mobile flow is verified.
- Dependencies/assumptions: TRK-02 linkage decisions, isolated Storage environment and existing plan policy. Any rule change is a separate LARGE implementation review.
- Estimate: **8–14 hours**, including item-specific review and verification. Source complexity and existing-code defects may change the range after investigation.
- First useful session: First session: trace the existing helper-to-screen path and identify the smallest complete private photo flow.

### IMG-02 — Capture and display permitted source images

- Type: feature. Priority: P1. Status: approved, not started; prerequisite decisions pending where listed.
- Evidence/reason: User requested Fandom image capture; importer/image fields exist but successful image ingestion is unverified.
- Benefit and scope: Resolve permitted file sources separately from page parsing, retain provenance and license/credit metadata, and show clear fallbacks where reuse is unavailable.
- Acceptance: Representative imported releases display permitted images or explicit placeholders; unsupported/denied files do not stop list imports; image attribution is visible where required; retries avoid duplicate assets; no assumption that all wiki images share text licensing.
- Dependencies/assumptions: CAT-01/02 and image rights/access review. If rights prevent capture, deliver the documented fallback and report remaining work rather than bypass restrictions.
- Estimate: **6–12 hours**, including item-specific review and verification. Source complexity and existing-code defects may change the range after investigation.
- First useful session: First session: check rights and metadata for a small representative image sample; no bulk copying.

### QA-01 — Add focused tracking and import regression coverage

- Type: tests. Priority: P1. Status: approved, not started; prerequisite decisions pending where listed.
- Evidence/reason: No automated suite or emulator configuration found; critical behavior spans parsers, progress writes and summaries.
- Benefit and scope: Add synthetic parser/progress tests and isolated Firebase verification for the accepted flows, plus repeatable checks in CI.
- Acceptance: A fresh checkout can run documented tests; coverage includes import reruns, variant separation, 0/1/3 quantities, detail preservation and two-member isolation; CI uses no production secrets or data.
- Dependencies/assumptions: Define test harness early with TRK-01/CAT-02; this estimate covers reusable harness, CI and cross-flow regression only. Feature-specific verification is already included in feature estimates.
- Estimate: **6–10 hours**, including item-specific review and verification. Source complexity and existing-code defects may change the range after investigation.
- First useful session: First session: choose the smallest test harness and add a quantity calculation regression with synthetic fixtures.

## Sequence, totals and definition of done

1. Establish the test environment and representative fixtures (QA-01), source coverage (CAT-01), and quantity behavior (TRK-01).
2. Deliver repeatable annual imports (CAT-02), then reconcile all annual lists in staging (CAT-03).
3. Agree the detail model (TRK-02), complete private photos (IMG-01), and handle permitted source images (IMG-02).
4. Complete shared regression coverage (QA-01) and review all milestone evidence.

Approved core estimate: **64–112 hours** (6–10 + 12–20 + 10–18 + 8–14 + 8–14 + 8–14 + 6–12 + 6–10). Re-estimate CAT-03 after the coverage audit. Testing shared across milestones is counted once; source gaps must be documented rather than filled with invented entries.

Recommended first development task: a synthetic 0/1/3 checklist regression and isolated save/reload exercise, alongside a small representative source audit.

Done means accepted criteria are demonstrated in an isolated environment, member progress survives catalog updates, the all-years coverage report is honest, provenance is retained, checks pass, and documentation matches behavior. Publishing the staging catalog requires a separate production change review and authorization.

## Deferred and unestimated

- Public profiles/showcases: routes are stubs; privacy-safe reads and working profile persistence need a separate design and security review.
- Member-to-member messaging, completed trades, sales and payment handling: listing intents are not a finished transaction system.
- Billing lifecycle/runtime review and hosting consolidation: operational work remains, but it is not included in the collector-first core estimate.
- Profile/preferences persistence: verified incomplete save handlers; record for later unless needed by the accepted core flow.
- Backup/export and accessibility improvements beyond the accepted flow verification: discuss a specific user outcome before adding scope.

No ideas were explicitly rejected. Deferred work is excluded from the estimate. Completed documentation work is excluded from remaining engineering hours.
