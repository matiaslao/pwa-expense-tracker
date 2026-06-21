# CR-006 — MVP Completion and UX Improvements

## CR-006.1 — Bottom Navigation Usability

### Impacted Business Rules
| Rule | Source | Impact |
|------|--------|--------|
| — | — | **None.** Pure UI/CSS change. No business logic is affected. |

### Impacted Data Model
**None.** No entity, interface, or schema changes.

### Impacted UI Screens
| Component | Impact |
|-----------|--------|
| `BottomNavigation` or `MainLayout` | Add safe-area padding (`env(safe-area-inset-bottom)`) and increased bottom margin. Touch targets should be ≥44px per mobile UX guidelines. |

### Impacted Tests
| File | Impact |
|------|--------|
| `BottomNavigation.test.tsx` | Verify rendered element has sufficient bottom padding / safe-area class. |

### Required Specification Updates
**None.** ProductSpecification.md does not define bottom navigation behavior.

### Required ADR Updates
**None.** Minor UI-only change; no architectural decision needed.

---

## CR-006.2 — Active Purchases Sorting

### Impacted Business Rules
| Rule | Source | Impact |
|------|--------|--------|
| Active purchase fetching | `DashboardService.getActivePurchases()` | **Modified** — results must be sorted by `purchase.date` descending. |
| Display rules (ProductSpecification core rules) | ProductSpecification.md | **New rule** to add: `"Active purchases are sorted by purchase date descending"` |

### Impacted Data Model
**None.** Sorting is a query-layer change only.

### Impacted UI Screens
| Component | Impact |
|-----------|--------|
| `ActivePurchases.tsx` | **Indirect** — sorting happens in service; component just renders pre-sorted data. No structural change. |
| `DashboardService.ts` or `ActivePurchasesService.ts` | Add `.sort((a, b) => b.date - a.date)` after fetching. |

### Impacted Tests
| File | Impact |
|------|--------|
| `DashboardService.test.ts` or `ActivePurchasesService.test.ts` | Verify sort order: newest first. Add a purchase with earlier date, verify it appears after a later-dated purchase. |
| `ActivePurchases.test.tsx` | Verify rendered list order matches descending date. |

### Required Specification Updates
**ProductSpecification.md** — Core Business Rules: add line:
```
- Active purchases are sorted by purchase date in descending order (newest first)
```

### Required ADR Updates
**None.** Not an architectural decision; it's a straightforward sorting rule.

---

## CR-006.3 — Automatic Cleanup of Inactive Purchases

### Impacted Business Rules
| Rule | Source | Impact |
|------|--------|--------|
| Active purchase definition | ProductSpecification.md: `"Active purchase = remaining installments > 0"` | **Modified** — a purchase with 0 remaining installments should also be removed from the database entirely. |
| Previous period summary (ADR-015) | ADR-015, recompute approach | **Invalidated** — the recompute approach filters *all* purchases by billing period. If purchases are physically deleted, period summaries lose data. |
| Current period calculations | DashboardService | **Must remain correct** — purchases that complete in the current period must still be counted until the deletion point. |
| Purchase lifecycle | — | **New rule** — when `getRemainingInstallments().length === 0`, schedule/trigger automatic deletion at a safe point after the period closes. |

### Impacted Data Model

**Required: PeriodSnapshot storage.** Because ADR-015 currently recomputes `PreviousPeriodSummary` from raw purchases at display time, deleting completed purchases would corrupt that summary. Options:

| Option | Description | Verdict |
|--------|-------------|---------|
| **A — Soft delete** | Add `isArchived: boolean` to `Purchase` entity. Exclude archived from Active Purchases; include them in period queries. | **Simplest.** No snapshot infrastructure. Keeps all data. Minor storage cost (acceptable for single-user MVP). |
| **B — Period snapshots** | Persist aggregated `PeriodSnapshot` per billing period before deleting purchases. | More complex. Requires new IndexedDB table, detection logic, edge case handling (app not opened on closing date). ADR-005 already rejected snapshots for similar reasons. |
| **C — Retention window** | Delete only after N days past the period due date. | Still breaks recompute if deletion occurs. |

**Recommendation: Option A (soft delete).** Add `isArchived` field to `Purchase`, exclude archived purchases from `getActivePurchases()`, keep including them in billing period aggregates.

