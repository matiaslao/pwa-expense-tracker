# Credit Card Expense Tracker

## Product Specification

### Objective
Develop a mobile-first Progressive Web Application (PWA) for tracking credit card purchases and future installment commitments.

## MVP Scope

### Included
- Single credit card
- ARS currency only, formatted for es-AR locale
- Argentinian Spanish (es-AR) localization
- Create/Edit/Delete purchases
- Equal installments without interest
- Automatic billing period assignment
- Configurable closing day (persisted)
- Configurable due date (persisted, defaults to closing day + 14)
- Dashboard with current and previous period summary
- Future commitments view
- Active purchases view
- Settings screen for card configuration
- First installment date auto-calculated from billing period
- Offline operation
- PWA installation on iPhone and Android
- Bottom navigation respects mobile safe-area insets (viewport-fit=cover)

### Excluded
- Multiple cards
- Categories
- Budgets
- Reports
- Cloud sync
- User accounts
- Notifications
- Foreign currencies

## Technology Stack
- React
- TypeScript
- Vite
- Material UI
- Dexie
- IndexedDB
- Vitest
- React Testing Library
- vite-plugin-pwa

## Core Business Rules
- Installment value = amount / installments
- Purchases after closing day belong to next statement
- Installments are generated dynamically
- Active purchase = remaining installments > 0 (installments with future due dates)
- Active purchases are sorted by purchase date in descending order (newest first)
- Completed purchases (remaining installments = 0) are automatically removed (hard delete)
- Billing period summaries for closed periods are stored as immutable snapshots (not recomputed from purchases)
- Changing closing day or due day does not modify previously stored snapshots
- Dashboard current period: calculated dynamically from active purchases
- Dashboard previous period: loaded from the most recent stored snapshot
- Currency formatted using es-AR conventions: ARS 125.500,75
- Dates formatted as DD/MM/YYYY (enforced across all dashboard screens, including current period closing/due dates)
- All user-facing dashboard dates use calendar date format, not day-of-month numbers
- All user-visible text in Argentinian Spanish (es-AR)
- Closing day is user-configurable (1–31), persisted in IndexedDB
- Due day is user-configurable (1–31), defaults to closing day + 14 using calendar arithmetic (handles month boundaries via JavaScript Date)
- Closing day and due day can be changed at any time
- Changing closing day affects only new purchases; existing billing periods are preserved
- First installment date is auto-calculated from the purchase's billing period due date
- Purchase date defaults to today's date on the create form
- Installments defaults to 1 on the create form
- First Installment Date field is removed from the purchase form
- Active purchases display: purchase date shown next to description; single-installment purchases (installments=1) show total amount only; multi-installment purchases (installments>1) show total installments, remaining installments, and installment amount — no total amount displayed

## Success Criteria
- Fully offline
- PWA installable
- Tests passing
- Documentation complete
