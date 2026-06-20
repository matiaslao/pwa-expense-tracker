# ChangeRequests-004.md

## CR-004 - Active Purchases View Improvements

### Status

Proposed

---

## Business Motivation

The Active Purchases view currently does not provide enough contextual information about each purchase and presents layout issues when displaying purchase information together with the edit action.

Users need to quickly identify:

* When a purchase was made.
* Whether it is a single-payment purchase or an installment purchase.
* Remaining installments for installment purchases.
* Installment amount.
* Purchase total amount.

The current layout also presents visual overlap between purchase information and the edit icon.

---

## Current Behavior

### Purchase Date

The purchase date is not displayed in the Active Purchases list.

### Installment Information

Installment purchases do not clearly communicate:

* Total installments.
* Remaining installments.
* Installment amount.

### Single Installment Purchases

Single-payment purchases may display unnecessary installment-related information.

### Layout

Purchase information may overlap or visually conflict with the edit icon depending on content length and screen width.

---

## Expected Behavior

### Purchase Date Display

Each purchase entry shall display:

* Purchase Description
* Purchase Date

The purchase date shall be displayed immediately adjacent to the purchase description.

Example:

Coffee Machine - 2026-06-15

---

### Single Installment Purchases

For purchases with:

Installments = 1

Display:

* Description
* Purchase Date
* Amount

No installment-related information shall be shown.

Example:

Coffee Machine - 2026-06-15
$ 120,000

---

### Installment Purchases

For purchases with:

Installments > 1

Display:

* Description
* Purchase Date
* Total installments
* Remaining installments
* Installment amount
* Total purchase amount

Example:

Coffee Machine - 2026-06-15
$ 120,000
Installments: 12 - 4 remaining
Installment Amount: ARS 10,000

---

### Layout Requirements

The purchase information and edit icon shall never overlap.

Requirements:

* Responsive layout.
* Proper spacing between content and actions.
* Long descriptions shall not overlap action buttons.
* Layout shall remain usable on mobile screen widths.

---

## Acceptance Criteria

### AC-001

Given an active purchase

When displayed

Then purchase date is visible next to the description.

---

### AC-002

Given a purchase with 1 installment

When displayed

Then only the total amount is shown.

And no installment information is displayed.

---

### AC-003

Given a purchase with more than 1 installment

When displayed

Then the UI shows:

* Total installments
* Remaining installments
* Installment amount
* Total purchase amount

---

### AC-004

Given a long purchase description

When displayed

Then no visual overlap occurs with the edit icon.

---

## Testing Requirements

### Unit Tests

* Single-installment display logic.
* Multi-installment display logic.
* Remaining installment calculations.

### UI Tests

* Mobile width rendering.
* Long description rendering.
* Edit icon positioning.

---

## Notes

These changes are additive and shall not alter existing purchase allocation logic or billing period calculation rules.