```typescript
// Purchase interface — new field
export interface Purchase {
  // ...existing fields...
  isArchived: boolean  // defaults to false
}
```

```typescript
// DashboardService — updated queries
async getActivePurchases(): Promise<Purchase[]> {
  const all = await this.purchaseRepository.findAll()
  return all.filter(p => !p.isArchived && p.getRemainingInstallments().length > 0)
  // sorted per CR-006.2
}

async getPurchasesForPeriod(period: BillingPeriod): Promise<Purchase[]> {
  const all = await this.purchaseRepository.findAll()
  return all.filter(p => p.belongsTo(period))  // includes archived
}
```

When to archive: after each installment is "processed" (i.e., when generating installments dynamically, if remaining installments is 0, set `isArchived = true`). Can happen on app startup scan or on save.

**BillingPeriod ADR-015 impact:** ADR-015's recompute approach remains viable *only if purchases are soft-deleted*. If hard-delete is required, ADR-015 must be reverted in favor of snapshots.

### Impacted UI Screens
| Component | Impact |
|-----------|--------|
| `ActivePurchases.tsx` | No longer sees completed/archived purchases (AC-001). No UI change needed — filtering happens in service. |
| `Dashboard.tsx` | **No change** — Current Period and Previous Period summaries continue to include archived purchases (AC-002, AC-003). |

### Impacted Tests
| File | Impact |
|------|--------|
| `DashboardService.test.ts` | New tests: verify `getActivePurchases()` excludes archived purchases. |
| `DashboardService.test.ts` | New tests: verify period summaries include archived purchases. |
| `DashboardService.test.ts` | Verify archiving happens when remaining installments reaches 0. |
| `Purchase.test.ts` | Unit test for archiving logic. |
| `ActivePurchases.test.tsx` | Verify no archived purchases rendered. |
| `Dashboard.test.tsx` | Verify period totals include archived purchases (regression guard). |

### Required Specification Updates
**ProductSpecification.md** — Core Business Rules:
- Change line: `"Active purchase = remaining installments > 0"` to include archiving: `"Active purchase = remaining installments > 0 and not archived"`
- Add: `"Completed purchases (remaining installments = 0) are automatically archived"`
- Add: `"Archived purchases are excluded from Active Purchases but included in billing period summaries"`

### Required ADR Updates
**ADR-003 (Installments generated dynamically):** Add note that dynamic generation now triggers archiving when remaining = 0.

**ADR-015 (Previous Period Summary):** Add note about the interaction with CR-006.3:
- If soft-delete is chosen: ADR-015 is compatible; add a note that period summaries include archived purchases.
- If hard-delete is chosen: ADR-015 must be updated to use period snapshots instead of recompute.

**New ADR-016: Automatic Purchase Archiving**
```
## ADR-016
Automatic Purchase Archiving

*Context: Completed purchases (remaining installments = 0) must be removed from 
Active Purchases but their data must remain available for Current Period and 
Previous Period summaries. Physical deletion would corrupt period summaries 
computed via the recompute approach (ADR-015).*

*Decision: Add an `isArchived: boolean` field to the Purchase entity (soft delete). 
Archived purchases are excluded from `getActivePurchases()` queries but included in 
billing period aggregate queries. Archiving is triggered when dynamic installment 
generation detects 0 remaining installments. No new IndexedDB table or snapshot 
infrastructure is required.*

*Rationale: Minimal schema change (one boolean field), no new repositories or 
tables, preserves compatibility with ADR-015's recompute approach, all existing 
queries continue to work with minor filter adjustments.*
```

---

## CR-006.4 — Application Icon Redesign

### Impacted Business Rules
**None.**

### Impacted Data Model
**None.**

### Impacted UI Screens
**None (code).** Icon assets in `public/` directory must be replaced:
- `public/favicon.ico`
- `public/icon-192x192.png`
- `public/icon-512x512.png`
- `public/apple-touch-icon.png`
- `public/pwa-*.png` (if any)

`vite.config.ts` or `vite-plugin-pwa` config references must be verified to point to the correct new icon files.

### Impacted Tests
**None.** Icons are static assets; no tests assert on icon content.

### Required Specification Updates
**None.** ProductSpecification.md does not define icon design.

