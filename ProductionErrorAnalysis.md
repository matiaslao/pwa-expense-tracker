# Production Error Analysis

## Error

Blank page on deploy. Production console error: `React error #310`.

> React error #310 = "Rendered more hooks than during the previous render."

## Root Cause

**File:** `src/App.tsx` — `AppRoutes` component (line 114)

The custom hook `useServices` (line 26, which calls `useRef` internally) is invoked **after** a conditional early return:

```typescript
function AppRoutes() {
  const [settings, setSettings] = useState<CardSettings | null>(null)    // hook #1
  const [configRepo] = useState(() => new ConfigRepositoryImpl())         // hook #2

  useEffect(() => {                                                        // hook #3
    configRepo.getSettings().then(setSettings)
  }, [configRepo])

  if (!settings) {                                                         // ← conditional early return
    return <Typography sx={{ p: 2, textAlign: 'center' }}>Loading...</Typography>
  }

  const { purchaseService, dashboardService, configRepository } = useServices(settings, configRepo)  // hook #4 (useRef)
  // ...
}
```

### Render sequence:

| Render | `settings` | Hooks called | Hook count |
|--------|-----------|-------------|------------|
| 1st | `null` | `useState`(×2), `useEffect` → **early return** | **3** |
| 2nd (async load completes) | `{ closingDay: 15, dueDay: 29 }` | `useState`(×2), `useEffect`, **`useServices` → `useRef`** | **4** |

On the second render, an additional hook (`useRef` inside `useServices`) is called that was not present in the first render. React detects the mismatch and throws error #310.

## Why it passes TypeScript / build

This is a runtime hook-ordering violation. TypeScript cannot statically detect that a function containing `useRef` is called conditionally when it's invoked from another function. The build (`tsc -b`) compiles successfully; the error only appears in the browser.

## Fix (do not implement)

Move the `useServices` call **before** the conditional return so hooks are always called in the same order:

```typescript
function AppRoutes() {
  const [settings, setSettings] = useState<CardSettings | null>(null)
  const [configRepo] = useState(() => new ConfigRepositoryImpl())

  useEffect(() => {
    configRepo.getSettings().then(setSettings)
  }, [configRepo])

  // Call useServices unconditionally — provide fallback settings
  const defaultSettings: CardSettings = { closingDay: 15, dueDay: 29 }
  const currentSettings = settings ?? defaultSettings
  const { purchaseService, dashboardService, configRepository } = useServices(currentSettings, configRepo)

  if (!settings) {
    return <Typography sx={{ p: 2, textAlign: 'center' }}>Loading...</Typography>
  }
  // ...
}
```

This ensures `useServices` (via its internal `useRef`) is always called the same number of times on every render, regardless of whether `settings` has loaded.

## Unaffected files

- `src/main.tsx` — No hooks, no conditional logic. Innocent.
- `src/presentation/components/Dashboard.tsx` — Hooks (`useState`, `useEffect`) are all called unconditionally at the top of the component. Correct.
