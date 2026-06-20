# CR-002 Analysis Report

## Task

Analyze and document the impact of CR-002 on the existing codebase.

## Objective

Address two problems:

1. **Problem 1:** Dashboard does not refresh after settings changes (closing day, due day).
2. **Problem 2:** Due date auto-calculation is incorrect when closing day + 14 exceeds the current month length.

## Problem 1 — Dashboard Does Not Refresh After Settings Changes

### Root Cause

The settings state in `AppRoutes` (`src/App.tsx:113`) is loaded **once** on component mount:

```typescript
const [settings, setSettings] = useState<CardSettings | null>(null)

useEffect(() => {
  configRepo.getSettings().then(setSettings)
}, [configRepo])
```

`configRepo` is created via `useState` initializer and never changes, so this effect runs exactly once.

When the user:

1. Navigates to `/settings`
2. Modifies closing day / due day and clicks Save
3. `Settings.tsx` calls `configRepository.saveSettings()` (writes to IndexedDB) then `onSave()` (navigates to `/`)
4. `AppRoutes` re-renders, but its `settings` state still holds the **old** values

Since `useServices` (`App.tsx:26`) uses `useMemo` with deps `[settings.closingDay, settings.dueDay, configRepo]`, and none of these have changed, the **same** `dashboardService` and `purchaseService` instances are returned.

The Dashboard component's data-fetching `useEffect` depends on `[dashboardService]` (`Dashboard.tsx:34`). Since the service instance is identical, the effect does **not** re-run. The old `closingDay` is used in `calculateBillingPeriod()`, potentially computing the wrong current billing period.

### Impact

| Scenario | Observed Behavior |
|---|---|
| Change closing day from 15 to 25 on June 20 | Dashboard still shows July period (closing=15) instead of June period (closing=25) |
| Change due day display | Dashboard still shows old due day ordinal |
| Period-relative total | Incorrect because the wrong billing period is queried |

Data remains stale until full browser page reload.

### Affected Files

| File | Role |
|---|---|
| `src/App.tsx` | Settings state never refreshed after save |
| `src/presentation/components/Settings.tsx` | No mechanism to propagate saved settings to parent |
| `src/presentation/components/Dashboard.tsx` | `useEffect` does not re-run when settings change |

### Required Modifications

**`src/App.tsx`** — Add a settings-refresh mechanism:

- Provide `SettingsPage` with a callback to update the `settings` state after a successful save.
- Options:
  a. Pass a `refreshSettings` callback that re-reads from `configRepo.getSettings()`.
  b. Pass an `onSettingsChanged` callback that receives the new `CardSettings` directly.

```typescript
// Option (b) — direct propagation (simplest):
function SettingsPage({ configRepository, onSettingsChanged }: { configRepository: ConfigRepository; onSettingsChanged: (s: CardSettings) => void }) {
  const navigate = useNavigate()
  return (
    <Settings
      configRepository={configRepository}
      onSave={(settings: CardSettings) => {
        onSettingsChanged(settings)
        navigate('/')
      }}
      onCancel={() => navigate('/')}
    />
  )
}
```

**`src/presentation/components/Settings.tsx`** — Adjust `onSave` type to pass saved settings:

- Change `onSave?: () => void` to `onSave?: (settings: CardSettings) => void`
- In `handleSubmit`, call `onSave?.({ closingDay: closingNum, dueDay: dueNum })` instead of `onSave?.()`

**`src/presentation/components/Dashboard.tsx`** — Add `closingDay` and `dueDay` as `useEffect` dependencies:

```typescript
useEffect(() => {
  dashboardService.getCurrentPeriodSummary().then((result) => {
    setSummary(result)
    setLoading(false)
  })
}, [dashboardService, closingDay, dueDay])
```

This ensures the Dashboard re-fetches when props change, even if the service instance is the same.

---

## Problem 2 — Due Date Auto-Calculation Incorrect

### Root Cause

In `src/presentation/components/Settings.tsx:37`, the due day auto-fill uses simple integer arithmetic with an arbitrary cap:

