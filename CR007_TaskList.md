# CR-007 Implementation Task List

## Overview

Active purchase lifecycle redesign (hard delete + period snapshots), date formatting enforcement, and mobile PWA bottom navigation safe area. See [ChangeRequestAnalysis-007.md](ChangeRequestAnalysis-007.md) for full analysis.

---

## Task 1: Remove `isArchived` from Purchase Entity

| Field | Value |
|---|---|
| **Status** | Pending |
| **Priority** | High |
| **File** | `src/domain/entities/Purchase.ts` |
| **Description** | Remove `isArchived?: boolean` from `PurchaseProps` interface. Remove `isArchived` field from `Purchase` class and constructor. Remove `markArchived()` method. Update `getRemainingInstallments(paidCount)` so it filters installments by due date — only installments where `dueDate >= today` count as remaining. Replace `isComplete()` with a simpler check: a purchase is complete when `getRemainingInstallments(0).length === 0`. |
| **Acceptance** | Purchase entity no longer references archiving; `getRemainingInstallments` returns only future-dated installments; entity tests pass with zero failures. |

---

## Task 2: Remove `isArchived` from DB Schema and Repository

| Field | Value |
|---|---|
| **Status** | Pending |
| **Priority** | High |
| **Files** | `src/infrastructure/database/db.ts`, `src/infrastructure/repositories/PurchaseRepositoryImpl.ts` |
| **Description** | Remove `isArchived?: boolean` from `PurchaseRecord` interface in `db.ts`. Remove `isArchived` from `toRecord()` and `toDomain()` in `PurchaseRepositoryImpl.ts`. DB schema version stays at v2 (removing a field is backward-compatible with Dexie — undefined values are ignored on read). |
| **Acceptance** | No `isArchived` references remain in infrastructure layer; existing data with `isArchived` field is silently ignored (backward-compatible). |

---

## Task 3: Rewrite Active Purchase Logic (Hard Delete)

| Field | Value |
|---|---|
| **Status** | Pending |
| **Priority** | High |
| **File** | `src/application/services/DashboardService.ts` |
| **Description** | Replace `archiveCompletedPurchases()` with `removeCompletedPurchases()` that hard-deletes (calls `repository.deleteById()`) purchases where `getRemainingInstallments(0).length === 0`. Update `getActivePurchases()`: remove `archiveCompletedPurchases()` call, replace with `removeCompletedPurchases()`; remove `!p.isArchived` filter; keep only `remaining.length > 0` filter. The sort (descending by purchaseDate) stays unchanged. |
| **Acceptance** | Single-installment purchases with future due dates appear in Active Purchases. Purchases on their last pending installment appear. Purchases with 0 remaining installments are hard-deleted from the database. Dashboard totals remain correct because they iterate `findAll()` which returns remaining records. |

---

## Task 4: Define PeriodSnapshot Domain Entity and Repository Interface

| Field | Value |
|---|---|
| **Status** | Pending |
| **Priority** | High |
| **Files** | New `src/domain/entities/PeriodSnapshot.ts`, New `src/domain/repositories/PeriodSnapshotRepository.ts` |
| **Description** | Define `PeriodSnapshot` entity with fields: `periodLabel: string` (e.g. `"2026-07"`), `closingDate: Date`, `dueDate: Date`, `totalAmount: number`, `purchaseCount: number`, `createdAt: Date`. Define `PeriodSnapshotRepository` interface: `save(snapshot): Promise<void>`, `getLatest(): Promise<PeriodSnapshot | null>`, `getByPeriod(periodLabel: string): Promise<PeriodSnapshot | null>`. |
| **Acceptance** | Types compile; no implementation yet. |

---

## Task 5: DB Schema v3 — Add `periodSnapshots` Table

