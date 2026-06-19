# Production Error Report

## Error

Blank page after deployment. React error #310:

> Rendered more hooks than during the previous render.

## Root Cause

`src/App.tsx` — The custom hook `useServices` (containing `useRef`) was called **after** a conditional early return in `AppRoutes`:

```
useState      ← hook #1
useState      ← hook #2
useEffect     ← hook #3
if (!settings) return <Loading />   ← early return skips hook #4
useRef        ← hook #4 (never reached on first render)
```

First render: 3 hooks → early return.
Second render (settings loaded): 4 hooks.
React detects the count mismatch and throws error #310.

## Fix Applied

**File:** `src/App.tsx`

Two changes:

1. **`useServices`** — Replaced `useRef`-based singleton pattern with `useMemo`, keyed on `settings.closingDay`, `settings.dueDay`, and `configRepo`. This ensures services are correctly recreated when actual settings load from IndexedDB.

2. **`AppRoutes`** — Moved the `useServices` call **before** the conditional early return by providing fallback default settings. The actual loaded settings are still used for the loading guard and passed to child components.

```typescript
const defaultSettings: CardSettings = { closingDay: 15, dueDay: 29 }
const currentSettings = settings ?? defaultSettings
const { purchaseService, dashboardService, configRepository } = useServices(currentSettings, configRepo)

if (!settings) {
  return <Typography>Loading...</Typography>
}
```

## Verification

- `npm run build` — passes (TypeScript + Vite)
- `npx vitest run` — 121/121 tests pass across 12 test files
- Hook order is now stable across all renders: `useState` → `useState` → `useEffect` → `useRef` (inside `useMemo` via `useServices`)
