# CR-001 Implementation Task List

**Dependency chain:** Tasks must be completed in order within each layer. Cross-layer dependencies noted below.

---

## Task 1: Domain — CardSettings Type

**Objective:** Define the domain type for configurable card settings.

**Files to create:**
- `src/domain/types/CardSettings.ts`

**Specification:**
```typescript
export interface CardSettings {
  closingDay: number  // 1–31
  dueDay: number      // 1–31
}
```

**Verification:** Type compiles, can be imported by other modules.

---

## Task 2: Domain — ConfigRepository Interface

**Objective:** Define the repository port for persisting card settings.

**Files to create:**
- `src/domain/repositories/ConfigRepository.ts`

**Specification:**
```typescript
import type { CardSettings } from '../types/CardSettings'

export interface ConfigRepository {
  getSettings(): Promise<CardSettings>
  saveSettings(settings: CardSettings): Promise<void>
}
```

**Verification:** Type compiles, follows same pattern as `PurchaseRepository`.

---

## Task 3: Infrastructure — Database Schema v2

**Objective:** Bump Dexie schema to v2, add a `settings` table for config persistence.

**Files to modify:**
- `src/infrastructure/database/db.ts`

**Changes:**
1. Add `SettingsRecord` interface:
   ```typescript
   export interface SettingsRecord {
     key: 'card'
     closingDay: number
     dueDay: number
   }
   ```
2. Add `settings` table to `AppDatabase`:
   ```typescript
   settings!: Table<SettingsRecord, string>
   ```
3. Bump version from 1 to 2, keeping existing `purchases` store:
   ```typescript
   this.version(2).stores({
     purchases: 'id, purchaseDate',
     settings: 'key',
   })
   ```
4. Keep v1 declaration for migration context (Dexie handles this automatically for additive changes).

**Verification:** `npm run build` succeeds. No data loss for existing purchases.

---

## Task 4: Infrastructure — ConfigRepository Implementation

**Objective:** Implement `ConfigRepository` using Dexie with hardcoded defaults (closing day 15, due day 29).

**Files to create:**
- `src/infrastructure/repositories/ConfigRepositoryImpl.ts`

**Specification:**
```typescript
import type { ConfigRepository } from '../../domain/repositories/ConfigRepository'
import type { CardSettings } from '../../domain/types/CardSettings'
import { AppDatabase } from '../database/db'

export class ConfigRepositoryImpl implements ConfigRepository {
  private db: AppDatabase

  constructor(db?: AppDatabase) {
    this.db = db ?? new AppDatabase()
  }

  async getSettings(): Promise<CardSettings> {
    const record = await this.db.settings.get('card')
    return record
      ? { closingDay: record.closingDay, dueDay: record.dueDay }
      : { closingDay: 15, dueDay: 29 }
  }

  async saveSettings(settings: CardSettings): Promise<void> {
    await this.db.settings.put({ key: 'card', ...settings })
  }
}
```

**Defaults rationale:** closingDay=15 preserves MVP behavior. dueDay=29 implements the new "+14" rule (15 + 14 = 29).

**Verification:** Can save and retrieve settings with persistence across page reloads.

---

## Task 5: Domain — Remove CLOSING_DAY Constant

**Objective:** Remove the compile-time constant so all consumers load closing day from config.

**Files to modify:**
- `src/domain/config.ts`

**Change:** Delete file (or set to empty export).

**Impacted consumers** (see Task 8 for wiring):
- ~~`src/App.tsx` line 11~~ → will load from config repository
- ~~`src/presentation/components/Dashboard.tsx` line 8, 33, 47~~ → will receive via props

---

## Task 6: Application — PurchaseService (dueDay + auto-calc firstInstallmentDate)

**Objective:** Add `dueDay` parameter; remove `firstInstallmentDate` from input; auto-calculate it.

**Files to modify:**
- `src/application/services/PurchaseService.ts`
- `src/application/services/__tests__/PurchaseService.test.ts`

### Service changes (`PurchaseService.ts`)

