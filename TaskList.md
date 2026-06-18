# Task List

## TASK-001: Project Scaffolding

**Description:** Initialize the project with Vite, React, TypeScript, Material UI, Dexie, and PWA tooling.

**Files to modify:**
- (new) Project initialized via `npm create vite@latest` with React + TypeScript template
- (new) `package.json` — add dependencies: @mui/material, @mui/icons-material, @emotion/react, @emotion/styled, dexie, vite-plugin-pwa
- (new) `vite.config.ts` — configure vite-plugin-pwa
- (new) `tsconfig.json` — strict mode, path aliases

**Acceptance criteria:**
- `npm run dev` starts the dev server
- `npm run build` produces a production build
- `npm run preview` serves the build
- PWA manifest is generated on build

**Testing requirements:**
- None (scaffolding only)

---

## TASK-002: Domain — Purchase Entity

**Description:** Implement the `Purchase` entity and `Installment` value object in the domain layer. No framework dependencies allowed.

**Files to modify:**
- `src/domain/entities/Purchase.ts` — `Purchase` class/interface with `id`, `description`, `amount`, `installments`, `purchaseDate`, `firstInstallmentDate`
- `src/domain/entities/Installment.ts` — `Installment` class/value object with `number`, `dueDate`, `amount`
- `src/domain/entities/__tests__/Purchase.test.ts` — unit tests

**Acceptance criteria:**
- Purchase has required fields and validation
- Installment value = amount / total installments
- Purchase can generate its list of installments
- No framework imports in domain files

**Testing requirements:**
- Unit tests cover Purchase creation, validation, and installment generation
- Edge cases: single installment, multiple installments, rounding

---

## TASK-003: Domain — Billing Period

**Description:** Implement `BillingPeriod` value object and a calculator for automatic billing period assignment based on closing day.

**Files to modify:**
- `src/domain/valueObjects/BillingPeriod.ts` — month/year value object
- `src/domain/services/BillingPeriodCalculator.ts` — determines which billing period a purchase belongs to
- `src/domain/services/__tests__/BillingPeriodCalculator.test.ts` — unit tests

**Acceptance criteria:**
- BillingPeriod is defined by month and year
- Purchases after closing day belong to the next statement period
- Calculator is a pure function with no side effects
- No framework imports

**Testing requirements:**
- Tests cover edge cases: purchase before closing, purchase on closing day, purchase after closing, year boundary (Dec → Jan)

---

## TASK-004: Application — Purchase Service

**Description:** Implement the `PurchaseService` in the application layer with create, edit, and delete operations.

**Files to modify:**
- `src/application/services/PurchaseService.ts` — CRUD operations using repository interface
- `src/application/ports/PurchaseRepository.ts` — repository interface (port)
- `src/application/services/__tests__/PurchaseService.test.ts` — unit tests with mocked repository

**Acceptance criteria:**
- Create purchase validates input and assigns billing period
- Edit purchase updates fields
- Delete purchase removes it
- Service depends on repository interface, not concrete implementation

**Testing requirements:**
- Unit tests for create, edit, delete
- Test validation rules
- Mock repository to avoid IndexedDB dependency

---

## TASK-005: Application — Dashboard Service

**Description:** Implement dashboard queries: current period summary, future commitments, and active purchases.

**Files to modify:**
- `src/application/services/DashboardService.ts` — query methods using repository interface
- `src/application/services/__tests__/DashboardService.test.ts` — unit tests with mocked repository

**Acceptance criteria:**
- Current period summary returns total due, installment count
- Future commitments view returns installments beyond the current period
- Active purchases view returns purchases with remaining installments > 0
- All queries are read-only

**Testing requirements:**
- Unit tests for each query method
- Edge cases: empty state, multiple periods, fully paid purchases

---

## TASK-006: Infrastructure — Database and Repository

**Description:** Implement the Dexie database schema and the concrete `PurchaseRepository` in the infrastructure layer.

**Files to modify:**
- `src/infrastructure/database/db.ts` — Dexie database definition
- `src/infrastructure/repositories/PurchaseRepositoryImpl.ts` — repository implementation
- `src/infrastructure/repositories/__tests__/PurchaseRepositoryImpl.test.ts` — integration tests

