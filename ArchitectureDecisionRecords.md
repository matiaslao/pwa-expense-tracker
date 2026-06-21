# Architecture Decision Records

## ADR-001
Clean Architecture

## ADR-002
IndexedDB + Dexie persistence

## ADR-003
Installments generated dynamically (never persisted)

*Updated 2026-06-18: firstInstallmentDate is now auto-calculated from billing period + dueDay at purchase creation, rather than user-provided.*

*Updated 2026-06-20: Dynamic generation now triggers archiving when remaining installments reach 0. See ADR-016.*

## ADR-004
Single-card MVP

## ADR-005
ARS currency only

## ADR-006
No backend

## ADR-007
Business rules require unit tests (>=90% target)

## ADR-008
Material UI

## ADR-009
Mobile-first, iPhone primary target

## ADR-010
Configurable Closing & Due Dates

## ADR-011
First Installment Date Auto-Calculation

## ADR-012
Dashboard Refresh After Settings Change

*Context: Settings (closing day, due day) are persisted via ConfigRepository, but the Dashboard only fetches current period data on mount. After saving new settings, stale data is displayed until full page reload.*

*Decision: Propagate saved settings from the Settings component up to AppRoutes' React state via an onSettingsChanged callback. The Dashboard fetches data in a useEffect that depends on closingDay and dueDay props, so it re-fetches when settings change. This keeps the change within the presentation layer and avoids restructuring service lifetimes.*

## ADR-013
Calendar-Based Due Date Default Calculation

*Context: The original default due date calculation (closingDay + 14, capped at 28) fails for dates near month boundaries. For example, closingDay=20 produces dueDay=34, which is not a valid day of month.*

*Decision: Use JavaScript's built-in Date arithmetic (setDate(getDate() + 14)) which properly handles month rollover. This is a UI convenience default — the user can always override the due day manually. No business logic changes are required.*

## ADR-014
Active Purchases View Display Rules

*Context: Active Purchases view lacked purchase date, installment context (single vs multi), and had layout overlap between content and edit icon.*

*Decision: Display purchase date adjacent to description. Conditionally show installment info based on installments > 1: single-installment shows total amount only; multi-installment shows total installments, remaining installments, and installment amount (no total amount). Use responsive flex layout with proper spacing to prevent edit icon overlap.*

*Rationale: All data is already available from existing domain entities. Changes are purely presentational — no business logic or data model changes required.*

## ADR-015
Previous Period Summary on Dashboard

*Context: Between closing date and due date, users lacked visibility of the amount due for the previously closed billing period. The Dashboard only showed current period data.*

*Decision: Add a `getPreviousPeriodSummary()` method to DashboardService that computes the previous billing period, aggregates purchases assigned to it, and returns totalDue (first-installment sum), purchaseCount, closingDate, and dueDate. The existing `CurrentPeriodSummary` renames `installmentCount` to `purchaseCount` (the field always stored purchase count — the name was misleading). The BillingPeriod domain object gains a `previous()` method for reusable period arithmetic. The Dashboard component displays both panels concurrently using Promise.all.*

*Rationale: All required data already exists in the Purchase entity and BillingPeriod value object. Changes are additive and require no schema migrations or entity changes. Existing current period logic and tests require only a rename from `installmentCount` to `purchaseCount`.*

*Updated 2026-06-20: Period summaries include archived purchases (see ADR-016). The recompute approach remains viable because CR-006.3 chose soft-delete over hard-delete.*

## ADR-016
Automatic Purchase Archiving

*Context: Completed purchases (remaining installments = 0) must be removed from Active Purchases but their data must remain available for Current Period and Previous Period summaries. Physical deletion would corrupt period summaries computed via the recompute approach (ADR-015).*

*Decision: Add an `isArchived: boolean` field to the Purchase entity (soft delete). Archived purchases are excluded from `getActivePurchases()` queries but included in billing period aggregate queries. Archiving is triggered when `getRemainingInstallments(0)` returns an empty array during `getActivePurchases()` fetch. No new IndexedDB table or snapshot infrastructure is required.*

*Rationale: Minimal schema change (one boolean field), no new repositories or tables, preserves compatibility with ADR-015's recompute approach, all existing queries continue to work with minor filter adjustments.*

## ADR-017
Argentinian Spanish Localization

*Context: The app targets Argentinian users. All UI text was in English; currency used US formatting ($500.00); dates used YYYY-MM-DD format.*

*Decision: Localize all user-visible strings to es-AR. Use `Intl.NumberFormat` with `'es-AR'` locale for currency. Use `Intl.DateTimeFormat` with `'es-AR'` (DD/MM/YYYY) for dates. For UI strings, use a simple key-value map (`strings.ts`) rather than a full i18n framework — the app only supports one locale and has no plans for multi-language support.*

*Rationale: Built-in Intl APIs cover formatting. A lightweight string map avoids i18n framework dependency. Single-locale constraint keeps complexity low. All formatting changes are in the presentation layer — no business logic changes.*

*Updated 2026-06-20: Period summaries include archived purchases (see ADR-016). The recompute approach remains viable because CR-006.3 chose soft-delete over hard-delete.*
