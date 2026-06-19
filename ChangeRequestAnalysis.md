# Change Request Analysis

## 1. Impacted Business Rules

### Current Rules (from ProductSpecification.md)
| Rule | Description |
|------|-------------|
| BR-01 | Installment value = amount / installments |
| BR-02 | Purchases after closing day belong to next statement |
| BR-03 | Installments are generated dynamically |
| BR-04 | Active purchase = remaining installments > 0 |
| (implicit) | Closing day is a compile-time constant (15) |
| (implicit) | Due date = closing day + 10 (25) |
| (implicit) | First installment date is user-provided |
| (implicit) | Purchase date has no default |
| (implicit) | Installments has no default |

### Changed/New Rules

| Change | Impact on Business Rules |
|--------|--------------------------|
| **C1: Closing Day configurable** | Replaces the compile-time constant. Closing day becomes a runtime setting persisted per-user. Existing purchases retain their stored billing period; only new purchases use the updated closing day. |
| **C2: Due Date configurable** | Replaces the hardcoded `CLOSING_DAY + 10` formula. Due day becomes an independent persisted setting. The due date is displayed in date format (e.g., "15th" or with month context). |
| **C3: Closing Day + 14 default** | The default formula for due date changes from `+10` to `+14` days from closing day. Only applies as a UI default when the user modifies the closing day setting. |
| **C4: Purchase Date defaults to today** | New rule: purchaseDate auto-fills to today's date on the create form. |
| **C5: Installments defaults to 1** | New rule: installments auto-fills to 1 on the create form. |
| **C6: Remove First Installment Date** | The firstInstallmentDate field is removed from the UI. It becomes an auto-calculated value derived from the billing period and the due day config. **ADR-003 is affected**: installment generation still happens dynamically, but the base date shifts from user-provided to system-calculated. |

### Installment Date Derivation (for C6)
When `firstInstallmentDate` is removed from the UI, it must be auto-calculated at purchase creation time:
```
firstInstallmentDate = due date of the billing period the purchase belongs to
= new Date(billingPeriodYear, billingPeriodMonth - 1, dueDay)
```
This preserves backward compatibility: stored `firstInstallmentDate` is retained in the entity and DB, but no longer user-editable. Changing the due day config after creation does **not** retroactively change existing purchases' installment schedules.

---

## 2. Impacted Data Model

### `src/domain/config.ts`
- **Remove** `export const CLOSING_DAY = 15`
- **Replace with** loading closing day and due day from persistence at service initialization

### `src/domain/entities/Purchase.ts` — `PurchaseProps` and `Purchase`
- **No structural change** — `firstInstallmentDate` is retained as a stored computed field
- **Validation change** (`constructor`): Remove the user-facing validation of `firstInstallmentDate` (it is now system-assigned)
- **`generateInstallments()`**: No signature change needed; still uses `this.firstInstallmentDate` internally

### `src/application/services/PurchaseService.ts`
- **`CreatePurchaseInput`**: Remove `firstInstallmentDate` field
- **`UpdatePurchaseInput`**: Remove `firstInstallmentDate` field
- **`constructor`**: Accept `dueDay` parameter (in addition to `closingDay`)
- **`createPurchase()`**: Calculate `firstInstallmentDate` from `billingPeriod + dueDay` after computing billing period
- **`updatePurchase()`**: Remove `firstInstallmentDate` from merge logic; recalculate only if `purchaseDate` changes (which may change billing period, and thus first installment date)

### `src/application/services/DashboardService.ts`
- **`constructor`**: Accept `dueDay` parameter (needed for future installment display if due date is shown per-period)
- **No change** to current method signatures (installment display uses `generateInstallments()` which internally uses stored `firstInstallmentDate`)

### `src/domain/config.ts` (new role)
- **Remove** `export const CLOSING_DAY = 15`
- No replacement file-level constant; closing day and due day are loaded from persistence

### Database Schema (`src/infrastructure/database/db.ts`)
- **Schema version bump** required (v1 → v2)
- **No column removal**: `firstInstallmentDate` is retained (now system-calculated)
- **New table**: Add a `config` table (or use a dedicated store) to persist:
  - `closingDay: number`
  - `dueDay: number`
- Existing `purchases` table stays the same; migration is a no-op for data (just schema version change)

### `PurchaseRecord` interface
- **No change** to fields

