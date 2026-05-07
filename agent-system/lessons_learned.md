# Lessons Learned — Collectors Garage

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

**Stripe state must never be mutated by the client** — when Stripe is added, `plan`, `stripeCustomerId`, `subscriptionStatus`, and `lifetimeAccess` on `UserDoc` are set only by backend webhooks via Cloud Functions. Client reads these values but never writes them.

**`lifetimeAccess` overrides subscription status** — always call `getEffectivePlan(userDoc)` from `src/lib/access.ts` rather than checking `userDoc.plan` directly. `lifetimeAccess: true` resolves to premium regardless of subscription state.