1. **Constructor** — add `dueDay: number` parameter, store as private field.
2. **`CreatePurchaseInput`** — remove `firstInstallmentDate: Date`.
3. **`UpdatePurchaseInput`** — remove `firstInstallmentDate?: Date`.
4. **`createPurchase()`** — after computing `billingPeriod`, calculate:
   ```typescript
   const billingPeriod = calculateBillingPeriod(this.closingDay, input.purchaseDate)
   const firstInstallmentDate = new Date(billingPeriod.year, billingPeriod.month - 1, this.dueDay)
   ```
   Remove `...input` spread for `firstInstallmentDate`. Pass `firstInstallmentDate` explicitly.
5. **`updatePurchase()`** — remove `firstInstallmentDate` from merge. When `purchaseDate` changes (triggering billingPeriod recalculation), also recalculate `firstInstallmentDate`:
   ```typescript
   const firstInstallmentDate = input.purchaseDate
     ? new Date(billingPeriod.year, billingPeriod.month - 1, this.dueDay)
     : existing.firstInstallmentDate
   ```

### Test changes (`PurchaseService.test.ts`)

1. **`validCreateInput`** — remove `firstInstallmentDate` from return value.
2. All `new PurchaseService(repo, 15)` calls → change to `new PurchaseService(repo, 15, 29)`.
3. All `Purchase` construction in test fixtures — keep `firstInstallmentDate` (entity still requires it).
4. **New test:** Verify `firstInstallmentDate` is auto-calculated correctly on `createPurchase`:
   - Purchase on June 10, closingDay=15, dueDay=29 → billingPeriod=June → firstInstallmentDate=June 29
   - Purchase on June 20, closingDay=15, dueDay=29 → billingPeriod=July → firstInstallmentDate=July 29
5. **New test:** Verify `firstInstallmentDate` is recalculated when `purchaseDate` changes on update.
6. **New test:** Verify `firstInstallmentDate` is preserved when `purchaseDate` does not change on update.
7. Remove any test that references `firstInstallmentDate` in the input payload.

**Verification:** `npx vitest run src/application/services/__tests__/PurchaseService.test.ts` passes.

---

## Task 7: Application — DashboardService (dueDay param)

**Objective:** Add `dueDay` to constructor for future use; no behavioral change yet.

**Files to modify:**
- `src/application/services/DashboardService.ts`
- `src/application/services/__tests__/DashboardService.test.ts`

### Service changes (`DashboardService.ts`)

1. **Constructor** — add `dueDay: number` parameter.
2. Store as private field (for future use).
3. Optionally add `closingDay` and `dueDay` to `CurrentPeriodSummary` if Dashboard needs them:
   ```typescript
   export interface CurrentPeriodSummary {
     period: BillingPeriod
     totalDue: number
     installmentCount: number
     closingDay: number
     dueDay: number
   }
   ```

### Test changes (`DashboardService.test.ts`)

1. All `new DashboardService(repo, 15)` → `new DashboardService(repo, 15, 29)`.
2. If `CurrentPeriodSummary` was extended, update test assertions.

**Verification:** `npx vitest run src/application/services/__tests__/DashboardService.test.ts` passes.

---

## Task 8: Presentation — PurchaseForm (remove field + add defaults)

**Objective:** Remove First Installment Date field; default purchase date to today; default installments to 1.

**Files to modify:**
- `src/presentation/components/PurchaseForm.tsx`
- `src/presentation/components/__tests__/PurchaseForm.test.tsx`

### Component changes (`PurchaseForm.tsx`)

1. **Remove** state variable (lines 26–28):
   ```typescript
   const [firstInstallmentDate, setFirstInstallmentDate] = useState(...)
   ```
2. **Change** `purchaseDate` default (line 23–25):
   ```typescript
   const [purchaseDate, setPurchaseDate] = useState(
     initialPurchase?.purchaseDate.toISOString().split('T')[0] ?? new Date().toISOString().split('T')[0]
   )
   ```
