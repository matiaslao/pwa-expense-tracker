# CR-003: iOS PWA Installation Readiness

## Task

Analyze and document gaps in the current PWA configuration for iOS (iPhone) installation readiness, and propose remediation tasks.

## Verification Results

### 1. Manifest Injection — PASS

The build output at `dist/index.html` confirms `vite-plugin-pwa` properly injects the manifest link:

```html
<link rel="manifest" href="/pwa-expense-tracker/manifest.webmanifest">
```

### 2. Manifest Content — PASS (partial)

| Field | Current Value | iOS Support | Status |
|---|---|---|---|
| `name` | "Credit Card Expense Tracker" | ✅ Supported since iOS 11.3 | OK |
| `short_name` | "ExpenseTracker" | ✅ Supported since iOS 11.3 | OK |
| `display` | `"standalone"` | ✅ Supported since iOS 11.3 | OK |
| `scope` | `"/"` | ✅ Supported since iOS 11.3 | OK |
| `start_url` | `"/"` | ✅ Supported since iOS 11.3 | OK |
| `theme_color` | `"#1976d2"` | ✅ Supported since iOS 15.0 | OK |
| `orientation` | `"portrait"` | ❌ Not supported on iOS | No-op (harmless) |
| `background_color` | Not set | ✅ Supported | **Missing** |
| `icons` | Only 192×192 SVG | ❌ SVG not supported; needs PNG | **FAIL** |

### 3. iOS-Specific Requirements — GAPS FOUND

#### Gap A: Home Screen Icon Format

The `<link rel="apple-touch-icon">` in `index.html` points to `favicon.svg`.

**Problem:** iOS does not support SVG icons for the home screen. It requires a PNG image — ideally 180×180 for iPhone Retina display (3×). Without a valid PNG icon, the home screen shortcut will use a screenshot thumbnail or a blank icon.

| Source | Requirement |
|---|---|
| Apple HIG | 180×180 PNG (iPhone Retina 6+) |
| Best practice | Also provide 152×152 (iPad), 120×120 (older iPhone) |

#### Gap B: Missing `apple-mobile-web-app-capable` Meta Tag

The `index.html` does not include this tag. While `display: standalone` in the manifest covers this since iOS 11.3, the meta tag is still required for:

- **Splash screen support** — `apple-touch-startup-image` only works when this meta tag is present.
- **Fallback** — Pre-iOS 11.3 devices and scenarios where the manifest fails to load (network issue, first visit).

#### Gap C: Manifest Icons Array Uses SVG

The manifest `icons` array contains only `{ src: '/favicon.svg', sizes: '192x192', type: 'image/svg+xml' }`.

**Problems:**
- iOS ignores manifest icons entirely before iOS 15.4 (uses `apple-touch-icon` instead).
- Even after iOS 15.4, SVG icons are not supported — only PNG works.
- Chrome/Android requires at least 192×192 and 512×512 PNG icons for the install prompt.

#### Gap D: Splash Screen (Optional)

iOS does not support manifest-generated splash screens. It requires `apple-touch-startup-image` `<link>` tags for every device size. Implementing this fully requires generating ~10 portrait images for different iPhone/iPad sizes.

This is considered **optional** for MVP — the app already works, it just shows a white screen briefly during launch.

### 4. Summary of Gaps

| # | Issue | Severity | Effort |
|---|---|---|---|
| A | Home screen icon is SVG, not PNG | **High** — Without this, the PWA icon looks broken on iPhone | Small |
| B | Missing `apple-mobile-web-app-capable` meta tag | **Medium** — Falls back gracefully on modern iOS, but needed for splash screens | Small |
| C | Manifest icons array uses SVG with no PNG fallback | **High** — Affects installability on Chrome/Android and icon display | Small |
| D | No splash screen images | **Low** — Cosmetic; white screen on cold start | Large |

### 5. Affected Files

| File | Change Required |
|---|---|
| `index.html` | Replace SVG `apple-touch-icon` with PNG; add `apple-mobile-web-app-capable` meta |
| `vite.config.ts` | Update manifest `icons` to use PNG; add `background_color` |
| `public/favicon.svg` | Replace with or complement with PNG icon files |
| — (new) | Generate PNG icons at 180×180, 192×192, 512×512, and optionally 152×152, 120×120 |

### 6. Test Impact

No test impact — all changes are static asset and markup changes only.
