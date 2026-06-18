# Architecture

## Clean Architecture Layers

```
┌─────────────────────────────────────────┐
│            Presentation                  │
│  (React components, MUI, routing)       │
├─────────────────────────────────────────┤
│            Application                   │
│  (PurchaseService, DashboardService)     │
├─────────────────────────────────────────┤
│            Infrastructure                │
│  (Dexie database, PurchaseRepository)    │
├─────────────────────────────────────────┤
│            Domain                        │
│  (Entities, value objects, services)     │
└─────────────────────────────────────────┘
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
| `services/BillingPeriodCalculator.ts` | Pure function to compute billing period from date + closing day |
| `repositories/PurchaseRepository.ts` | Repository port interface |
| `config.ts` | `CLOSING_DAY = 15` constant |
| `types.ts` | `Currency = 'ARS'` type alias |

#### Application (`src/application/`)

Use cases orchestrate domain logic.

| File | Description |
|------|-------------|
| `services/PurchaseService.ts` | Create, update, delete purchases; validates input, assigns billing period |
| `services/DashboardService.ts` | Read-only queries: current period summary, future commitments, active purchases |

#### Infrastructure (`src/infrastructure/`)

Persistence adapters implementing domain ports.

| File | Description |
|------|-------------|
| `database/db.ts` | Dexie `AppDatabase` with `purchases` table schema |
| `repositories/PurchaseRepositoryImpl.ts` | Maps `Purchase` ↔ `PurchaseRecord`, implements `PurchaseRepository` |

#### Presentation (`src/presentation/`)

React components with MUI. All receive services as props (manual injection).

| File | Description |
|------|-------------|
| `components/AppShell.tsx` | Bottom navigation + FAB + page content wrapper |
| `components/Dashboard.tsx` | Current billing period summary |
| `components/ActivePurchases.tsx` | Purchase list with edit/delete actions |
| `components/FutureCommitments.tsx` | Future installments grouped by billing period |
| `components/PurchaseForm.tsx` | Create/edit purchase form with validation |

### Wiring (`src/App.tsx`)

The composition root instantiates services using `useRef` (singleton) and passes them as props to route components:

```
PurchaseRepositoryImpl
  ├── PurchaseService(repo, CLOSING_DAY)  → /new, /edit/:id, /purchases
  └── DashboardService(repo, CLOSING_DAY) → /, /purchases, /future
```

## Key Decisions

- **Manual DI** — Services created in `useRef` and passed as props. No DI library.
- **Installments generated dynamically** — Never persisted. Computed from `Purchase` data on demand (ADR-003).
- **Billing period assigned on create/update** — Computed from purchase date + closing day (CLOSING_DAY=15).
- **Installments paid count = 0** — No payment tracking in MVP. All installments shown as remaining.

## Testing

- Unit tests in each layer (`__tests__/` directories)
- Integration tests use `fake-indexeddb` (jsdom lacks native IndexedDB)
- Target: >=90% coverage
