# CR-007 - Active Purchase Lifecycle, Period Snapshot Persistence and Mobile UI Improvements

## Status

Proposed

---

# Overview

This Change Request addresses three issues identified during MVP validation:

1. Active purchases with a single installment or only one remaining installment are not consistently displayed in the Active Purchases view.
2. Historical billing period summaries currently depend on active purchase data and may become inaccurate when purchases are automatically removed.
3. Bottom navigation controls remain difficult to access when the application is installed as a PWA on mobile devices.
4. Dashboard period dates are not consistently displayed using calendar date formatting.

This Change Request also introduces a revised architectural decision regarding purchase lifecycle management and historical period persistence.

---

# Architectural Decision

## ADR-006

### Previous Approach

The application attempted to maintain active and archived purchases while deriving historical information from purchase records.

This approach has introduced inconsistencies and unnecessary complexity.

---

### New Approach

Purchases shall only exist while they remain active.

A purchase is considered active if at least one future installment remains to be billed.

When a purchase is no longer active, it shall be automatically removed from the purchase database.

Historical billing information shall no longer depend on purchase records.

Instead, billing periods shall be persisted as immutable historical snapshots.

---

### Rationale

Benefits:

* Simpler purchase lifecycle.
* Smaller active dataset.
* Improved performance.
* Deterministic historical summaries.
* Protection against future Closing Date changes.
* Simplified dashboard calculations.

---

# CR-007.1 - Active Purchase Visibility Fix

## Problem

After the archived purchase implementation, some valid active purchases are not displayed.

Examples:

* Single-installment purchases.
* Purchases currently on their last pending installment.

These purchases continue contributing to dashboard totals but are missing from the Active Purchases list.

---

## Expected Behavior

A purchase shall remain visible while at least one installment remains pending.

The following purchases shall be displayed:

### Example 1

Installments = 1

Remaining Installments = 1

Result:

Visible

---

### Example 2

Installments = 12

Remaining Installments = 1

Result:

Visible

---

### Example 3

Installments = 12

Remaining Installments = 0

Result:

Automatically removed

---

## Acceptance Criteria

### AC-001

Single-installment purchases remain visible until billed.

### AC-002

Purchases with one remaining installment remain visible.

### AC-003

Completed purchases are automatically removed.

### AC-004

Dashboard totals remain correct.

---

# CR-007.2 - Historical Period Snapshot Persistence

## Business Motivation

Closing Date may change from period to period.

Historical summaries must remain stable regardless of future configuration changes.

---

## Expected Behavior

When a billing period closes, the application shall create a snapshot containing:

* Period Identifier
* Closing Date
* Due Date
* Total Amount
* Purchase Count
* Snapshot Creation Timestamp

The snapshot shall be immutable.

Future modifications to:

* Closing Date
* Due Date
* Purchases
* Settings

shall not modify previously stored snapshots.

---

## Example

Period:

2026-07

Closing Date:

25/07/2026

Due Date:

08/08/2026

Amount Due:

ARS 142.000,00

Purchases:

11

Stored permanently as historical snapshot.

---

## Dashboard Behavior

### Current Period

Calculated dynamically from active purchases.

### Previous Period Summary

Loaded from the most recent stored snapshot.

Not recalculated.

---

## Acceptance Criteria

### AC-001

Closing a period creates a historical snapshot.

### AC-002

Previous Period Summary uses stored snapshot data.

### AC-003

Changing Closing Date does not modify historical summaries.

### AC-004

Deleting completed purchases does not affect historical summaries.

---

# CR-007.3 - Dashboard Date Formatting

## Problem

Closing Date and Due Date are not consistently displayed using calendar date format.

---

## Expected Behavior

All user-facing dates shall use:

DD/MM/YYYY

Examples:

25/07/2026

08/08/2026

14/03/2027

---

## Scope

Applies to:

* Current Period Summary
* Previous Period Summary
* Settings
* Purchase Views
* Any future dashboard date displays

---

## Acceptance Criteria

### AC-001

No dashboard date is displayed using ISO format.

### AC-002

All displayed dates use DD/MM/YYYY.

---

# CR-007.4 - Mobile PWA Bottom Navigation Safe Area

## Problem

Bottom navigation remains partially obstructed when the application is installed as a PWA on mobile devices.

This is particularly noticeable on iPhone devices where the browser safe area overlaps the navigation controls.

---

## Expected Behavior

Bottom navigation shall respect mobile safe-area insets.

Additional bottom padding shall be added to ensure comfortable interaction.

---

## UI Requirements

Requirements:

* Navigation controls shall never touch the screen edge.
* Navigation controls shall remain fully visible.
* Navigation controls shall remain easily tappable.
* Layout shall work correctly in standalone PWA mode.

---

## Acceptance Criteria

### AC-001

Bottom navigation is fully visible on iPhone PWA installations.

### AC-002

No navigation icon is obscured by the system gesture area.

### AC-003

Touch interaction is reliable without accidental misses.

---

# MVP Completion Impact

This Change Request supersedes the previous archived-purchase strategy and establishes the final purchase lifecycle architecture for MVP release.
