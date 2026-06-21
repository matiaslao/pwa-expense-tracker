# CR-005 — Previous Period Summary on Dashboard

## Impacted Business Rules

| Rule | Source | Impact |
|------|--------|--------|
| BR-001 (existing) | Dashboard current period logic | No change — existing current period display must remain unchanged |
| BR-002 (CR-005) | Previous Period Summary | **New rule** — display data for the most recently closed billing period |
| BR-003 (CR-005) | Previous Period persistence | **New rule** — previous period data remains visible even after due date passes |
| BR-004 (CR-005) | Dual display | **New rule** — both sections rendered simultaneously |
| Purchase allocation rules | `BillingPeriodCalculator` | No change — existing allocation logic reused |
| Installment generation | `Purchase.generateInstallments()` | No change — dynamic generation reused |

---

## Implementation Strategy: Snapshot vs Recompute

### Snapshot approach

Take a copy of `CurrentPeriodSummary` on the closing date and persist it (e.g., in IndexedDB). Display the last stored snapshot as `PreviousPeriodSummary`.

**Costs:**
- New IndexedDB table (`PeriodSnapshot`), new repository, new entity type
- A mechanism to detect when the closing date has passed and trigger snapshot creation (polling on app load / on visibility change)
- Edge cases: app not opened on closing date, first run with no snapshots, what if user changes closingDay — invalidate all snapshots?
- Snapshot is stale by definition: if a purchase is edited/deleted after closing, the snapshot still shows old data (good or bad depending on perspective)

**Verdict: does NOT simplify.** Introduces persistence, detection logic, and edge cases that don't exist with the recompute approach.

### Recompute approach — recommended

Compute `PreviousPeriodSummary` at display time by filtering all purchases by the most recently closed period, just like current period does.

**Costs:**
- One new method on `DashboardService`
- One new method on `BillingPeriod` (`previous()`)

**Verdict: simpler.** No new storage, no cron-like detection, no new repositories. All data is already in memory from `repository.findAll()`. The only caveat is that editing/deleting a past purchase would retroactively change the previous period summary — acceptable for MVP.

---

## Impacted Data Model

### Changes to existing interface — `CurrentPeriodSummary`

Rename `installmentCount` to `purchaseCount` (the field already stores purchase count — it was misnamed):

```typescript
export interface CurrentPeriodSummary {
  period: BillingPeriod
  totalDue: number
  purchaseCount: number   // was installmentCount
  closingDay: number
  dueDay: number
}
```

### New interface — `PreviousPeriodSummary`

```typescript
export interface PreviousPeriodSummary {
  period: BillingPeriod
  totalDue: number
  purchaseCount: number
  closingDate: Date
  dueDate: Date
}
```

Both summaries expose `purchaseCount`. Previous period replaces ordinal `closingDay`/`dueDay` with actual `closingDate`/`dueDate`.

### New method on `DashboardService`

```
async getPreviousPeriodSummary(): Promise<PreviousPeriodSummary>
```

Implementation:
1. `calculateBillingPeriod(closingDay, new Date())` → current period
2. `currentPeriod.previous()` → previous period
3. Filter all purchases by that period
4. Sum first-installment amounts → `totalDue`
5. Count purchases → `purchaseCount`
6. `closingDate = new Date(year, month - 1, closingDay)` — closing day of the period's own month
7. `dueDate = new Date(year, month, dueDay)` — due day falls in the next month

### New method on `BillingPeriod`

```
previous(): BillingPeriod
```

Handles month-1 with year rollover (month 1 → month 12, year-1). Reusable and independently testable.

---

## Impacted UI Screens

### `Dashboard.tsx` (primary)

| Change | Detail |
|--------|--------|
| Current Panel | Rename `installmentCount` references → `purchaseCount` |
| New state | `previousSummary: PreviousPeriodSummary \| null` |
| New data fetch | `dashboardService.getPreviousPeriodSummary()` alongside existing `getCurrentPeriodSummary()` |
| New panel | Rendered below the existing Current Period Paper |
| Loading state | Both summaries fetched concurrently via `Promise.all` — no waterfall |
| Previous Period content | Paper with rows: Period, Closing Date, Due Date, Amount Due, Purchases |
| Mobile layout | Same responsive pattern as Current Period — flex column with `justifyContent: 'space-between'` rows |

### `DashboardService.ts`

- Rename `installmentCount` → `purchaseCount` in `CurrentPeriodSummary`
- Add `PreviousPeriodSummary` interface
- Add `getPreviousPeriodSummary()` method

### `BillingPeriod.ts`

- Add `previous(): BillingPeriod` method

---

## Impacted Tests

### Unit tests

