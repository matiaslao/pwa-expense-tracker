# CR-002 Implementation Task List

## Overview

Implement fixes for two issues: (1) Dashboard not refreshing after settings changes, and (2) incorrect due date auto-calculation. See [CR002_report.md](CR002_report.md) for full analysis.

---

## Task 1: Dashboard Refresh After Settings Changes

**Status:** Pending  
**Priority:** High  
**Problem:** `App.tsx` loads settings once on mount; saving new settings in `Settings.tsx` does not propagate to `Dashboard.tsx`.

### 1.1 Propagate saved settings from Settings to App

| Field | Value |
|---|---|
| **File** | `src/App.tsx` |
| **Description** | Add a `SettingsPage` wrapper that passes an `onSettingsChanged` callback to `<Settings>`. The callback updates the `settings` state in `AppRoutes`, causing downstream `useServices` to recompute with new `closingDay`/`dueDay`. |
| **Acceptance** | After saving settings, the `settings` state in `AppRoutes` holds the new values immediately. |

### 1.2 Update onSave type in Settings component

| Field | Value |
|---|---|
| **File** | `src/presentation/components/Settings.tsx` |
| **Description** | Change `onSave?: () => void` to `onSave?: (settings: CardSettings) => void`. Update `handleSubmit` to call `onSave?.({ closingDay, dueDay })` instead of `onSave?.()`. |
| **Acceptance** | `onSave` receives the new settings object when the form is submitted. |

### 1.3 Add settings props as Dashboard effect dependencies

| Field | Value |
|---|---|
| **File** | `src/presentation/components/Dashboard.tsx` |
| **Description** | Add `closingDay` and `dueDay` to the data-fetching `useEffect` dependency array alongside `dashboardService`. |
| **Acceptance** | Dashboard re-fetches current period summary when `closingDay` or `dueDay` props change, even if the service instance reference is identical. |

---

## Task 2: Due Date Auto-Calculation Fix

**Status:** Pending  
**Priority:** High  
**Problem:** `Math.min(num + 14, 28)` produces incorrect due dates across month boundaries.

### 2.1 Replace integer arithmetic with Date-based calculation

| Field | Value |
|---|---|
| **File** | `src/presentation/components/Settings.tsx` |
| **Description** | Replace `Math.min(num + 14, 28)` in `handleClosingDayChange` with JavaScript `Date` arithmetic: create a date for the closing day in the current month, add 14 days via `setDate()`, and extract the resulting day-of-month. |
| **Acceptance** | closingDay=20 → dueDay=4 (month boundary); closingDay=5 → dueDay=19 (within month); closingDay=25 in February → dueDay=11/12 (March). |

---

## Task 3: Testing

**Status:** Pending  
**Priority:** Medium  

### 3.1 Update existing Settings test

| Field | Value |
|---|---|
| **File** | `src/presentation/components/__tests__/Settings.test.tsx` |
| **Description** | Update test `updates due day when closing day changes` to expect calendar-based results instead of `Math.min(num+14, 28)`. |
| **Acceptance** | Existing test suite passes with corrected expectations. |

### 3.2 Add test: due day crosses month boundary

| Field | Value |
|---|---|
| **File** | `src/presentation/components/__tests__/Settings.test.tsx` |
| **Description** | Add test: closingDay=20 → dueDay=4 (in a 30-day month). |
| **Acceptance** | Test passes. |

### 3.3 Add test: due day stays within month

| Field | Value |
|---|---|
| **File** | `src/presentation/components/__tests__/Settings.test.tsx` |
| **Description** | Add test: closingDay=5 → dueDay=19. |
| **Acceptance** | Test passes. |

### 3.4 Add integration test: Dashboard refresh after settings change

| Field | Value |
|---|---|
| **File** | New integration test or `Dashboard.test.tsx` |
| **Description** | Integration test: save settings via `configRepository`, navigate, verify Dashboard re-fetches with new closingDay. |
| **Acceptance** | Test passes. |

---

## Dependencies

- **Task 1.2** must be completed before **Task 1.1** (onSave type must accept settings first).
- **Task 2.1** must be completed before **Tasks 3.1–3.3** (tests must match new logic).
- All other tasks are independent or have leaf dependencies.

## Verification

1. Run `npm test` — all existing unaffected tests pass; updated/new tests pass.
2. Run `npm run build` — no TypeScript or build errors.
3. Manual check: change closing day in settings, navigate to dashboard, confirm correct billing period shown.
