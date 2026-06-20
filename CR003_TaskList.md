# CR-003 Implementation Task List

## Overview

Fix iOS PWA installation readiness gaps: replace SVG icons with PNG, add required iOS meta tags, and update the manifest. See [ChangeRequests-003.md](ChangeRequests-003.md) for full analysis.

**Do not implement code changes until explicitly authorized.** These tasks are for planning and estimation only.

---

## Task 1: Generate PNG Icons

| Field | Value |
|---|---|
| **Priority** | High |
| **Description** | Generate PNG icon files at required sizes: 180×180 (iPhone Retina), 152×152 (iPad), 120×120 (older iPhone), 192×192 (Chrome install), 512×512 (Chrome splash). Source from `public/icons.svg` or `public/favicon.svg`. |
| **Acceptance** | PNG files exist under `public/icons/` with correct dimensions. |

---

## Task 2: Update index.html — Apple Touch Icon & Meta Tags

| Field | Value |
|---|---|
| **Priority** | High |
| **Description** | Replace `apple-touch-icon` SVG link with PNG; add `apple-mobile-web-app-capable` meta tag. Optionally add device-specific `apple-touch-icon` sizes. |
| **Files** | `index.html` |
| **Acceptance** | iOS home screen icon displays correctly; PWA launches in standalone mode without URL bar on first visit. |

---

## Task 3: Update vite.config.ts — Manifest Icons & background_color

| Field | Value |
|---|---|
| **Priority** | High |
| **Description** | Replace SVG icon entry in manifest with PNG entries (192×192 and 512×512). Add `background_color` matching the app's background (`#ffffff`). |
| **Files** | `vite.config.ts` |
| **Acceptance** | Manifest serves PNG icons; Chrome shows install prompt; splash screen uses `background_color`. |

---

## Task 4: Verify Build Output

| Field | Value |
|---|---|
| **Priority** | Medium |
| **Description** | Run `npm run build` and inspect `dist/index.html` to confirm: manifest link, apple-touch-icon, and meta tags are correct. Verify `dist/manifest.webmanifest` contains PNG icons. Deploy and test on real iPhone via Safari's Share → Add to Home Screen. |
| **Acceptance** | PWA installs on iPhone with correct icon and standalone behavior. |

---

## Optional Task 5: Add Splash Screen Support (iOS)

| Field | Value |
|---|---|
| **Priority** | Low |
| **Description** | Generate `apple-touch-startup-image` PNGs for common iPhone sizes, add `<link>` tags with media queries in `index.html`. Requires ~10 portrait images. |
| **Acceptance** | PWA shows branded splash screen instead of white screen on cold launch. |

---

## Dependencies

- **Task 1** must be completed before **Tasks 2** and **3** (icons need to exist before they can be referenced).
- **Tasks 2** and **3** are independent of each other.
- **Task 4** depends on **Tasks 2** and **3**.
- **Task 5** is independent and optional.

## Verification

1. `npm run build` succeeds with no errors.
2. `dist/index.html` contains:
   - `<link rel="manifest" ...>` (maintained, already injected)
   - `<link rel="apple-touch-icon" ...>` pointing to PNG (not SVG)
   - `<meta name="apple-mobile-web-app-capable" content="yes">`
3. `dist/manifest.webmanifest` contains PNG icon entries with `image/png` type.
4. Manual test: deploy to HTTPS, open in Safari, tap Share → Add to Home Screen → verify icon and launch behavior.
