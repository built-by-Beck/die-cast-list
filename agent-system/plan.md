# Active PBRD Plan — Collectors Garage

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

- Formatter: not configured
- Linter: not configured
- Typecheck: tsc (npm run build)
- Tests: not configured
- Manual checks: [checks]

## Review Focus

- Plan compliance
- Plan-gating correctness (src/lib/access.ts)
- Public visibility safety (publicVisible + publicProfileEnabled)
- Auth and user data access
- Regression risk

## Document Pass

[Required, not needed, or deferred with reason]

## Handoff to build-agent

[Short note — what to start first, any warnings, key context]
```
