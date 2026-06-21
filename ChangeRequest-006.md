#CR-006 - MVP Completion and UX Improvements

## Status

Proposed

---

# Overview

This Change Request contains the final set of usability, localization, visual design, and data lifecycle improvements required before declaring the MVP complete.

The objective is to improve usability on mobile devices, reduce user friction, improve localization for Argentinian users, and ensure long-term data consistency.

---

# CR-006.1 - Bottom Navigation Usability

## Business Motivation

The bottom navigation icons are positioned too close to the bottom edge of the screen.

On some devices this makes icon selection difficult and increases the likelihood of missed taps.

---

## Current Behavior

Navigation icons are rendered very close to the bottom edge of the viewport.

Users may have difficulty selecting them reliably.

---

## Expected Behavior

The bottom navigation shall include sufficient bottom padding and touch area.

Requirements:

* Comfortable thumb interaction.
* Compliance with mobile safe areas.
* Appropriate spacing from screen edges.
* Consistent behavior on iPhone and Android devices.

---

## Acceptance Criteria

### AC-001

All navigation icons are easily tappable.

### AC-002

Navigation controls do not touch the bottom screen edge.

### AC-003

Touch targets remain usable on small mobile screens.

---

# CR-006.2 - Active Purchases Sorting

## Business Motivation

Users generally expect to see the most recent purchases first.

This allows quick verification of newly entered purchases.

---

## Current Behavior

Purchase ordering is inconsistent or not optimized for user review.

---

## Expected Behavior

The Active Purchases list shall be sorted by Purchase Date in descending order.

Newest purchases shall appear first.

Oldest purchases shall appear last.

---

## Example

2026-07-15
Supermercado

2026-07-14
Combustible

2026-07-10
Farmacia

---

## Acceptance Criteria

### AC-001

Purchases are automatically sorted by Purchase Date descending.

### AC-002

Adding a new purchase places it at the top of the list.

### AC-003

Editing a purchase date updates its position appropriately.

---

# CR-006.3 - Automatic Cleanup of Inactive Purchases

## Business Motivation

Purchases that have completed all installments should no longer appear in Active Purchases.

Removing inactive purchases keeps the database clean and improves performance.

---

## Current Behavior

Completed purchases remain stored indefinitely.

---

## Expected Behavior

A purchase shall be automatically removed once all installments have been processed and no future installments remain.

---

## Important Constraint

Historical information required for billing period summaries shall remain available.

Automatic cleanup shall not affect:

* Current Period calculations.
* Previous Period Summary calculations.
* Historical reporting already generated.

---

## Implementation Guidance

The agent shall evaluate whether:

* Historical summary information must be preserved separately.
* Aggregated period data must be retained before purchase deletion.

The implementation shall avoid loss of information required for dashboard summaries.

---

## Acceptance Criteria

### AC-001

Completed purchases no longer appear in Active Purchases.

### AC-002

Current Period calculations remain correct.

### AC-003

Previous Period Summary remains correct.

### AC-004

No historical dashboard information is lost.

---

# CR-006.4 - Application Icon Redesign

## Business Motivation

The current application icon does not clearly communicate the application's purpose.

---

## Expected Behavior

The application icon shall visually represent:

* Credit cards
* Expenses
* Personal finance tracking

---

## Design Guidelines

Preferred visual concepts:

* Credit card
* Credit card with currency symbol
* Wallet and card
* Expense tracking symbol

Avoid:

* Generic placeholder icons
* Abstract geometric shapes unrelated to finance

---

## Acceptance Criteria

### AC-001

The icon clearly communicates finance and credit card management.

### AC-002

The icon is recognizable at mobile home screen sizes.

### AC-003

The icon is included in the PWA manifest.

---

# CR-006.5 - Localization to Argentinian Spanish

## Business Motivation

The application is intended primarily for Argentinian users.

The interface and formatting should match local expectations.

---

## Expected Behavior

The entire application shall be displayed in Spanish (Argentina).

Locale:

es-AR

---

## UI Text

Examples:

Dashboard
→ Resumen

Active Purchases
→ Compras Activas

Settings
→ Configuración

Current Period
→ Período Actual

Previous Period
→ Período Anterior

Due Date
→ Fecha de Vencimiento

Closing Date
→ Fecha de Cierre

---

## Currency Formatting

Amounts shall use Argentinian formatting.

Example:

ARS 125.500,75

instead of:

ARS 125,500.75

---

## Date Formatting

Dates shall use:

DD/MM/YYYY

Example:

15/07/2026

---

## Acceptance Criteria

### AC-001

All user-visible text is translated to Spanish (Argentina).

### AC-002

Currency formatting uses Argentinian conventions.

### AC-003

Date formatting uses DD/MM/YYYY.

### AC-004

No English text remains visible in the application.

---

# MVP Completion Criteria

The MVP shall be considered complete when:

* CR-006 is implemented.
* Build passes successfully.
* All automated tests pass.
* GitHub Pages deployment succeeds.
* PWA installation works correctly on iPhone.
* Manual validation confirms expected functionality.
