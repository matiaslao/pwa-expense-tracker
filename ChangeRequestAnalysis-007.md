# CR-007 Analysis

## Overview

CR-007 proposes four changes: (1) fix active purchase visibility for single/last-installment purchases, (2) replace dynamic period summaries with immutable snapshots, (3) enforce DD/MM/YYYY date formatting on dashboards, and (4) add safe-area insets for bottom navigation in PWA mode.

---

## Impacted Business Rules

### Rules Modified by CR-007.1 (Active Purchase Visibility)

| Rule | Current | Proposed |
|------|---------|----------|
| ProductSpec.md:52 | `Active purchase = remaining installments > 0 and not archived` | Unchanged in definition, but archiving trigger changes |
| ProductSpec.md:54 | `Completed purchases (remaining installments = 0) are automatically archived` | **Changed** → Completed purchases are **automatically removed** (hard delete), not archived |
| ProductSpec.md:55 | `Archived purchases are excluded from Active Purchases but included in billing period summaries` | **Removed** → Archived/removed purchases are no longer included in period summaries (snapshots replace this) |

The root cause of CR-007.1 is the archiving logic in `getActivePurchases()`: it triggers archiving when `getRemainingInstallments(0)` returns an empty array. But `0` is the **current installment index** (0-based), not "0 remaining installments." This means:
- Single-installment purchases (installments=1, currentInstallmentIndex=0) have 1 remaining → `getRemainingInstallments(0)` returns `[0]` → not archived. **This is correct.**
- But a purchase with 12 installments at index 11 has 1 remaining → `getRemainingInstallments(11)` returns `[11]` → not archived. **Also correct.**

The bug is likely that `getRemainingInstallments` is called with the wrong argument, or the archiving condition incorrectly considers remaining installments relative to a cutoff that doesn't account for the edge case at `currentInstallmentIndex === totalInstallments - 1`.

### Rules Introduced by CR-007.2 (Period Snapshots)

- Period snapshots are **persisted as immutable records** at period close
- **Current Period**: calculated dynamically from active purchases
- **Previous Period**: loaded from the most recent stored snapshot (not recalculated)
- **Changing Closing Date** does not modify stored snapshots
- **Deleting completed purchases** does not affect historical summaries

These supersede ProductSpec.md rules 55 and 62, and ADR-015's recompute approach.

### Rules Modified by CR-007.3 (Date Formatting)

- All dashboard dates (Current Period, Previous Period, Settings, Purchase Views) must use `DD/MM/YYYY`
- No ISO format dates may appear in user-facing dashboard UI
- This codifies what ProductSpec.md:57 already states — the fix is about compliance enforcement

### Rules Modified by CR-007.4 (Safe Area)

- New UI rule: bottom navigation must respect `safe-area-inset-bottom` CSS environment variables
- Navigation controls must not touch screen edge (minimum padding enforced)

---

## Impacted Data Model

### Entity: Purchase

- **CR-007.1**: Archiving changes from soft-delete (`isArchived: boolean` per ADR-016) to **hard delete** (remove from IndexedDB)
  - `isArchived` field is **removed** from the Purchase entity
  - `getActivePurchases()` no longer filters by `isArchived === false`
  - Active purchases are simply "all purchases in the purchases table"

### New Entity: PeriodSnapshot

**CR-007.2** introduces a new IndexedDB table/entity:

```
PeriodSnapshot {
  id: string                    // "2026-07" style period identifier
  periodLabel: string           // "2026-07"
  closingDate: Date
  dueDate: Date
  totalAmount: number           // sum of first-installment values
  purchaseCount: number
  createdAt: Date               // snapshot creation timestamp
}
```

- Stored in a new Dexie table `periodSnapshots`
- Created when a billing period closes
- **Immutable**: never modified after creation

### Repository Impact

- New `PeriodSnapshotRepository` (or methods on existing `ConfigRepository`)
- Purchase archiving logic removed from `purchaseRepository`
- Purchase deletion reverts to hard delete

---

## Impacted UI Screens

### Active Purchases View (CR-007.1)

- Fix display logic to ensure single-installment and one-remaining-installment purchases appear
- No layout changes, purely logic fix

### Dashboard (CR-007.2, CR-007.3)

- **Current Period Summary**: unchanged (still dynamic), but date formatting enforced
- **Previous Period Summary**: switches from `getPreviousPeriodSummary()` dynamic calculation to loading from `PeriodSnapshot`
  - If no snapshot exists, show "No previous period data" instead of calculating
- Date fields now use `formatDate()` with es-AR locale (was likely missing in some spots)

### Settings (CR-007.3)

- Any date displays on Settings screen must use DD/MM/YYYY

### Bottom Navigation (CR-007.4)

- `<BottomNav>` component needs CSS update:
  - `padding-bottom: env(safe-area-inset-bottom, 16px)`
  - `box-sizing: content-box` or appropriate padding strategy
  - Tested in standalone PWA mode on iPhone