### New: Config Repository & Service
- **New interface** `src/domain/repositories/ConfigRepository.ts`
  - `getSettings(): Promise<CardSettings>`
  - `saveSettings(settings: CardSettings): Promise<void>`
  - `CardSettings = { closingDay: number; dueDay: number }`
- **New implementation** `src/infrastructure/repositories/ConfigRepositoryImpl.ts`
- **New domain config value object** or simple type for card settings

---

## 3. Impacted UI Screens

### Dashboard (`src/presentation/components/Dashboard.tsx`)
- **Closing day**: Change from `{CLOSING_DAY}` to `{closingDay}` (loaded from config service). Display in date format: e.g., "15th" or "Day 15".
- **Due date**: Change from `{CLOSING_DAY + 10}` to `{dueDay}` (loaded from config service). Display in date format.
- Both values now come from the config service, not from hardcoded constants.

### PurchaseForm (`src/presentation/components/PurchaseForm.tsx`)
- **Remove** "First Installment Date" `TextField` (lines 133-142)
- **Remove** `firstInstallmentDate` state variable and related validation (lines 26-28, 57-60)
- **Change** `purchaseDate` default: from `''` to `new Date().toISOString().split('T')[0]` (today's date)
- **Change** `installments` default: from `''` to `'1'`
- **Change** `handleSubmit`: remove `firstInstallmentDateObj` from the payload passed to `service.createPurchase()` / `service.updatePurchase()`

### New: Settings Screen (`src/presentation/components/Settings.tsx`)
- **New component** to edit closing day and due day
- Two number/dropdown fields: Closing Day (1-31) and Due Day (1-31)
- When Closing Day changes, Due Day defaults to Closing Day + 14 (capped at end of month, max 28/29/30/31)
- Save to config repository
- Navigate to settings via a gear icon in the AppShell or Dashboard header

### AppShell (`src/presentation/components/AppShell.tsx`)
- **Add** a settings navigation item (gear icon in bottom nav or a settings tab)

### App.tsx
- **Change** service construction: load closingDay and dueDay from config repository (async) before rendering routes
- **Add** settings route: `/settings` → Settings component
- **Pass** config values to services

---

## 4. Impacted Tests

| Test File | Changes Required |
|-----------|-----------------|
| `src/domain/entities/__tests__/Purchase.test.ts` | Add test for `generateInstallments()` default behavior. No removal needed since `firstInstallmentDate` stays in the entity. |
| `src/domain/services/__tests__/BillingPeriodCalculator.test.ts` | **No change** (already accepts closingDay as parameter). May add test for new default due date logic. |
| `src/application/services/__tests__/PurchaseService.test.ts` | **Major changes**: Remove `firstInstallmentDate` from test inputs. Add `dueDay` to constructor. Verify that `firstInstallmentDate` is auto-calculated on `createPurchase`. Update `updatePurchase` tests. |
| `src/application/services/__tests__/DashboardService.test.ts` | Add `dueDay` to constructor. Verify closing day / due day display values. |
| `src/infrastructure/repositories/__tests__/PurchaseRepositoryImpl.test.ts` | **No change** (schema structure unchanged for purchases). May add config repository tests. |
| `src/presentation/components/__tests__/PurchaseForm.test.tsx` | **Major changes**: Remove "First Installment Date" field tests. Update validation tests. Update submit payload tests. Add defaults (today's date, installments=1) tests. |
| `src/presentation/components/__tests__/Dashboard.test.tsx` | Update tests for closing day / due day display (now from config service, not constant). |
| `src/presentation/components/__tests__/ActivePurchases.test.tsx` | **No change** expected. |
| `src/presentation/components/__tests__/FutureCommitments.test.tsx` | **No change** expected. |

### New Tests Required
- **ConfigRepository** unit tests
- **Settings component** tests (render, edit closing day, edit due day, closing+14 default)
- **New integration test** for the config persistence flow
- **Edge case tests** for first installment date calculation (month boundaries, year boundaries, day-of-month clamping)

---

## 5. Required Specification Updates

### `ProductSpecification.md`
- **Core Business Rules section**: Add the new rules:
  - Closing day is user-configurable (1-31), persisted locally
  - Due day is user-configurable (1-31), defaults to closing day + 14
  - First installment date is automatically calculated from billing period due date
  - Purchase date defaults to today
  - Installments defaults to 1
- **Excluded section**: Consider adding "Multiple closing/due date configurations" as excluded (single global config is MVP scope)

---

## 6. Required ADR Updates

### ADR-003: Installments generated dynamically (never persisted)
- **Update**: The ADR remains correct, but needs a note: "The base date for installment calculation (`firstInstallmentDate`) is auto-calculated from billing period and due day config at purchase creation time, rather than being user-provided."

### New ADR: ADR-010: Configurable Closing & Due Dates
- **Record the decision** to make closing day and due date user-configurable persisted settings
- **Context**: MVP originally hardcoded these to simplify initial development; operational use revealed the need for customization
- **Consequence**: Added config storage (IndexedDB table/key-value), new Settings UI, and auto-calculation of first installment date
- **Trade-off**: Single global config per device (not per-card) keeps complexity low

### New ADR: ADR-011: First Installment Date Auto-Calculation
- **Record the decision** to remove the user-facing First Installment Date field and compute it from billing period + due day
- **Context**: The field confused users; first installment always aligns with the statement due date
- **Consequence**: The field is removed from UI but retained in the data model as a stored computed value for installment generation

---

## 7. Proposed Implementation Tasks

### Task A: Domain Layer Updates
- **A1**: Create `src/domain/types/CardSettings.ts` — define `CardSettings { closingDay: number; dueDay: number }`
- **A2**: Update `src/domain/config.ts` — remove `CLOSING_DAY` constant
- **A3**: Create `src/domain/repositories/ConfigRepository.ts` — define interface
- **A4**: Update `Purchase.ts` — remove `firstInstallmentDate` from validation in constructor (optional: keep field, remove user-facing validation)

### Task B: Infrastructure Layer Updates
- **B1**: Create `src/infrastructure/repositories/ConfigRepositoryImpl.ts` — implements ConfigRepository using Dexie
- **B2**: Update `src/infrastructure/database/db.ts` — bump DB version to 2, add `settings` table/key-value store
- **B3**: (If needed) Add DB migration logic for v1→v2

### Task C: Application Layer Updates
- **C1**: Update `src/application/services/PurchaseService.ts`
  - Add `dueDay` to constructor
  - Remove `firstInstallmentDate` from `CreatePurchaseInput` and `UpdatePurchaseInput`
  - Auto-calculate `firstInstallmentDate` in `createPurchase()` using billing period + dueDay
  - Auto-recalculate `firstInstallmentDate` in `updatePurchase()` when purchaseDate changes
- **C2**: Update `src/application/services/DashboardService.ts`
  - Add `dueDay` parameter to constructor
  - Expose closing day / due day in `CurrentPeriodSummary` (or as separate output)

### Task D: Presentation Layer Updates
- **D1**: Update `src/presentation/components/PurchaseForm.tsx`
  - Remove First Installment Date field
  - Default purchaseDate to today's ISO date
  - Default installments to '1'
  - Remove related validation and state
- **D2**: Update `src/presentation/components/Dashboard.tsx`
  - Load closing day and due day from props (passed from App via service)
  - Display in date format (e.g., "15th" or "Day 15")
- **D3**: Create `src/presentation/components/Settings.tsx`
  - Closing Day selector (1-31)
  - Due Day selector (1-31), with +14 default when closing day changes
  - Save button
- **D4**: Update `src/presentation/components/AppShell.tsx`
  - Add settings icon/nav item
- **D5**: Update `src/App.tsx`
  - Async loading of config before rendering
  - Wire Settings component at `/settings` route
  - Pass closingDay and dueDay to services

### Task E: Tests
- **E1**: Update `PurchaseService.test.ts` — remove firstInstallmentDate from inputs, add dueDay, verify auto-calculation
- **E2**: Update `DashboardService.test.ts` — add dueDay to constructor
- **E3**: Update `PurchaseForm.test.tsx` — remove firstInstallmentDate tests, add default value tests
- **E4**: Update `Dashboard.test.tsx` — update for config-driven display
- **E5**: Write `ConfigRepositoryImpl.test.ts` — tests for save/load settings
- **E6**: Write `Settings.test.tsx` — component render, edit, default calculation

### Task F: Documentation
- **F1**: Update `ProductSpecification.md` — add new business rules
- **F2**: Update `ArchitectureDecisionRecords.md` — add ADR-010, ADR-011; update ADR-003
- **F3**: Update `UserGuide.md` — document settings screen
- **F4**: Update `PROJECT_STATE.md` — mark tasks as completed

### Implementation Order
```
A1 → A2 → A3 → B1 → B2 → B3 → A4 → C1 → C2 → D1 → D2 → D3 → D4 → D5
then parallel: E1-E6, F1-F4
```