### Required ADR Updates
**None.**

---

## CR-006.5 — Localization to Argentinian Spanish

### Impacted Business Rules
| Rule | Source | Impact |
|------|--------|--------|
| Currency formatting | — | **New rule** — amounts formatted as `ARS 125.500,75` (period for thousands, comma for decimals) |
| Date formatting | — | **New rule** — dates formatted as `DD/MM/YYYY` |
| UI language | — | **New rule** — all user-visible text in `es-AR` |

No existing business rules conflict with these changes.

### Impacted Data Model
**None.** Formatting is a presentation-layer concern. However, a localized string approach (e.g., a `strings.json` or React i18n setup) may be introduced at the infrastructure layer.

### Impacted UI Screens
**All screens** — Every component with user-visible text must be translated:
| Component | Impact |
|-----------|--------|
| `Dashboard.tsx` | "Dashboard" → "Resumen", "Current Period" → "Período Actual", "Previous Period" → "Período Anterior", "Due Date" → "Fecha de Vencimiento", "Closing Date" → "Fecha de Cierre", "Amount Due" → "Monto Adeudado", etc. |
| `ActivePurchases.tsx` | "Active Purchases" → "Compras Activas", "No active purchases" → "No hay compras activas", etc. |
| `FutureCommitments.tsx` | "Future Commitments" → "Compromisos Futuros", etc. |
| `Settings.tsx` | "Settings" → "Configuración", "Closing Day" → "Día de Cierre", "Due Day" → "Día de Vencimiento", "Save" → "Guardar", etc. |
| `PurchaseForm.tsx` | "Add Purchase" → "Agregar Compra", "Description" → "Descripción", "Amount" → "Monto", "Installments" → "Cuotas", "Save" → "Guardar", "Cancel" → "Cancelar", etc. |
| `App.tsx` / navigation | "Dashboard" → "Resumen", "Purchases" → "Compras", "Future" → "Futuro", "Settings" → "Configuración" |
| All error/empty states | Translate all messages |
| `formatCurrency()` utility | Modify to use `es-AR` locale: `new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' })` |
| `formatDate()` utility | Modify to use `DD/MM/YYYY` format: either `Intl.DateTimeFormat('es-AR')` or manual `dd/mm/yyyy` |

### Impacted Tests
| File | Impact |
|------|--------|
| `Dashboard.test.tsx` | Update assertions from English text → Spanish text |
| `ActivePurchases.test.tsx` | Update text assertions → Spanish |
| `FutureCommitments.test.tsx` | Update text assertions → Spanish |
| `Settings.test.tsx` | Update text assertions → Spanish |
| `PurchaseForm.test.tsx` | Update text assertions → Spanish |
| `formatCurrency.test.ts` (if exists) | Update expected output for `es-AR` locale |
| `formatDate.test.ts` (if exists) | Update expected format to `DD/MM/YYYY` |
| Any test asserting on English strings | **All must be updated** |

### Required Specification Updates
**ProductSpecification.md** — MVP Scope / Included:
- Change line: `"ARS currency only"` → `"ARS currency only, formatted for es-AR locale"`
- Add: `"Argentinian Spanish (es-AR) localization"`
- Add core rules for currency/date formatting under **Core Business Rules**:
  ```
  - Currency formatted using es-AR conventions: ARS 125.500,75
  - Dates formatted as DD/MM/YYYY
  ```

### Required ADR Updates
**New ADR-017: Argentinian Spanish Localization**
```
## ADR-017
Argentinian Spanish Localization

*Context: The app targets Argentinian users. All UI text was in English; currency 
used US formatting (125,500.75); dates used YYYY-MM-DD format.*

*Decision: Localize all user-visible strings to es-AR. Use Intl.NumberFormat with 
'es-AR' locale for currency. Use Intl.DateTimeFormat with 'es-AR' or manual 
DD/MM/YYYY formatting for dates. For UI strings, use a simple key-value map 
(strings.ts) rather than a full i18n framework — the app only supports one locale 
and has no plans for multi-language support.*

*Rationale: Built-in Intl APIs cover formatting. A lightweight string map avoids 
i18n framework dependency. Single-locale constraint keeps complexity low. All 
formatting changes are in the presentation layer — no business logic changes.*
```

---

## Cross-Cutting Concerns & Dependencies