3. **Change** `installments` default (line 22):
   ```typescript
   const [installments, setInstallments] = useState(initialPurchase?.installments.toString() ?? '1')
   ```
4. **Remove** `firstInstallmentDateObj` (line 39).
5. **Remove** first installment date validation (lines 57–60).
6. **Remove** first installment date TextField (lines 133–142).
7. **Remove** `firstInstallmentDate` from both `createPurchase` and `updatePurchase` payloads (lines 70, 78).

### Test changes (`PurchaseForm.test.tsx`)

1. **`renders all form fields`** (line 18) — remove `getByLabelText(/first installment date/i)` assertion.
2. **`calls createPurchase on valid submit`** (line 76) — remove `user.type` line for first installment date.
3. **`calls updatePurchase on valid submit in edit mode`** (line 96) — no change needed (payload already uses `expect.objectContaining`).
4. **`displays error message when service throws`** (line 144) — remove `user.type` line for first installment date.
5. **New test:** Verify purchase date is pre-filled with today's date on create form.
6. **New test:** Verify installments defaults to 1 on create form.
7. **New test:** Verify submit does not include `firstInstallmentDate` in the payload.

**Verification:** `npx vitest run src/presentation/components/__tests__/PurchaseForm.test.tsx` passes.

---

## Task 9: Presentation — Dashboard (config-driven display)

**Objective:** Replace hardcoded `CLOSING_DAY` and `CLOSING_DAY + 10` with values from config.

**Files to modify:**
- `src/presentation/components/Dashboard.tsx`
- `src/presentation/components/__tests__/Dashboard.test.tsx`

### Component changes (`Dashboard.tsx`)

1. **Remove** `import { CLOSING_DAY } from '../../domain/config'`.
2. **Accept** `closingDay` and `dueDay` as props:
   ```typescript
   interface DashboardProps {
     dashboardService: DashboardService
     closingDay: number
     dueDay: number
   }
   ```
3. **Remove** line 33: `const dueDate = CLOSING_DAY + 10`.
4. **Change** closing day display (line 47): `{CLOSING_DAY}` → `{closingDay}` with ordinal suffix formatting, e.g.:
   ```typescript
   const ordinal = (n: number) => {
     if (n > 3 && n < 21) return `${n}th`
     switch (n % 10) { case 1: return `${n}st`; case 2: return `${n}nd`; case 3: return `${n}rd`; default: return `${n}th` }
   }
   ```
   Display: `{ordinal(closingDay)}`.
5. **Change** due date display (line 51): `{dueDate}` → `{ordinal(dueDay)}`.

### Test changes (`Dashboard.test.tsx`)

1. **`shows closing day`** — update render to pass `closingDay` and `dueDay` props. Update assertion from `'15'` to `'15th'`.
2. **`shows due date`** — update render to pass props. Update assertion from `'25'` to `'29th'` (matching the new default).
3. Both tests need the mock service to return `closingDay` and `dueDay` in the summary (or pass separately).

**Verification:** `npx vitest run src/presentation/components/__tests__/Dashboard.test.tsx` passes.

---

## Task 10: Presentation — Settings Screen

**Objective:** Create a new settings screen for editing closing day and due day.

**Files to create:**
- `src/presentation/components/Settings.tsx`

**Files to modify:**
- (None for this task; wiring done in Tasks 11–12)

### Component specification (`Settings.tsx`)

```typescript
interface SettingsProps {
  configRepository: ConfigRepository
  onSave?: () => void
  onCancel?: () => void
}
```

**Behavior:**
1. On mount, load current settings from `configRepository.getSettings()`.
2. Two `TextField` inputs of type `number`, min=1, max=31:
   - "Closing Day" — current value, onChange resets dueDay to `Math.min(newValue + 14, 28)` only if dueDay hasn't been manually changed (or always — per design preference).
   - "Due Day" — independent value.
3. "Save" button: calls `configRepository.saveSettings({ closingDay, dueDay })`, then `onSave()`.
4. "Cancel" button: calls `onCancel()`.
5. Validation: both must be 1–31 integers.