**Acceptance criteria:**
- Database stores purchases with all required fields
- Repository implements the port from the application layer
- CRUD operations work against IndexedDB
- Installments are NOT persisted (generated dynamically per ADR-003)

**Testing requirements:**
- Integration tests with real Dexie instance (use `dexie-mockify` or in-memory)

---

## TASK-007: Presentation — Purchase Form

**Description:** Build a mobile-first form for creating and editing purchases with Material UI.

**Files to modify:**
- `src/presentation/components/PurchaseForm.tsx` — form component
- `src/presentation/components/__tests__/PurchaseForm.test.tsx` — component tests

**Acceptance criteria:**
- Form has fields: description, amount, installments count, purchase date
- Validates required fields and numeric constraints
- Submits to PurchaseService
- Works offline
- Mobile-first layout

**Testing requirements:**
- Component tests for form rendering and validation
- Test submit handler

---

## TASK-008: Presentation — Active Purchases View

**Description:** Build a list view showing active purchases (remaining installments > 0).

**Files to modify:**
- `src/presentation/components/ActivePurchases.tsx` — list component
- `src/presentation/components/__tests__/ActivePurchases.test.tsx` — component tests

**Acceptance criteria:**
- Lists purchases with remaining installments > 0
- Shows description, remaining amount, progress
- Each item has edit/delete actions
- Empty state when no active purchases
- Mobile-first layout

**Testing requirements:**
- Component tests for list rendering and empty state

---

## TASK-009: Presentation — Dashboard

**Description:** Build the main dashboard showing current billing period summary.

**Files to modify:**
- `src/presentation/components/Dashboard.tsx` — dashboard component
- `src/presentation/components/__tests__/Dashboard.test.tsx` — component tests

**Acceptance criteria:**
- Shows current period total amount due
- Shows number of active installments
- Shows closing day and due date
- Data is fetched from DashboardService
- Mobile-first layout

**Testing requirements:**
- Component tests for data display and loading state

---

## TASK-010: Presentation — Future Commitments View

**Description:** Build a view showing future installment commitments beyond the current period.

**Files to modify:**
- `src/presentation/components/FutureCommitments.tsx` — list component
- `src/presentation/components/__tests__/FutureCommitments.test.tsx` — component tests

**Acceptance criteria:**
- Lists future installments grouped by billing period
- Shows amount per period
- Empty state when no future commitments
- Mobile-first layout

**Testing requirements:**
- Component tests for grouped list rendering and empty state

---

## TASK-011: Presentation — App Shell and Navigation

**Description:** Build the app shell with navigation between views using React Router.

**Files to modify:**
- `src/App.tsx` — router and layout
- `src/presentation/components/AppShell.tsx` — bottom navigation / top bar
- `src/main.tsx` — entry point, PWA registration

**Acceptance criteria:**
- Navigation between Dashboard, Active Purchases, Future Commitments
- Add purchase button accessible from navigation
- Bottom navigation bar (mobile-first)
- PWA register service worker
- Mobile-first layout

**Testing requirements:**
- None (integration testing later)

---

## TASK-012: End-to-End Integration

**Description:** Wire all layers together and verify the full app works.

**Files to modify:**
- `src/App.tsx` — verify DI wiring (if needed)
- (verification only — no code changes expected if previous tasks correct)

**Acceptance criteria:**
- `npm run build` succeeds
- Full flow: create purchase → appears in active → appears on dashboard → appears in future commitments
- Navigation works between all views
- App loads offline

**Testing requirements:**
- `npm run test` passes all tests

---

## TASK-013: Documentation

**Description:** Update project documentation to reflect the implemented system.

**Files to modify:**
- `README.md` — setup, architecture overview, available scripts
- `Architecture.md` — Clean Architecture layers, module descriptions
- `UserGuide.md` — how to use the app
- `PROJECT_STATE.md` — mark tasks as complete

**Acceptance criteria:**
- README explains how to run, build, and test
- Architecture.md documents the layer structure
- UserGuide covers creating, editing, deleting purchases
- PROJECT_STATE.md reflects completion

**Testing requirements:**
- None