| Dependency | Detail |
|------------|--------|
| CR-006.2 → CR-006.3 | Sorting and archiving both affect `getActivePurchases()`. Implement filter (archived) first, then sort. |
| CR-006.3 → ADR-015 | ADR-015 recompute approach requires soft-delete (Option A) to remain valid. If hard-delete is mandated, ADR-015 must be reverted. |
| CR-006.5 → All tests | A significant portion of test assertions reference English strings and must be updated. |

---

## Proposed Implementation Tasks

### Task 1 — Bottom Navigation Safe Area Padding
- **Files:** `src/presentation/components/BottomNavigation.tsx` or `MainLayout.tsx`
- **Work:** Add `padding-bottom: env(safe-area-inset-bottom)` and increase bottom margin. Ensure touch targets ≥44px.
- **Tests:** Verify padding class in rendered output.

### Task 2 — Active Purchases Descending Sort
- **Files:** `src/application/services/DashboardService.ts` (or relevant service)
- **Work:** Add `.sort((a, b) => b.date.getTime() - a.date.getTime())` after fetching active purchases.
- **Tests:** Add sort-order assertions to service tests and component tests.

### Task 3 — Add `isArchived` Field to Purchase Interface
- **Files:** `src/domain/entities/Purchase.ts`
- **Work:** Add `isArchived: boolean` with default `false`.
- **Tests:** Update entity factory/builder in tests; verify serialization.

### Task 4 — Implement Archiving Logic
- **Files:** `src/domain/services/InstallmentService.ts` or wherever dynamic installment generation lives.
- **Work:** When `getRemainingInstallments().length === 0`, set `purchase.isArchived = true` and persist.
- **Tests:** Verify purchase is archived when remaining = 0; verify not archived when > 0.

### Task 5 — Update Active Purchases Query to Exclude Archived
- **Files:** `src/application/services/DashboardService.ts`
- **Work:** Add `!p.isArchived` filter to `getActivePurchases()`.
- **Tests:** Verify archived purchases excluded from Active Purchases but included in period summaries.

### Task 6 — Replace Application Icon Assets
- **Files:** `public/*.png`, `public/favicon.ico`, `public/apple-touch-icon.png`
- **Work:** Replace with credit-card/finance-themed icons. Update `vite.config.ts` / PWA manifest references if paths changed.
- **Tests:** Manual verification on iPhone home screen.

### Task 7 — Implement Localization String Map
- **Files:** New `src/presentation/strings.ts`
- **Work:** Create `Strings` object with all user-facing text in es-AR. Export typed keys.

### Task 8 — Apply Localized Strings Across All Components
- **Files:** `Dashboard.tsx`, `ActivePurchases.tsx`, `FutureCommitments.tsx`, `Settings.tsx`, `PurchaseForm.tsx`, `App.tsx` (navigation labels)
- **Work:** Replace all hardcoded English strings with `Strings.DASHBOARD_TITLE`, `Strings.ACTIVE_PURCHASES_TITLE`, etc.
- **Tests:** Update test assertions to use Spanish strings.

### Task 9 — Update Currency Formatting to es-AR
- **Files:** `src/presentation/utils/formatCurrency.ts` or similar
- **Work:** Use `new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' })`.
- **Tests:** Verify output is `ARS 125.500,75` format.

### Task 10 — Update Date Formatting to DD/MM/YYYY
- **Files:** `src/presentation/utils/formatDate.ts` or similar
- **Work:** Use `Intl.DateTimeFormat('es-AR')` or manual `dd/mm/yyyy` formatting.
- **Tests:** Verify output matches `15/07/2026` format.

### Task 11 — Update ProductSpecification.md
- **Work:** Add rules for sorting, archiving, localization, currency/date formatting.

### Task 12 — Update ArchitectureDecisionRecords.md
- **Work:** Add ADR-016 (archiving) and ADR-017 (localization). Update ADR-015 with compatibility note.

### Task 13 — Update All Test Assertions for Spanish Text
- **Files:** All `*.test.tsx` and `*.test.ts` files that assert on English text.
- **Work:** Replace English string assertions with Spanish equivalents.

### Task 14 — Full Verification
- **Work:** `npm run build && npm test`. Verify no TypeScript errors, all tests pass, no English text remains.
