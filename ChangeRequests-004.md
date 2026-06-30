# Change Request 004: Full Date Support, Previous Period Snapshot & Historical Chart

## Overview

Three interrelated changes to the date model and dashboard:

1. **Dates as Date objects** — `closingDay` and `dueDay` become full `Date` values
2. **Previous period snapshot** — Captured on startup when closing date passes, stored in DB
3. **Historical chart tab** — New view graphing past period due amounts and purchase counts

---

## Change 1: Dates as Date Objects

### Current State
`CardSettings` uses `closingDay: number` and `dueDay: number` (1–31). Displayed as ordinal text (e.g., "15th").

### Target State
`CardSettings` stores `closingDate: Date` and `dueDate: Date`. UI uses date pickers. Display shows full dates (e.g., "July 23, 2026").

### Rules
- When user sets a `closingDate`, `dueDate` is auto-calculated as `closingDate + 14 days` (calendar-aware arithmetic per ADR-013).
- User may override dueDate independently after auto-calculation.
- If the closing day (e.g., 31) does not exist in a month, roll to the last day of that month.
- `calculateBillingPeriod()` accepts `closingDate: Date`, extracts `.getDate()` for period assignment logic.
- Default settings: `closingDate = July 23, <current_year>`, `dueDate = August 6, <current_year>`.

### ADR Impact
- **ADR-010** updated (Configurable Dates — day to full date)
- **ADR-013** updated (due date default logic adapted for full dates)
- New ADR for month-end rollover rule

### Affected Files
| File | Change |
|------|--------|
| `src/domain/types/CardSettings.ts` | `closingDay: number` -> `closingDate: Date`, `dueDay: number` -> `dueDate: Date` |
| `src/domain/services/BillingPeriodCalculator.ts` | Parameter changes, month-end rollover |
| `src/infrastructure/database/db.ts` | DB version 3, schema migration |
| `src/infrastructure/repositories/ConfigRepositoryImpl.ts` | Date serialization |
| `src/presentation/components/Settings.tsx` | Date pickers instead of number inputs |
| `src/presentation/components/Dashboard.tsx` | Date formatting display |
| `src/application/services/PurchaseService.ts` | Pass closingDate instead of closingDay |

---

## Change 2: Previous Period Snapshot

### Current State
Dashboard shows only current period summary, computed dynamically from purchases.

### Target State
On app startup, detect if a closing date has passed since last check. If so, capture a snapshot of the just-closed period and store it. Dashboard shows both current period and previous period summary.

### Domain
New entity/type: `PeriodSnapshot`

```ts
interface PeriodSnapshot {
  id: string
  period: BillingPeriod
  closingDate: Date
  dueDate: Date
  totalAmount: number
  purchaseCount: number
  capturedAt: Date
}
```

### Rules
- Snapshot is captured once per closing date crossing (idempotent, guard with last-captured period).
- Snapshot is stored, not computed from historical data.
- First period displays `-` for all values.
- New repository interface in domain layer.

### Infrastructure
- New Dexie `periodSnapshots` table in DB version 3.
- Repository implementation.

### Application
- New `PeriodSnapshotService` (or extend `DashboardService`) with `captureSnapshot()` and `getLatestSnapshot()` methods.
- Startup logic in `App.tsx`.

### Presentation
- Dashboard extended to show previous period card above current period.
- Previous period fields: closing date, due date, total amount, purchase count.
- N/A state uses `-`.

### ADR Impact
- New ADR: Period Snapshot Capture

---

## Change 3: Historical Chart Tab

### Current State
No historical view.

### Target State
New bottom nav tab with a chart showing due amount and purchase count per past period. Uses stored `PeriodSnapshot` data.

### Rules
- Read-only view of all captured snapshots.
- Display options: bar chart or simple table (MVP minimal, plain list with CSS bars).
- Ordered chronologically descending (most recent first).

### Presentation
- New component: `src/presentation/components/History.tsx`
- New route `/history`
- Bottom nav updated with 5th tab

### ADR Impact
- New ADR: Historical Period Chart

---

## DB Migration

Current: version 2 (purchases + settings)
Target: version 3

```
this.version(3).stores({
  purchases: 'id, purchaseDate',
  settings: 'key',
  periodSnapshots: 'id, periodMonth, periodYear',
})
```

---

## Task Breakdown (CR-004)

Following AGENT_RULES.md limits (max 5 files per task):

| Task | Description | Files |
|------|-------------|-------|
| CR-004-TASK-01 | Domain: CardSettings type, PeriodSnapshot entity, updated BillingPeriodCalculator | `CardSettings.ts`, `PeriodSnapshot.ts` (new), `BillingPeriodCalculator.ts` |
| CR-004-TASK-02 | Domain/App: Repository interfaces + new PeriodSnapshotService | `PeriodSnapshotRepository.ts` (new), `PeriodSnapshotService.ts` (new) |
| CR-004-TASK-03 | Infra: DB v3 migration, ConfigRepositoryImpl, PeriodSnapshotRepositoryImpl | `db.ts`, `ConfigRepositoryImpl.ts`, `PeriodSnapshotRepositoryImpl.ts` (new) |
| CR-004-TASK-04 | Presentation: Settings date picker, Dashboard prev period card | `Settings.tsx`, `Dashboard.tsx` |
| CR-004-TASK-05 | Presentation: History tab + routing + AppShell | `History.tsx` (new), `App.tsx`, `AppShell.tsx` |
| CR-004-TASK-06 | Startup snapshot detection in App.tsx | `App.tsx` |
| CR-004-TASK-07 | Tests: domain, app, infra | Test files |
| CR-004-TASK-08 | Tests: component tests | Component test files |
| CR-004-TASK-09 | Documentation: ADR updates, Architecture.md, UserGuide.md | ADR + docs |

---

## ADR Updates Needed

- ADR-010: updated (full dates, configurable)
- ADR-013: updated (due date from Date, not int)
- New ADR: Period Snapshot Capture
- New ADR: Historical Period View
- New ADR: Month-End Rollover Rule

---

## Excluded from Scope

- Charts library dependency (MVP uses simple list/CSS, no charting lib)
- Export/import of snapshots
- Push notifications on closing date
