# Architecture Decision Records

## ADR-001
Clean Architecture

## ADR-002
IndexedDB + Dexie persistence

## ADR-003
Installments generated dynamically (never persisted)

*Updated 2026-06-18: firstInstallmentDate is now auto-calculated from billing period + dueDay at purchase creation, rather than user-provided.*

*Updated 2026-06-21: Archiving removed. Completed purchases are now hard-deleted. See ADR-018 for period snapshot persistence.*

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

*Rationale: All required data already exists in the Purchase entity and BillingPeriod value object. Changes are additive and require no schema migrations or entity changes.*

*Updated 2026-06-21 by CR-007: `getPreviousPeriodSummary()` now loads from PeriodSnapshot (ADR-018) instead of recomputing dynamically. The `BillingPeriod.previous()` method is retained for current-period boundary calculations. The Dashboard component handles null previous period gracefully.*

## ADR-016
Automatic Purchase Archiving (Superseded)

*Context: Completed purchases (remaining installments = 0) must be removed from Active Purchases but their data must remain available for Current Period and Previous Period summaries. Physical deletion would corrupt period summaries computed via the recompute approach (ADR-015).*

*Decision: Add an `isArchived: boolean` field to the Purchase entity (soft delete). Archived purchases are excluded from `getActivePurchases()` queries but included in billing period aggregate queries. Archiving is triggered when `getRemainingInstallments(0)` returns an empty array during `getActivePurchases()` fetch. No new IndexedDB table or snapshot infrastructure is required.*

*Rationale: Minimal schema change (one boolean field), no new repositories or tables, preserves compatibility with ADR-015's recompute approach, all existing queries continue to work with minor filter adjustments.*

*Superseded 2026-06-21 by CR-007: Soft-delete replaced by hard delete + immutable period snapshots (ADR-018). Billing period summaries are now served from snapshots rather than recomputed from purchase data, making hard deletion safe.*

## ADR-017
Argentinian Spanish Localization

*Context: The app targets Argentinian users. All UI text was in English; currency used US formatting ($500.00); dates used YYYY-MM-DD format.*

*Decision: Localize all user-visible strings to es-AR. Use `Intl.NumberFormat` with `'es-AR'` locale for currency. Use `Intl.DateTimeFormat` with `'es-AR'` (DD/MM/YYYY) for dates. For UI strings, use a simple key-value map (`strings.ts`) rather than a full i18n framework — the app only supports one locale and has no plans for multi-language support.*

*Rationale: Built-in Intl APIs cover formatting. A lightweight string map avoids i18n framework dependency. Single-locale constraint keeps complexity low. All formatting changes are in the presentation layer — no business logic changes.*

## ADR-018
Period Snapshot Persistence

*Context: Historical billing period summaries computed dynamically from active purchase data (ADR-015) are vulnerable to configuration changes and purchase deletions. Closing date changes, purchase edits, and the soft-delete archiving approach (ADR-016) all affect computed historical values.*

*Decision: Persist billing period summaries as immutable snapshots in a dedicated IndexedDB table (`periodSnapshots`). Each snapshot contains periodLabel, closingDate, dueDate, totalAmount, purchaseCount, and createdAt. Snapshots are created automatically when a billing period closes (detected by `DashboardService.checkPeriodClose()` on Dashboard load and Active Purchases fetch). Once created, snapshots are never modified. The current period is still calculated dynamically from active purchases. The previous period summary is read from the most recent snapshot.*

*Rationale: Deterministic historical data, decoupled from purchase lifecycle, protects against closing date changes. Completed purchases can be safely hard-deleted (ADR-016 superseded) without affecting period summaries. Trade-off: snapshot creation must be triggered reliably at period boundaries — implemented in DashboardService entry points.*
