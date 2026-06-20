# Architecture Decision Records

## ADR-001
Clean Architecture

## ADR-002
IndexedDB + Dexie persistence

## ADR-003
Installments generated dynamically (never persisted)

*Updated 2026-06-18: firstInstallmentDate is now auto-calculated from billing period + dueDay at purchase creation, rather than user-provided.*

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