| Field | Value |
|---|---|
| **Status** | Pending |
| **Priority** | High |
| **File** | `src/infrastructure/database/db.ts` |
| **Description** | Add `PeriodSnapshotRecord` interface (matches entity fields). Add `periodSnapshots!: Table<PeriodSnapshotRecord, string>` to `AppDatabase`. Bump schema to v3 with stores: `purchases: 'id, purchaseDate'` (unchanged), `settings: 'key'` (unchanged), `periodSnapshots: 'periodLabel'`. Keep v1 and v2 declarations for migration chain. |
| **Acceptance** | `npm run build` succeeds; no data loss for existing purchases and settings. |

---

## Task 6: Implement PeriodSnapshotRepository

| Field | Value |
|---|---|
| **Status** | Pending |
| **Priority** | High |
| **File** | New `src/infrastructure/repositories/PeriodSnapshotRepositoryImpl.ts` |
| **Description** | Implement `PeriodSnapshotRepository` using Dexie. `save(snapshot)` calls `db.periodSnapshots.put(record)`. `getLatest()` fetches all snapshots sorted by `createdAt` descending and returns the first. `getByPeriod(periodLabel)` does `db.periodSnapshots.get(periodLabel)`. Follow same pattern as `ConfigRepositoryImpl`. |
| **Acceptance** | Can save and retrieve snapshots with persistence across page reloads. |

---

## Task 7: Add Period Close Detection and Snapshot Creation

| Field | Value |
|---|---|
| **Status** | Pending |
| **Priority** | High |
| **File** | `src/application/services/DashboardService.ts` |
| **Description** | Add `PeriodSnapshotRepository` as a constructor dependency. Add a `checkPeriodClose()` method (called from `getActivePurchases()` and `getCurrentPeriodSummary()`): compute current billing period from `calculateBillingPeriod(this.closingDay, now)`, load the latest snapshot via `getLatest()`, if the latest snapshot's period differs from the current period AND the current period's closing date has passed, create a new snapshot. The snapshot is computed from purchases in the previous period (the one that just closed): aggregate `firstInstallmentDate` amounts for purchases in that period, count them, record closing/due dates. |
| **Acceptance** | Snapshot is automatically created when a billing period closes. No duplicate snapshots for the same period. |

---

## Task 8: Update Previous Period Summary to Use Snapshots

| Field | Value |
|---|---|
| **Status** | Pending |
| **Priority** | High |
| **File** | `src/application/services/DashboardService.ts` |
| **Description** | Rewrite `getPreviousPeriodSummary()`: load the most recent snapshot from `PeriodSnapshotRepository.getLatest()`. If a snapshot exists, map its fields to the existing `PreviousPeriodSummary` interface (period, totalDue, purchaseCount, closingDate, dueDate). If no snapshot exists, return `null`. Remove the old dynamic recompute logic (iterating purchases, summing first installments). The `PreviousPeriodSummary` return type changes to `Promise<PreviousPeriodSummary | null>`. |
| **Acceptance** | Previous Period Summary data comes from stored snapshots, not recomputed from purchases. Changing closing date does not affect previous period data. Deleting completed purchases does not affect previous period data. Dashboard handles null previous period gracefully. |

---

## Task 9: Update Dashboard Component for Null Previous Period

| Field | Value |
|---|---|
| **Status** | Pending |
| **Priority** | Medium |
| **File** | `src/presentation/components/Dashboard.tsx` |
| **Description** | The `getPreviousPeriodSummary()` now returns `null` when no snapshot exists (first period, no data yet). Update the Dashboard component to handle `previousSummary === null` — either hide the previous period panel entirely or show a "no previous period data" message. The `formatDate` utility is already used for `closingDate` and `dueDate` — verify these render correctly with `null` guard. |
| **Acceptance** | Dashboard does not error when no snapshot exists. Previous period panel is hidden when `null`. |

---

## Task 10: Enforce DD/MM/YYYY Date Formatting on Dashboard Current Period