**Default behavior for C3:** When closing day value changes via the input, set due day to `Math.min(closingDay + 14, 28)`. Use a ref or flag to distinguish initial load from user edits. Simpler approach: always apply the +14 default when closing day changes (user can still adjust due day independently afterward).

**New test file:** `src/presentation/components/__tests__/Settings.test.tsx`

Tests:
- Renders both fields pre-filled with current settings
- Changing closing day updates due day to +14
- Changing due day independently does not revert
- Save calls `configRepository.saveSettings` with correct values
- Shows validation error for values outside 1–31

---

## Task 11: Presentation — AppShell (settings nav item)

**Objective:** Add a settings icon to the bottom navigation.

**Files to modify:**
- `src/presentation/components/AppShell.tsx`

**Changes:**
1. Add import:
   ```typescript
   import SettingsIcon from '@mui/icons-material/Settings'
   ```
2. Add a 4th tab to the `tabs` array:
   ```typescript
   { label: 'Settings', icon: <SettingsIcon />, path: '/settings' },
   ```
3. Ensure the `currentTab` index logic handles the new tab correctly.

**Design decision:** Settings goes in the bottom nav for discoverability. Alternative: gear icon in the top bar. Bottom nav is simpler for mobile-first PWA.

---

## Task 12: Presentation — App.tsx (async config loading + routing)

**Objective:** Wire config repository into app initialization, pass config values to services and components.

**Files to modify:**
- `src/App.tsx`

**Changes:**

1. **Add imports:**
   ```typescript
   import { ConfigRepositoryImpl } from './infrastructure/repositories/ConfigRepositoryImpl'
   import type { ConfigRepository } from './domain/repositories/ConfigRepository'
   import type { CardSettings } from './domain/types/CardSettings'
   import { Settings } from './presentation/components/Settings'
   ```

2. **Remove** `import { CLOSING_DAY } from './domain/config'`.

3. **Change `useServices` hook** — accept `CardSettings` and `ConfigRepository`:
   ```typescript
   function useServices(settings: CardSettings, configRepo: ConfigRepository): Services {
     const ref = useRef<Services | null>(null)
     if (!ref.current) {
       const repo = new PurchaseRepositoryImpl()
       ref.current = {
         purchaseService: new PurchaseService(repo, settings.closingDay, settings.dueDay),
         dashboardService: new DashboardService(repo, settings.closingDay, settings.dueDay),
         configRepository: configRepo,
       }
     }
     return ref.current
   }
   ```

4. **Update `Services` interface:**
   ```typescript
   interface Services {
     purchaseService: PurchaseServiceType
     dashboardService: DashboardServiceType
     configRepository: ConfigRepository
   }
   ```

5. **Add async config loading** at the `AppRoutes` level (or a new wrapper component):
   ```typescript
   function AppRoutes() {
     const [settings, setSettings] = useState<CardSettings | null>(null)
     const [configRepo] = useState(() => new ConfigRepositoryImpl())

     useEffect(() => {
       configRepo.getSettings().then(setSettings)
     }, [configRepo])

     if (!settings) return <Typography sx={{ p: 2, textAlign: 'center' }}>Loading...</Typography>

     const { purchaseService, dashboardService } = useServices(settings, configRepo)

     return (
       <Routes>
         <Route path="/" element={<DashboardPage dashboardService={dashboardService} closingDay={settings.closingDay} dueDay={settings.dueDay} />} />
         <Route path="/settings" element={<Settings configRepository={configRepo} onSave={() => configRepo.getSettings().then(setSettings)} onCancel={() => window.history.back()} />} />
         {/* ... other routes ... */}
       </Routes>
     )
   }
   ```

6. **Update `DashboardPage`** to accept and pass `closingDay` and `dueDay`:
   ```typescript
   function DashboardPage({ dashboardService, closingDay, dueDay }: DashboardServiceType & { closingDay: number; dueDay: number }) {
     return <Dashboard dashboardService={dashboardService} closingDay={closingDay} dueDay={dueDay} />
   }
   ```

