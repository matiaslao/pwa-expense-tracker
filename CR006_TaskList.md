# CR-006 Implementation Task List

## Overview

MVP completion and UX improvements: bottom navigation usability, active purchases sorting, automatic cleanup of inactive purchases, application icon redesign, and localization to Argentinian Spanish. See [ChangeRequestAnalysis-006.md](ChangeRequestAnalysis-006.md) for full analysis.

---

## Task 1: Bottom Navigation Safe Area Padding

| Field | Value |
|---|---|
| **Status** | Pending |
| **Priority** | High |
| **File** | `src/presentation/components/AppShell.tsx` |
| **Description** | Add `padding-bottom: env(safe-area-inset-bottom)` to the `BottomNavigation` and increase bottom margin. Ensure touch targets ≥44px per mobile UX guidelines. |
| **Acceptance** | Navigation icons are easily tappable, do not touch the bottom screen edge, and respect mobile safe areas (AC-001, AC-002, AC-003). |

---

## Task 2: Active Purchases Descending Sort

| Field | Value |
|---|---|
| **Status** | Pending |
| **Priority** | High |
| **File** | `src/application/services/DashboardService.ts` |
| **Description** | Add `.sort((a, b) => b.purchaseDate.getTime() - a.purchaseDate.getTime())` after fetching active purchases in `getActivePurchases()`. |
| **Acceptance** | Purchases are sorted by Purchase Date descending (newest first). Adding a new purchase places it at the top. Editing a purchase date updates its position appropriately (AC-001, AC-002, AC-003). |

---

## Task 3: Add `isArchived` Field to Purchase Entity

| Field | Value |
|---|---|
| **Status** | Pending |
| **Priority** | High |
| **File** | `src/domain/entities/Purchase.ts` |
| **Description** | Add `isArchived: boolean` to `PurchaseProps` interface and `Purchase` class with default `false`. Update the constructor to accept/initialize it. |
| **Acceptance** | Purchase entity supports archiving; existing tests pass without modification (field has a default). |

---

## Task 4: Implement Archiving Logic

| Field | Value |
|---|---|
| **Status** | Pending |
| **Priority** | High |
| **File** | `src/domain/entities/Purchase.ts` |
| **Description** | After dynamic installment generation, when `getRemainingInstallments(0).length === 0`, set `isArchived = true`. Persist the change via repository on save. |
| **Acceptance** | Purchases with 0 remaining installments are automatically archived; purchases with remaining installments > 0 are not archived. |

---

## Task 5: Update Active Purchases Query to Exclude Archived

| Field | Value |
|---|---|
| **Status** | Pending |
| **Priority** | High |
| **File** | `src/application/services/DashboardService.ts` |
| **Description** | Add `!p.isArchived` filter to `getActivePurchases()`. Period summary methods (current and previous) must still include archived purchases. |
| **Acceptance** | Archived purchases excluded from Active Purchases but included in Current Period and Previous Period summaries (AC-001, AC-002, AC-003, AC-004). |

---

## Task 6: Replace Application Icon Assets

| Field | Value |
|---|---|
| **Status** | Pending |
| **Priority** | Medium |
| **Files** | `public/icons/icon-120.png`, `public/icons/icon-152.png`, `public/icons/icon-180.png`, `public/icons/icon-192.png`, `public/icons/icon-512.png` |
| **Description** | Replace all icon PNGs with credit-card/finance-themed design. Update `vite.config.ts` manifest references if icon paths change. |
| **Acceptance** | Icon clearly communicates finance and credit card management; recognizable at mobile home screen sizes; included in PWA manifest (AC-001, AC-002, AC-003). |

---

## Task 7: Create Localization String Map

| Field | Value |
|---|---|
| **Status** | Pending |
| **Priority** | High |
| **File** | New `src/presentation/strings.ts` |
| **Description** | Create a typed `Strings` object (or plain object) with all user-facing text in es-AR. Keys follow `SCREEN_NAME_ELEMENT` pattern (e.g., `DASHBOARD_TITLE`, `DASHBOARD_CURRENT_PERIOD`, `ACTIVE_PURCHASES_TITLE`). |
| **Acceptance** | All UI strings defined in a single file; no hardcoded English strings remain in components after Task 8. |

---

## Task 8: Apply Localized Strings Across All Components

| Field | Value |
|---|---|
| **Status** | Pending |
| **Priority** | High |
| **Files** | `src/presentation/components/Dashboard.tsx`, `src/presentation/components/ActivePurchases.tsx`, `src/presentation/components/FutureCommitments.tsx`, `src/presentation/components/Settings.tsx`, `src/presentation/components/PurchaseForm.tsx`, `src/presentation/components/AppShell.tsx` |
| **Description** | Replace all hardcoded English strings with references to `Strings` from `strings.ts`. Includes navigation labels, section titles, field labels, buttons, empty states, and error messages. |
| **Acceptance** | All user-visible text is in Spanish (Argentina); no English text remains visible (AC-001, AC-004). |

---

## Task 9: Create Currency Formatting Utility

