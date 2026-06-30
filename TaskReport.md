## Task

CR-004: Implement Full Date Support, Previous Period Snapshot & Historical Chart

## Objective

Three interrelated changes:
1. closingDay/dueDay (int) replaced with closingDate/dueDate (Date)
2. Previous period snapshot captured on startup when closing date passes
3. Historical chart tab showing past period data

## Files Modified

### Domain Layer
- `src/domain/types/CardSettings.ts` — closingDay/dueDay (number) -> closingDate/dueDate (Date)
- `src/domain/types/PeriodSnapshot.ts` — NEW: snapshot entity interface
- `src/domain/services/BillingPeriodCalculator.ts` — param type change + `nextClosingDate()` function
- `src/domain/repositories/PeriodSnapshotRepository.ts` — NEW: repository port

### Application Layer
- `src/application/services/PurchaseService.ts` — constructor takes Date instead of number
- `src/application/services/DashboardService.ts` — constructor takes Date, CurrentPeriodSummary uses Date
- `src/application/services/PeriodSnapshotService.ts` — NEW: capture and query snapshots

### Infrastructure Layer
- `src/infrastructure/database/db.ts` — version 3 with periodSnapshots table, SettingsRecord with Date fields
- `src/infrastructure/repositories/ConfigRepositoryImpl.ts` — Date serialization, July 23 default
- `src/infrastructure/repositories/PeriodSnapshotRepositoryImpl.ts` — NEW: Dexie-backed repository

### Presentation Layer
- `src/presentation/components/Settings.tsx` — date pickers instead of number inputs
- `src/presentation/components/Dashboard.tsx` — previous period card, date formatting
- `src/presentation/components/AppShell.tsx` — 5th tab (History)
- `src/presentation/components/History.tsx` — NEW: visual bar chart of past snapshots
- `src/App.tsx` — History route, startup snapshot detection, Date-based service params

### Tests
- `src/domain/services/__tests__/BillingPeriodCalculator.test.ts` — updated for Date params + nextClosingDate tests (35 tests)
- `src/application/services/__tests__/PurchaseService.test.ts` — updated for Date params (19 tests)
- `src/application/services/__tests__/DashboardService.test.ts` — updated for Date params (6 tests)
- `src/application/services/__tests__/PeriodSnapshotService.test.ts` — NEW (7 tests)
- `src/infrastructure/repositories/__tests__/ConfigRepositoryImpl.test.ts` — updated for Date fields (4 tests)
- `src/infrastructure/repositories/__tests__/PeriodSnapshotRepositoryImpl.test.ts` — NEW (5 tests)
- `src/presentation/components/__tests__/Dashboard.test.tsx` — updated for PeriodSnapshotService prop + Date props (5 tests)
- `src/presentation/components/__tests__/Settings.test.tsx` — updated for date pickers (7 tests)
- `src/presentation/components/__tests__/History.test.tsx` — NEW (4 tests)

### Documentation
- `ArchitectureDecisionRecords.md` — updated ADR-010, added ADR-014/015/016
- `Architecture.md` — updated layer details and wiring
- `UserGuide.md` — updated for date pickers, previous period, history tab
- `PROJECT_STATE.md` — marked CR-004 complete

## Tests Executed

All 144 tests pass across 15 test files.

## Build Result

TypeScript + Vite build passes. Bundle size warning (pre-existing, chunk > 500 KB).

## Known Issues

- `act()` warnings in component tests (pre-existing, cosmetic)
- Large bundle chunk (pre-existing, needs code-splitting)
- DB migration from v2 to v3 handles old settings format gracefully (falls back to defaults if invalid)

## Next Recommended Task

Awaiting next change request or addressing tech debt (chunk splitting, act() warnings).
