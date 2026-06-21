# CR-005 Implementation Task List

## Overview

Add a Previous Period Summary panel to the Dashboard below the existing Current Period panel, showing total due, purchase count, closing date, and due date for the most recently closed billing period. See [ChangeRequestAnalysis-005.md](ChangeRequestAnalysis-005.md) for full analysis.

---

## Task 1: Rename `installmentCount` to `purchaseCount`

| Field | Value |
|---|---|
| **Status** | Pending |
| **Priority** | High |
| **Files** | `src/application/services/DashboardService.ts`, `src/presentation/components/Dashboard.tsx`, `src/presentation/components/__tests__/Dashboard.test.tsx`, `src/application/services/__tests__/DashboardService.test.ts` |
| **Description** | Rename the `installmentCount` field to `purchaseCount` across the interface, component, and all test references. The field already stores purchase count — the name is misleading. No logic change. |
| **Acceptance** | All files use `purchaseCount`; `npm test` and `npm run build` pass. |

---

## Task 2: Add `BillingPeriod.previous()` + unit tests

| Field | Value |
|---|---|
| **Status** | Pending |
| **Priority** | High |
| **Files** | `src/domain/valueObjects/BillingPeriod.ts`, `src/domain/valueObjects/__tests__/BillingPeriod.test.ts` |
| **Description** | Add `previous(): BillingPeriod` method that returns the preceding billing period (month - 1, year rollover for January). Add unit tests covering: normal month decrement, January → December of prior year, and chained calls. |
| **Acceptance** | `previous()` returns correct prior period in all edge cases. |

---

## Task 3: Add `PreviousPeriodSummary` + `getPreviousPeriodSummary()` + unit tests

| Field | Value |
|---|---|
| **Status** | Pending |
| **Priority** | High |
| **Files** | `src/application/services/DashboardService.ts`, `src/application/services/__tests__/DashboardService.test.ts` |
| **Description** | Add `PreviousPeriodSummary` interface with `period`, `totalDue`, `purchaseCount`, `closingDate`, `dueDate`. Add `getPreviousPeriodSummary()` method that computes the previous period from current period, filters purchases, sums first-installment amounts, counts purchases, and computes actual closing/due dates. Unit tests: period identification, aggregation, dates, empty state. |
| **Acceptance** | `npm test` passes with new tests; previous period data correct for all scenarios. |

---

## Task 4: Add previous period panel to Dashboard + UI tests

| Field | Value |
|---|---|
| **Status** | Pending |
| **Priority** | High |
| **Files** | `src/presentation/components/Dashboard.tsx`, `src/presentation/components/__tests__/Dashboard.test.tsx` |
| **Description** | Add `previousSummary` state to Dashboard. Fetch both summaries concurrently via `Promise.all`. Render a new `Paper` below Current Period with rows: Period, Closing Date, Due Date, Amount Due, Purchases. Use `formatDate` helper (reuse from ActivePurchases or inline). UI tests: dual-panel rendering (AC-001), amount due (AC-002), purchase count, closing date, due date, current period unchanged (AC-003), mobile layout (AC-004), empty state. |
| **Acceptance** | Both panels render; previous period data displayed correctly; all acceptance criteria met. |

---

## Task 5: Update ProductSpecification.md

| Field | Value |
|---|---|
| **Status** | Pending |
| **Priority** | Medium |
| **File** | `ProductSpecification.md` |
| **Description** | Update MVP scope line from `"Dashboard with current period summary"` to `"Dashboard with current and previous period summary"`. |
| **Acceptance** | ProductSpecification.md reflects the new scope. |

---

## Task 6: Update UserGuide.md

| Field | Value |
|---|---|
| **Status** | Pending |
| **Priority** | Medium |
| **File** | `UserGuide.md` |
| **Description** | Add **Previous Period Summary** section describing the new panel, its fields, and the relationship between Current Period and Previous Period. |
| **Acceptance** | UserGuide.md documents the Previous Period Summary feature. |

---

## Task 7: Add ADR-015 to ArchitectureDecisionRecords.md

| Field | Value |
|---|---|
| **Status** | Pending |
| **Priority** | Medium |
| **File** | `ArchitectureDecisionRecords.md` |
| **Description** | Append new ADR-015 entry documenting the recompute approach, `purchaseCount` rename, and `BillingPeriod.previous()` addition (use text from ChangeRequestAnalysis-005.md). |
| **Acceptance** | ArchitectureDecisionRecords.md includes ADR-015. |

---

## Task 8: Verify build and test suite

| Field | Value |
|---|---|
| **Status** | Pending |
| **Priority** | High |
| **Description** | Run `npm run build` and `npm test` to confirm TypeScript compiles cleanly, all existing tests pass, and new tests pass. |
| **Acceptance** | Build succeeds; all tests pass. |

---

## Dependencies

- **Task 1** is independent and should be done first (rename cascades to all other tasks).
- **Task 2** is independent of Task 1.
- **Task 3** depends on **Task 2** (uses `previous()`).
- **Task 4** depends on **Task 3** (uses `getPreviousPeriodSummary()`) and **Task 1** (uses `purchaseCount`).
- **Tasks 5, 6, 7** are independent of each other and of code changes.
- **Task 8** depends on all preceding tasks.

## Verification

1. `npm test` — all existing and new tests pass.
2. `npm run build` — no TypeScript or build errors.
3. Manual check: Dashboard shows both Current Period and Previous Period panels with correct data on mobile viewport.
