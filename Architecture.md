# Architecture

## Clean Architecture Layers

```
+-----------------------------------------+
|            Presentation                  |
|  (React components, MUI, routing)       |
+-----------------------------------------+
|            Application                   |
|  (PurchaseService, DashboardService,     |
|   PeriodSnapshotService)                |
+-----------------------------------------+
|            Infrastructure                |
|  (Dexie database, repositories)         |
+-----------------------------------------+
|            Domain                        |
|  (Entities, value objects, services)    |
+-----------------------------------------+
```

### Dependency Rule

- **Domain** — No imports from any other layer. No framework dependencies.
- **Application** — Depends on Domain only (repository interfaces, entities).
- **Infrastructure** — Depends on Domain only (implements repository interfaces).
- **Presentation** — Depends on Application (services) and Domain (types).

### Layer Details

#### Domain (`src/domain/`)

Core business logic with zero framework imports.

| File | Description |
|------|-------------|
| `entities/Purchase.ts` | Purchase entity with validation and installment generation |
| `entities/Installment.ts` | Installment value object (interface) |
| `valueObjects/BillingPeriod.ts` | Billing period (month, year) with comparison methods |
| `services/BillingPeriodCalculator.ts` | Pure function to compute billing period from date + closing date; `nextClosingDate()` for month-end rollover |
| `repositories/PurchaseRepository.ts` | Repository port interface for purchases |
| `repositories/ConfigRepository.ts` | Repository port interface for card settings |
| `repositories/PeriodSnapshotRepository.ts` | Repository port interface for period snapshots |
| `types/CardSettings.ts` | `closingDate: Date, dueDate: Date` |
| `types/PeriodSnapshot.ts` | Snapshot entity with period, dates, amounts |
| `types.ts` | `Currency = 'ARS'` type alias |

#### Application (`src/application/`)

Use cases orchestrate domain logic.

| File | Description |
|------|-------------|
| `services/PurchaseService.ts` | Create, update, delete purchases; validates input, assigns billing period |
| `services/DashboardService.ts` | Read-only queries: current period summary, future commitments, active purchases |
| `services/PeriodSnapshotService.ts` | Capture period snapshots on startup, retrieve latest/all |

#### Infrastructure (`src/infrastructure/`)

Persistence adapters implementing domain ports.

| File | Description |
|------|-------------|
| `database/db.ts` | Dexie `AppDatabase` with `purchases`, `settings`, `periodSnapshots` tables (v3) |
| `repositories/PurchaseRepositoryImpl.ts` | Maps `Purchase` <-> `PurchaseRecord`, implements `PurchaseRepository` |
| `repositories/ConfigRepositoryImpl.ts` | Maps `CardSettings` <-> `SettingsRecord`, defaults to July 23 closing |
| `repositories/PeriodSnapshotRepositoryImpl.ts` | Maps `PeriodSnapshot` <-> `PeriodSnapshotRecord`, implements `PeriodSnapshotRepository` |

#### Presentation (`src/presentation/`)

React components with MUI. All receive services as props (manual injection).

| File | Description |
|------|-------------|
| `components/AppShell.tsx` | Bottom navigation (5 tabs) + FAB + page content wrapper |
| `components/Dashboard.tsx` | Current period summary + previous period snapshot card |
| `components/ActivePurchases.tsx` | Purchase list with edit/delete actions |
| `components/FutureCommitments.tsx` | Future installments grouped by billing period |
| `components/PurchaseForm.tsx` | Create/edit purchase form with validation |
| `components/Settings.tsx` | Date pickers for closing/due dates |
| `components/History.tsx` | Visual bar chart of past period snapshots |

### Wiring (`src/App.tsx`)

The composition root instantiates services using `useMemo` (singleton) and passes them as props to route components:

```
PurchaseRepositoryImpl
  +-- PurchaseService(repo, closingDate, dueDate)  -> /new, /edit/:id, /purchases
  +-- DashboardService(repo, closingDate, dueDate) -> /, /purchases, /future

PeriodSnapshotRepositoryImpl
  +-- PeriodSnapshotService(purchaseRepo, snapshotRepo) -> /, /history

ConfigRepositoryImpl
  +-- Settings component                               -> /settings
```

Startup logic in `AppRoutes` detects if the closing date has passed and triggers snapshot capture, advancing both closing and due dates by one month.

### DB Schema (v3)

```
purchases:   'id, purchaseDate'
settings:    'key'
periodSnapshots: 'id, capturedAt'
```

## Key Decisions

- **Manual DI** — Services created in `useMemo` and passed as props. No DI library.
- **Installments generated dynamically** — Never persisted. Computed from `Purchase` data on demand (ADR-003).
- **Billing period assigned on create/update** — Computed from purchase date + closing date (CLOSING_DAY=15 default, now configurable).
- **Installments paid count = 0** — No payment tracking in MVP. All installments shown as remaining.
- **Full date values** — closingDay/dueDay (int) replaced with closingDate/dueDate (Date). UI uses date pickers. Settings default to July 23 closing, August 6 due date.
- **Previous period snapshot** — Captured on startup when closing date passes. Stored in IndexedDB, not computed from historical data.
- **Month-end rollover** — If the closing day (e.g., 31) doesn't exist in a month, use the last day of that month.

## Testing

- Unit tests in each layer (`__tests__/` directories)
- Integration tests use `fake-indexeddb` (jsdom lacks native IndexedDB)
- Target: >=90% coverage
- 15 test files, 144 tests