| Field | Value |
|---|---|
| **Status** | Pending |
| **Priority** | Medium |
| **File** | `src/presentation/components/Dashboard.tsx` |
| **Description** | Current Period Summary currently displays `closingDay` as a bare number (e.g. `15`) and `dueDay` as a bare number (e.g. `29`). Per CR-007.3, these must show full calendar dates in DD/MM/YYYY format. Compute the actual dates: `closingDate = new Date(summary.period.year, summary.period.month - 1, summary.closingDay)` and `dueDate = new Date(summary.period.year, summary.period.month - 1, summary.dueDay)`. Display using `formatDate()`. Update the label from `Strings.CLOSING_DAY` to `Strings.CLOSING_DATE` (or reuse). Also verify that `previousSummary.closingDate` and `previousSummary.dueDate` are already using `formatDate()` — they are, per code review. |
| **Acceptance** | Current period shows "25/07/2026" instead of "25". Previous period already shows DD/MM/YYYY (confirmed). No ISO format dates on dashboard. |

---

## Task 11: Fix Bottom Navigation Safe Area (PWA)

| Field | Value |
|---|---|
| **Status** | Pending |
| **Priority** | High |
| **Files** | `src/presentation/components/AppShell.tsx`, `index.html` |
| **Description** | Two changes: (1) Add `viewport-fit=cover` to the viewport meta tag in `index.html` — current content is `"width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"`, change to `"width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover"`. (2) In `AppShell.tsx`, update the `BottomNavigation` sx: change `pb: 'env(safe-area-inset-bottom, 0px)'` to `pb: 'calc(8px + env(safe-area-inset-bottom, 0px))'` to add extra breathing room. Also add `safe-area-inset-bottom` to the FAB's bottom offset for consistency — change `bottom: 72` to `bottom: 'calc(72px + env(safe-area-inset-bottom, 0px))'`. |
| **Acceptance** | Bottom navigation is fully visible on iPhone PWA; no icon obscured by system gesture area; touch interaction reliable. |

---

## Task 12: Update DashboardService Tests

| Field | Value |
|---|---|
| **Status** | Pending |
| **Priority** | High |
| **File** | `src/application/services/__tests__/DashboardService.test.ts` |
| **Description** | Major test overhaul reflecting CR-007.1 and CR-007.2 changes: (1) Remove all `isArchived` test fixtures and assertions — the `isArchived` field no longer exists. (2) Rewrite `'archives completed purchases automatically'` test: change to `'removes completed purchases automatically'` — expect `repo.deleteById` to be called instead of `repo.save` with `isArchived: true`. (3) Update `'excludes archived purchases'` test: rename to `'excludes purchases with zero remaining installments'`; set `firstInstallmentDate` in the past so remaining count drops to 0; expect exclusion. (4) Add `PeriodSnapshotRepository` mock to constructor calls. (5) Add tests for `getPreviousPeriodSummary` returning snapshot data. (6) Add test for `null` previous period when no snapshot exists. (7) Remove `'period summaries include archived purchases'` describe block — archived purchases no longer exist to include. |
| **Acceptance** | All tests pass with the new hard-delete and snapshot model. |

---

## Task 13: Add PeriodSnapshotRepository Tests

| Field | Value |
|---|---|
| **Status** | Pending |
| **Priority** | High |
| **File** | New `src/infrastructure/repositories/__tests__/PeriodSnapshotRepositoryImpl.test.ts` |
| **Description** | Write unit tests following `ConfigRepositoryImpl.test.ts` pattern: (1) `save` and `getByPeriod` round-trip. (2) `getLatest` returns most recent snapshot. (3) `getLatest` returns `null` when no snapshots exist. (4) `save` overwrites existing snapshot for same period (idempotent close). Use in-memory Dexie instance: `new AppDatabase('TestDB_' + Date.now())`. |
| **Acceptance** | All snapshot repository tests pass. |

---

## Task 14: Update Component Tests