---

## Impacted Tests

### Existing Test Files Likely Affected

| Test Area | CR-007 Part | Change Required |
|-----------|-------------|-----------------|
| `purchaseRepository.test.ts` | 007.1 | Remove `isArchived` filter tests; add hard-delete logic tests; update `getActivePurchases` tests |
| `dashboardService.test.ts` | 007.1, 007.2 | Replace `getPreviousPeriodSummary` tests with snapshot-based tests; verify period close creates snapshot |
| `archiving logic / domain tests` | 007.1 | Rewrite: archiving → hard delete; test that completed purchases are removed, not flagged |
| `Dashboard component tests` | 007.2, 007.3 | Mock snapshot repository; verify DD/MM/YYYY format; test no-snapshot fallback state |
| `ActivePurchases component tests` | 007.1 | Add test cases: single-installment (remaining=1), multi-installment last month (remaining=1), completed (remaining=0 → hidden) |
| `BottomNav component tests` | 007.4 | Verify safe-area CSS class is applied; visual regression if applicable |
| `Settings component tests` | 007.3 | Verify date display format |
| `PurchaseForm tests` | 007.3 | Verify date display format |
| `billingPeriod.test.ts` | 007.2 | `previous()` method may still be used for current period; `BillingPeriod` may gain `toSnapshot()` method |
| `dateUtils / formatDate tests` | 007.3 | Add explicit tests for DD/MM/YYYY enforcement if not already covered |

### New Test Coverage Needed

- `periodSnapshotRepository.test.ts` — CRUD (create/read), immutability enforcement, idempotent close
- Snapshot creation trigger on period close (might be in a service or effect)
- Dashboard behavior when snapshot exists vs. does not exist

---

## Required Specification Updates

### ProductSpecification.md

1. **Rule 52**: Update archiving trigger condition
2. **Rule 54**: Change "automatically archived" → "automatically removed"
3. **Rule 55**: **Remove** or rewrite — archived purchases no longer included in billing period summaries
4. **New rules**: PeriodSnapshot definition, current period → dynamic, previous period → snapshot
5. **Rule 62**: Retain but reinforce with snapshot immutability
6. **Rule 66**: Add "DD/MM/YYYY" formatting enforcement for dashboard dates
7. **New rule**: Bottom navigation safe-area requirement
8. **New section or ADR reference**: Period snapshot persistence strategy

### ArchitectureDecisionRecords.md

1. **ADR-003** (Installments generated dynamically): Update reference — ADR-016 is superseded by CR-007's approach
2. **ADR-015** (Previous Period Summary): **Major update** — dynamic recompute is replaced by snapshot lookup; `getPreviousPeriodSummary()` is deprecated; `BillingPeriod.previous()` may still be used for current-period boundary calculation
3. **ADR-016** (Automatic Purchase Archiving): **Superseded** — soft-delete is replaced by hard delete + snapshots; document the reversal and rationale
4. **New ADR**: Period Snapshot Persistence — document the new entity, immutability contract, creation trigger, and rationale for replacing the recompute approach

---

## Required ADR Updates

### ADR-016 (Automatic Purchase Archiving) — Superseded

Add to history:
```
*Superseded 2026-06-21 by CR-007: Soft-delete (isArchived) replaced by hard delete + immutable period snapshots. Soft-delete introduced complexity without sufficient benefit when period summaries are served from snapshots rather than recomputed from purchase data.*
```

### ADR-015 (Previous Period Summary) — Major Update

Update the decision section to reflect:
```
*Updated 2026-06-21 by CR-007: getPreviousPeriodSummary() dynamic recompute is replaced by PeriodSnapshot lookup. The BillingPeriod.previous() method is retained for current-period boundary calculations. DashboardService now depends on PeriodSnapshotRepository for historical data.*
```

### New ADR Entry

**ADR-018: Period Snapshot Persistence**

*Context: Historical billing period summaries dynamically recomputed from active purchase data (ADR-015) are vulnerable to configuration changes and purchase deletions. Closing date changes, purchase edits, and soft-delete archiving (ADR-016) all affect computed historical values.*

*Decision: Persist billing period summaries as immutable snapshots at period close. Snapshots contain period identifier, closing date, due date, total amount, purchase count, and creation timestamp. They are created once and never modified. The current period is still calculated dynamically from active purchases.*

*Rationale: Deterministic historical data, decoupled from purchase lifecycle, simpler queries, protects against closing date changes. Trade-off: snapshot creation must be triggered reliably at period boundaries.*

### ADR-003 — Minor Update

Update the ADR-003 references: remove the reference to ADR-016 for archiving, replace with reference to CR-007's lifecycle.

---

## Proposed Implementation Tasks

### Task 1 — Fix Active Purchase Archiving Logic (CR-007.1)

**Scope**: Domain logic + Repository