| File | Test | Details |
|------|------|---------|
| `BillingPeriod.test.ts` | `previous()` returns correct prior period | Month=1 → month=12, year-1. Month 3-12 → month-1, same year. |
| `DashboardService.test.ts` | Previous period identification | Verify correct period is selected. |
| `DashboardService.test.ts` | Previous period aggregation | Verify `totalDue` = sum of first installments for purchases in previous period. |
| `DashboardService.test.ts` | Previous period purchase count | Verify count of purchases in previous period. |
| `DashboardService.test.ts` | Previous period closing/due dates | Verify `closingDate` and `dueDate` computed correctly. |
| `DashboardService.test.ts` | Empty previous period | No purchases in previous period → `totalDue=0, purchaseCount=0`. |
| `DashboardService.test.ts` | `installmentCount` renamed to `purchaseCount` | Update all existing tests to use new name. No logic change. |
| `DashboardService.test.ts` | No change to current period logic | Verify totals remain correct after rename. |

### UI tests

| File | Test | Details |
|------|------|---------|
| `Dashboard.test.tsx` | Renders both Current Period and Previous Period panels | AC-001 |
| `Dashboard.test.tsx` | Previous Period shows amount due | AC-002 |
| `Dashboard.test.tsx` | Previous Period shows purchase count | Per spec |
| `Dashboard.test.tsx` | Previous Period shows closing date | Per spec |
| `Dashboard.test.tsx` | Previous Period shows due date | Per spec |
| `Dashboard.test.tsx` | Current Period unchanged | AC-003 |
| `Dashboard.test.tsx` | Mobile layout renders both panels | AC-004 |
| `Dashboard.test.tsx` | Empty previous period state | Graceful display of zero values |

---

## Required Specification Updates

### `ProductSpecification.md`

**MVP Scope — Dashboard** section:

- Change line: `"Dashboard with current period summary"` → `"Dashboard with current and previous period summary"`
- Add a non-MVP note or remove "Future: Previous period summary on dashboard" if such a line exists

### `UserGuide.md`

- Add section "Previous Period Summary" describing the new panel and its fields
- Update any screenshots if applicable

---

## Required ADR Updates

### New ADR-015: Previous Period Summary on Dashboard

```
## ADR-015
Previous Period Summary on Dashboard

*Context: Between closing date and due date, users lacked visibility of the amount 
due for the previously closed billing period. The Dashboard only showed current 
period data.*

*Decision: Add a `getPreviousPeriodSummary()` method to DashboardService that 
computes the previous billing period, aggregates purchases assigned to it, and 
returns totalDue (first-installment sum), purchaseCount, closingDate, 
and dueDate. The existing `CurrentPeriodSummary` renames `installmentCount` 
to `purchaseCount` (the field always stored purchase count — the name was 
misleading). The BillingPeriod domain object gains a `previous()` method for 
reusable period arithmetic. The Dashboard component displays both panels 
concurrently using Promise.all.*

*Rationale: All required data already exists in the Purchase entity and 
BillingPeriod value object. Changes are additive and require no schema 
migrations or entity changes. Existing current period logic and tests 
require only a rename from `installmentCount` to `purchaseCount`.*
```

---

## Proposed Implementation Tasks

### Task 1 — Add `previous()` to `BillingPeriod`
- **File:** `src/domain/valueObjects/BillingPeriod.ts`
- **Work:** Add `previous(): BillingPeriod` method

### Task 2 — Rename `installmentCount` to `purchaseCount` in `CurrentPeriodSummary`
- **Files:** `src/application/services/DashboardService.ts`, `src/presentation/components/Dashboard.tsx`, `src/presentation/components/Dashboard.test.tsx`, `src/application/services/__tests__/DashboardService.test.ts`
- **Work:** Rename field across interface, component, and all test references. No logic change.

### Task 3 — Add `previous()` to `BillingPeriod`
- **File:** `src/domain/valueObjects/BillingPeriod.ts`
- **Work:** Add `previous(): BillingPeriod` method
- **Tests:** `src/domain/valueObjects/__tests__/BillingPeriod.test.ts`

### Task 4 — Add `PreviousPeriodSummary` interface and method
- **File:** `src/application/services/DashboardService.ts`
- **Work:** Add `PreviousPeriodSummary` interface and `getPreviousPeriodSummary()` method
- **Tests:** `src/application/services/__tests__/DashboardService.test.ts`

### Task 5 — Add previous period fetch to `Dashboard`
- **File:** `src/presentation/components/Dashboard.tsx`
- **Work:** Add `previousSummary` state, fetch via `Promise.all`, render new panel

### Task 6 — UI tests for `Dashboard`
- **File:** `src/presentation/components/__tests__/Dashboard.test.tsx`
- **Work:** Test dual-panel rendering, fields, empty state, mobile layout

### Task 7 — Update `ProductSpecification.md`
- **Work:** Update MVP scope line

### Task 8 — Update `UserGuide.md`
- **Work:** Add Previous Period Summary section

### Task 9 — Add ADR-015
- **File:** `ArchitectureDecisionRecords.md`
- **Work:** Append new ADR entry

### Task 10 — Verify build and test suite
- **Work:** `npm run build && npm test`