| Field | Value |
|---|---|
| **Status** | Pending |
| **Priority** | Medium |
| **Files** | `src/presentation/components/__tests__/ActivePurchases.test.tsx`, `src/presentation/components/__tests__/Dashboard.test.tsx` |
| **Description** | **ActivePurchases.test.tsx**: Update mocks — `dashboardService.getActivePurchases` no longer returns `isArchived` field. Ensure single-installment purchases appear in the list. **Dashboard.test.tsx**: Update `getPreviousPeriodSummary` mock to return `null` (test empty state) or snapshot data (test populated state). Update date format assertions to expect DD/MM/YYYY format. |
| **Acceptance** | Component tests pass with new data model and formatting. |

---

## Task 15: Update Domain Entity Tests

| Field | Value |
|---|---|
| **Status** | Pending |
| **Priority** | Medium |
| **File** | `src/domain/entities/__tests__/Purchase.test.ts` |
| **Description** | Remove any tests that reference `isArchived`, `markArchived()`, or `isComplete()` with the old semantics. Add tests for the new `getRemainingInstallments` behavior: (1) single installment with future due date → returns 1. (2) single installment with past due date → returns 0. (3) 12 installments, first due date in past, last in future → returns 1. (4) 12 installments, all due dates in future → returns 12. (5) 12 installments, all due dates in past → returns 0. |
| **Acceptance** | Domain entity tests pass; remaining-installment logic is fully covered. |

---

## Task 16: Update Specifications and ADRs

| Field | Value |
|---|---|
| **Status** | Pending |
| **Priority** | Medium |
| **Files** | `ProductSpecification.md`, `ArchitectureDecisionRecords.md` |
| **Description** | **ProductSpecification.md**: Remove rule 55 (archived purchases in period summaries). Remove rule 52's reference to `isArchived`. Add rules for: hard-delete lifecycle (completed purchases removed), period snapshot persistence, DD/MM/YYYY enforcement on current period dates, safe-area requirement. **ArchitectureDecisionRecords.md**: Add ADR-018 (Period Snapshot Persistence). Supersede ADR-016 with reversal note. Update ADR-015: note that dynamic recompute is replaced by snapshot lookup. Update ADR-003: remove reference to ADR-016 archiving. |
| **Acceptance** | All specs and ADRs reflect CR-007 decisions. |

---

## Task 17: Full Verification

| Field | Value |
|---|---|
| **Status** | Pending |
| **Priority** | High |
| **Description** | Run `npm run build` and `npm test`. Verify no TypeScript errors, all tests pass. Manual verification: active purchases show single-installment and last-installment items; previous period data persists after deleting purchases; dates show DD/MM/YYYY; bottom nav fully visible on iPhone PWA. |
| **Acceptance** | Build succeeds; all tests pass. |

---

## Dependencies

- **Task 1** must precede **Task 2** (entity change before DB/repo change).
- **Tasks 1–2** must precede **Task 3** (entity and DB updated before service logic).
- **Tasks 4–5** must precede **Task 6** (interface and schema before implementation).
- **Tasks 1–3** and **Tasks 4–6** converge at **Task 7** (snapshot creation needs both updated purchase logic and snapshot repository).
- **Task 7** must precede **Task 8** (snapshots must exist before previous period uses them).
- **Task 8** must precede **Task 9** (service change before UI handles it).
- **Task 10** is independent (UI-only date formatting).
- **Task 11** is independent (CSS-only safe area).
- **Task 12** depends on **Tasks 3, 8** (service logic changes).
- **Task 13** depends on **Task 6** (repository implementation).
- **Task 14** depends on **Tasks 3, 9** (component changes).
- **Task 15** depends on **Task 1** (entity change).
- **Task 16** is independent but should reflect final decisions.
- **Task 17** depends on all preceding tasks.

## Verification

1. `npm test` — all existing and new tests pass.
2. `npm run build` — no TypeScript or build errors.
3. Manual check: active purchases include single-installment and last-installment items; completed purchases disappear from DB; previous period data stable after settings change and purchase deletion; all dates in DD/MM/YYYY; bottom nav fully visible on iPhone PWA.