- [ ] Identify the bug in archiving trigger (likely `getRemainingInstallments` call in `getActivePurchases` or `archiveCompletedPurchases`)
- [ ] Change archiving from soft-delete (`isArchived = true`) to **hard delete** (`delete()`)
- [ ] Remove `isArchived` field from Purchase entity
- [ ] Update `getActivePurchases()`: remove `isArchived === false` filter; return all purchases from the table
- [ ] Update `getActivePurchases()` to filter: `remainingInstallments > 0` (no longer checks archived flag)
- [ ] Remove `archiveCompletedPurchases()` method or repurpose it as `deleteCompletedPurchases()`
- [ ] Update `createPurchase`, `editPurchase`, `deletePurchase` services if they reference archiving
- [ ] Verify dashboard totals remain correct (they use `computeInstallments` which doesn't filter by archived flag)

**Risk**: Existing period-summary recompute (ADR-015) depends on archived purchases being present in the DB. This must be resolved **after** snapshots are in place (Task 2).

### Task 2 — Implement Period Snapshot Persistence (CR-007.2)

**Scope**: New entity + repository + service + DB migration

- [ ] Define `PeriodSnapshot` type/interface (periodLabel, closingDate, dueDate, totalAmount, purchaseCount, createdAt)
- [ ] Add `periodSnapshots` table to Dexie schema
- [ ] Create `PeriodSnapshotRepository` with: `save(snapshot)`, `getLatest()`, `getByPeriod(periodLabel)`, `getAll()`
- [ ] Create snapshot creation trigger: detect period close when loading dashboard or on app init
  - Option A: On `getActivePurchases()` call, check if any purchase crosses into a new period
  - Option B: On Dashboard mount, compare current period against last snapshot
  - Option C: Cron-like check on app foreground (more complex, likely overkill for MVP)
- [ ] Map snapshot data to the existing `Summary` type expected by Dashboard
- [ ] Update `DashboardService`:
  - `getCurrentPeriodSummary()`: unchanged (still dynamic)
  - `getPreviousPeriodSummary()`: load from `PeriodSnapshotRepository.getLatest()` instead of recomputing
  - Fallback: if no snapshot exists, return `null` or empty state
- [ ] Update Dashboard component to handle null/empty previous period
- [ ] Ensure snapshot is created before deleting completed purchases (Task 1 depends on this order)

**Risk**: Snapshot creation timing — must ensure snapshots are created at the right moment. Period close detection logic must be correct.

### Task 3 — Enforce DD/MM/YYYY Date Formatting (CR-007.3)

**Scope**: Presentation layer (components + formatters)

- [ ] Audit all dashboard components for ISO date usage:
  - CurrentPeriodSummary
  - PreviousPeriodSummary
  - Settings
  - Purchase views
- [ ] Ensure all use `formatDate()` (es-AR locale) or `Intl.DateTimeFormat('es-AR')`
- [ ] Add/update tests to assert DD/MM/YYYY format

### Task 4 — Bottom Navigation Safe Area (CR-007.4)

**Scope**: CSS only (likely one file)

- [ ] Locate `<BottomNav>` component
- [ ] Add CSS:
  ```css
  padding-bottom: calc(16px + env(safe-area-inset-bottom, 0px));
  ```
- [ ] Ensure `env(safe-area-inset-bottom)` is applied — may need `<meta name="viewport" content="viewport-fit=cover">` in `index.html`
- [ ] Test on iPhone PWA standalone mode (simulator or device)

### Task 5 — Update Specifications (Prerequisite/Parallel)

- [ ] Update ProductSpecification.md rules per "Required Specification Updates" above
- [ ] Supersede ADR-016 with note documenting the reversal
- [ ] Update ADR-015 to reflect snapshot-based approach
- [ ] Add ADR-018 for Period Snapshot Persistence
- [ ] Update ADR-003 references

### Task 6 — Update Tests

- [ ] Rewrite archiving tests for hard-delete behavior
- [ ] Add `PeriodSnapshotRepository` unit tests
- [ ] Add dashboard service tests for snapshot-based previous period
- [ ] Add component tests for DD/MM/YYYY formatting
- [ ] Add BottomNav safe-area tests (class presence / computed style)
- [ ] Update existing tests that reference `isArchived` or `getPreviousPeriodSummary` dynamic calculation

### Execution Order

1. **Task 5** (spec updates) — document the decisions first
2. **Task 2** (snapshots) — must exist before hard-delete is safe
3. **Task 1** (fix archiving to hard-delete) — depends on Task 2
4. **Task 3** (date formatting) — independent, can be parallel
5. **Task 4** (safe area) — independent, can be parallel
6. **Task 6** (tests) — after each corresponding task

### Out of Scope for This CR

- Multiple cards, categories, budgets, reports, cloud sync, notifications, foreign currencies — still excluded per MVP scope
- BillingPeriod entity changes (`.previous()` method retained)
- Dashboard layout or component restructuring beyond snapshot integration