| Field | Value |
|---|---|
| **Status** | Pending |
| **Priority** | High |
| **File** | New `src/presentation/utils/formatCurrency.ts` |
| **Description** | Create a `formatCurrency(amount: number): string` function using `new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' })`. Output format: `ARS 125.500,75`. |
| **Acceptance** | Currency formatting uses Argentinian conventions (AC-002). `ARS 125.500,75` instead of `ARS 125,500.75`. |

---

## Task 10: Create Date Formatting Utility

| Field | Value |
|---|---|
| **Status** | Pending |
| **Priority** | High |
| **File** | New `src/presentation/utils/formatDate.ts` |
| **Description** | Create a `formatDate(date: Date): string` function using `Intl.DateTimeFormat('es-AR')` or manual DD/MM/YYYY formatting. Output format: `15/07/2026`. |
| **Acceptance** | Date formatting uses DD/MM/YYYY (AC-003). |

---

## Task 11: Replace Inline Formatting with Shared Utilities

| Field | Value |
|---|---|
| **Status** | Pending |
| **Priority** | High |
| **Files** | `src/presentation/components/Dashboard.tsx`, `src/presentation/components/ActivePurchases.tsx`, `src/presentation/components/FutureCommitments.tsx` |
| **Description** | Replace inline `$X.toFixed(2)` and private `formatDate()` functions with imports from `src/presentation/utils/formatCurrency.ts` and `src/presentation/utils/formatDate.ts`. Remove duplicated private helpers. |
| **Acceptance** | All currency and date formatting uses shared utilities; no inline formatting or duplicated helpers remain. |

---

## Task 12: Update ProductSpecification.md

| Field | Value |
|---|---|
| **Status** | Pending |
| **Priority** | Medium |
| **File** | `ProductSpecification.md` |
| **Description** | Add rules for: active purchases sorting (descending by purchase date), automatic archiving (isArchived), localization (es-AR), currency formatting (ARS 125.500,75), date formatting (DD/MM/YYYY). |
| **Acceptance** | ProductSpecification.md reflects all new business rules from CR-006. |

---

## Task 13: Update ArchitectureDecisionRecords.md

| Field | Value |
|---|---|
| **Status** | Pending |
| **Priority** | Medium |
| **File** | `ArchitectureDecisionRecords.md` |
| **Description** | Add ADR-016 (Automatic Purchase Archiving) and ADR-017 (Argentinian Spanish Localization). Update ADR-003 and ADR-015 with compatibility notes. |
| **Acceptance** | ArchitectureDecisionRecords.md includes ADR-016 and ADR-017. |

---

## Task 14: Update All Test Assertions for Spanish Text

| Field | Value |
|---|---|
| **Status** | Pending |
| **Priority** | High |
| **Files** | All `*.test.tsx` and `*.test.ts` files that assert on English text |
| **Description** | Replace all English string assertions (e.g., `screen.getByText('Current Period')`) with Spanish equivalents (e.g., `screen.getByText('Período Actual')`). |
| **Acceptance** | All tests pass with Spanish text assertions. |

---

## Task 15: Add Tests for Archiving and Sort

| Field | Value |
|---|---|
| **Status** | Pending |
| **Priority** | High |
| **Files** | `src/application/services/__tests__/DashboardService.test.ts`, `src/domain/entities/__tests__/Purchase.test.ts`, `src/presentation/components/__tests__/ActivePurchases.test.tsx`, `src/presentation/components/__tests__/Dashboard.test.tsx` |
| **Description** | Add tests for: sort order of active purchases, archived purchase exclusion from active view, archiving trigger on remaining = 0, period summary inclusion of archived purchases. |
| **Acceptance** | All archiving and sorting acceptance criteria are covered by tests. |

---

## Task 16: Full Verification

| Field | Value |
|---|---|
| **Status** | Pending |
| **Priority** | High |
| **Description** | Run `npm run build` and `npm test`. Verify no TypeScript errors, all tests pass, no English text remains visible. |
| **Acceptance** | Build succeeds; all tests pass. |

---

## Dependencies

- **Task 1** is independent (UI-only).
- **Task 2** depends on **Tasks 5** (archiving filter must be implemented before sorting is final).
- **Task 3** must precede **Tasks 4, 5**.
- **Task 4** depends on **Task 3**.
- **Task 5** depends on **Task 3**.
- **Task 6** is independent.
- **Task 7** must precede **Task 8**.
- **Task 8** depends on **Task 7**.
- **Tasks 9, 10** must precede **Task 11**.
- **Task 11** depends on **Tasks 9, 10**.
- **Tasks 12, 13** are independent.
- **Task 14** depends on **Tasks 7, 8** (localization applied first, then tests updated).
- **Task 15** depends on **Tasks 3, 4, 5, 2** (archiving logic and sorting in place).
- **Task 16** depends on all preceding tasks.

## Verification

1. `npm test` — all existing and new tests pass.
2. `npm run build` — no TypeScript or build errors.
3. Manual check: navigation has proper bottom padding, active purchases sorted newest-first, completed purchases disappear from active view, app icon is finance-themed, all text is in Spanish, currency/dates use Argentinian format.
