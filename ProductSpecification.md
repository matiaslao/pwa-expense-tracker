# Credit Card Expense Tracker

## Product Specification

### Objective
Develop a mobile-first Progressive Web Application (PWA) for tracking credit card purchases and future installment commitments.

## MVP Scope

### Included
- Single credit card
- ARS currency only
- Create/Edit/Delete purchases
- Equal installments without interest
- Automatic billing period assignment
- Dashboard with current period summary
- Future commitments view
- Active purchases view
- Offline operation
- PWA installation on iPhone and Android

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
- Active purchase = remaining installments > 0

## Success Criteria
- Fully offline
- PWA installable
- Tests passing
- Documentation complete