7. **Add settings route** to the `<Routes>` block.

**Verification:** App loads without errors, config is loaded before rendering, Dashboard shows correct values.

---

## Task 13: Tests — ConfigRepositoryImpl

**Objective:** Write unit tests for config persistence.

**Files to create:**
- `src/infrastructure/repositories/__tests__/ConfigRepositoryImpl.test.ts`

**Test cases:**
1. `getSettings` returns defaults when no settings saved.
2. `saveSettings` then `getSettings` returns saved values.
3. `saveSettings` overwrites previous settings.
4. Uses separate in-memory DB instances (follow `PurchaseRepositoryImpl.test.ts` pattern with `new AppDatabase('TestDB_' + Date.now())`).

---

## Task 14: Tests — Edge Case Tests for First Installment Date Calculation

**Objective:** Verify the auto-calculation formula handles edge cases.

**Files to modify:**
- `src/application/services/__tests__/PurchaseService.test.ts`

**Additional test cases:**
1. `dueDay=31` in a 30-day month → JavaScript `new Date(2025, 3, 31)` rolls to May 1. Decide whether to clamp to month-end or accept JS behavior. **Recommended: accept JS behavior** (matches how credit cards work — if due date is 31 and month has 30 days, due date is the 1st of next month). Add a test documenting this.
2. `dueDay=29` in February non-leap year → same rollover behavior.
3. `dueDay=29` in February leap year → works correctly.
4. Purchase on closing day → next period, verify `firstInstallmentDate` matches next period's due date.
5. Purchase in December after closing day → next period is January next year, verify year rolls correctly.

---

## Task 15: Documentation — ArchitectureDecisionRecords.md

**Objective:** Record ADR-010 and ADR-011; update ADR-003.

**Files to modify:**
- `ArchitectureDecisionRecords.md`

**Additions:**

```
## ADR-010
Configurable Closing & Due Dates

## ADR-011
First Installment Date Auto-Calculation
```

**ADR-003 update:** Append a note:
```
Updated 2026-06-18: firstInstallmentDate is now auto-calculated from billing period + dueDay at purchase creation, rather than user-provided.
```

---

## Task 16: Documentation — UserGuide.md

**Objective:** Document the new Settings screen.

**Files to modify:**
- `UserGuide.md`

**Add section:**
- How to access Settings
- How to change Closing Day (auto-updates Due Day)
- How to change Due Day independently
- What happens when you change these settings (only affects new purchases)

---

## Implementation Order

```
Task 1  (CardSettings type)
  ↓
Task 2  (ConfigRepository interface)
  ↓
Task 3  (DB schema v2)
  ↓
Task 4  (ConfigRepositoryImpl) — depends on 1, 2, 3
  ↓
Task 5  (Remove config.ts) — depends on nothing; do anytime
  ↓
Task 6  (PurchaseService) — depends on 1 (CardSettings type)
  ↓
Task 7  (DashboardService)
  ↓
Task 8  (PurchaseForm) — depends on 6 (updated input types)
  ↓
Task 9  (Dashboard)
  ↓
Task 10 (Settings component)
  ↓
Task 11 (AppShell nav)
  ↓
Task 12 (App.tsx wiring) — depends on 4, 6, 7, 9, 10, 11
  ↓
Tasks 13–14 (Tests) — can run after 4 and 6 respectively
  ↓
Tasks 15–16 (Documentation) — can run last or in parallel
```

**Fast-track option (parallel tracks):**
- Track A (data): Tasks 1 → 2 → 3 → 4
- Track B (services): Task 5 → 6 → 7 (blocked on 1 for type import)
- Track C (UI): Tasks 8 → 9 → 10 → 11 (Task 8 blocked on 6 for input types)
- Merge point: Task 12 (depends on all previous)
- Quality: Tasks 13–14 (parallel, after 4 and 6)
- Docs: Tasks 15–16 (parallel, after all)