```typescript
const defaultDue = Math.min(num + 14, 28)
```

This is incorrect because:

- Adding 14 to a day number can exceed the current month's length (e.g., 20 + 14 = 34, should roll to next month)
- Cap at 28 loses precision for months with 29-31 days
- Does not account for variable month lengths (28, 29, 30, 31)

The CR requires real calendar arithmetic where dates spanning month boundaries are displayed in `day/month` format.

### CR Examples

| Closing Date | Expected Due Date |
|---|---|
| 20/6 (June 20) | 4/7 (July 4) |
| 25/6 (June 25) | 8/7 (July 8) |

### Affected Files

| File | Lines | Code |
|---|---|---|
| `src/presentation/components/Settings.tsx` | 33-40 | `handleClosingDayChange` using `Math.min(num + 14, 28)` |

### Required Modifications

**`src/presentation/components/Settings.tsx`** — Replace the integer arithmetic with JavaScript `Date` arithmetic:

```typescript
const handleClosingDayChange = (value: string) => {
  setClosingDay(value)
  const num = parseInt(value, 10)
  if (!isNaN(num) && num >= 1 && num <= 31) {
    const now = new Date()
    const closingDate = new Date(now.getFullYear(), now.getMonth(), num)
    closingDate.setDate(closingDate.getDate() + 14)
    const defaultDue = closingDate.getDate()
    setDueDay(defaultDue.toString())
  }
}
```

`setDate()` with overflow handles month rollover automatically via JavaScript's built-in calendar arithmetic.

---

## Test Impact Analysis

### Existing Tests That Should Still Pass

| Test File | Status |
|---|---|
| `src/application/services/__tests__/DashboardService.test.ts` | Unaffected — mocks repository and constructs service directly |
| `src/application/services/__tests__/PurchaseService.test.ts` | Unaffected — constructs service with explicit `dueDay` |
| `src/domain/services/__tests__/BillingPeriodCalculator.test.ts` | Unaffected |
| `src/domain/entities/__tests__/Purchase.test.ts` | Unaffected |
| `src/infrastructure/repositories/__tests__/ConfigRepositoryImpl.test.ts` | Unaffected |
| `src/presentation/components/__tests__/Dashboard.test.tsx` | May need update — test renders with explicit props, unaffected by logic change |
| `src/presentation/components/__tests__/Settings.test.tsx` | **Will break** — test `updates due day when closing day changes` currently expects `Math.min(num+14, 28)` behavior |

### Tests to Add

| Test | Description |
|---|---|
| **Settings: due day crosses month boundary** | closingDay=20 → dueDay=4 (in a 30-day month) |
| **Settings: due day stays within month** | closingDay=5 → dueDay=19 |
| **Dashboard: refreshes after settings change** | Integration test: save settings, verify Dashboard re-fetches |
| **DashboardService: closingDay change affects current period** | Verify different `closingDay` produces different current period |

---

## Architecture Compliance

All proposed modifications comply with the existing architecture rules:

| Rule | Compliance |
|---|---|
| Clean Architecture layers | Presentation changes only (Settings.tsx, Dashboard.tsx, App.tsx) |
| No business logic in UI | Due date display is a UI convenience, not business logic |
| Persistence through repositories | Settings save already uses `ConfigRepository` |
| No forbidden dependencies | No new imports added |

---

## Summary of Changes Required

| File | Change Type | Description |
|---|---|---|
| `src/App.tsx` | Modify | Add settings refresh propagation after save |
| `src/presentation/components/Settings.tsx` | Modify | Use real date arithmetic; pass settings in `onSave` |
| `src/presentation/components/Dashboard.tsx` | Modify | Add `closingDay`, `dueDay` to `useEffect` deps |
| `src/presentation/components/__tests__/Settings.test.tsx` | Modify | Update due-day calculation test expectations |
| — | New test | Settings month-boundary due day |
| — | New test | Dashboard refresh integration |
