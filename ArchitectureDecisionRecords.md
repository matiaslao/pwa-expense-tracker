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
Configurable Closing & Due Dates (Full Date Values)

*Updated 2026-06-30: closingDay and dueDay (number, 1-31) replaced by closingDate and dueDate (Date). Settings UI uses date pickers. Closing date rolls automatically each month. If the closing day does not exist in a month (e.g., 31st in February), roll to the last day of that month. Due date is auto-calculated as closingDate + 14 calendar days using JavaScript Date arithmetic (per ADR-013), and the user may override it independently.*

## ADR-011
First Installment Date Auto-Calculation

## ADR-012
Dashboard Refresh After Settings Change

*Context: Settings (closing date, due date) are persisted via ConfigRepository, but the Dashboard only fetches current period data on mount. After saving new settings, stale data is displayed until full page reload.*

*Decision: Propagate saved settings from the Settings component up to AppRoutes' React state via an onSettingsChanged callback. The Dashboard fetches data in a useEffect that depends on closingDate and dueDate props, so it re-fetches when settings change. This keeps the change within the presentation layer and avoids restructuring service lifetimes.*

## ADR-013
Calendar-Based Due Date Default Calculation

*Context: The original default due date calculation (closingDay + 14, capped at 28) fails for dates near month boundaries. For example, closingDay=20 produces dueDay=34, which is not a valid day of month.*

*Decision: Use JavaScript's built-in Date arithmetic (setDate(getDate() + 14)) which properly handles month rollover. This is a UI convenience default — the user can always override the due date manually. No business logic changes are required.*

## ADR-014
Period Snapshot Capture

*Context: After a billing period closes, the Dashboard needs to show a summary of the previous period (closing date, due date, total amount, purchase count). This data must be a captured snapshot — not computed from historical purchases — so that it remains stable even if purchases are later edited or deleted.*

*Decision: On app startup, check if the closing date has passed. If so, capture a PeriodSnapshot containing the period's closing date, due date, total due amount (sum of first installments), and purchase count. Store the snapshot in a new `periodSnapshots` Dexie table (DB version 3). The closing date is then advanced by one month (with month-end rollover per ADR-010). If multiple periods have passed since the last run, each is captured in sequence. The Dashboard displays the latest snapshot in a "Previous Period" card. A new History tab shows all captured snapshots with visual bars for amount and count.*

## ADR-015
Historical Period Chart

*Context: Users want to see past period due amounts and purchase counts over time.*
*Decision: Add a History tab (5th bottom nav item, BarChart icon) showing all captured PeriodSnapshots ordered chronologically descending. Display uses simple CSS bars (no charting library) relative to max values. MVP avoids charting dependencies.*

## ADR-016
Month-End Rollover Rule

*Context: When a closing date (e.g., 31st) falls in a month with fewer days (e.g., February), the auto-advancement needs a defined behavior.*
*Decision: Use the last day of the next month. Computed via `new Date(year, nextMonthIndex + 1, 0).getDate()` (last day of next month) and `Math.min(currentDay, lastDayOfNextMonth)`. This matches common credit card behavior where statement dates roll to month-end when the day doesn't exist.*
