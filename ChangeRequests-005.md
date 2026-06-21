# ChangeRequests-005.md

## CR-005 - Previous Period Summary on Dashboard

### Status

Proposed

---

## Business Motivation

Between Closing Date and Due Date, users still need visibility of the amount due for the previously closed billing period.

Currently the Dashboard only displays information for the current period.

This can create confusion because:

* New purchases already appear in the current period.
* The amount actually due on the upcoming Due Date belongs to the previous closed period.

Users need visibility of both periods simultaneously.

---

## Current Behavior

Dashboard displays:

* Current Period Summary

Only.

No information is shown regarding the previously closed period.

---

## Expected Behavior

A new dashboard section shall be added directly below the Current Period panel.

Structure:

1. Current Period
2. Previous Period Summary

---

## Previous Period Summary Content

The panel shall display:

* Period identifier
* Total amount due
* Purchase count
* Installment count
* Closing date
* Due date

The information shall represent the most recently closed billing period.

---

## Example

Current Period

Period:
2026-07

Closing Date:
2026-07-25

Due Date:
2026-08-08

Total:
$ 85,000

Purchases:
6

---

Previous Period Summary

Period:
2026-06

Due Date:
2026-07-09

Amount Due:
$ 142,000

Purchases:
11

---

## Business Rules

### BR-001

Current Period shall continue displaying purchases assigned to the current billing period.

---

### BR-002

Previous Period Summary shall display data for the most recently closed billing period.

---

### BR-003

Previous Period data shall remain visible regardless of whether the Due Date has already passed.

---

### BR-004

The dashboard shall display both sections simultaneously.

---

## Acceptance Criteria

### AC-001

Dashboard displays a Previous Period Summary section below Current Period.

---

### AC-002

Previous Period Summary shows the amount due for the previous billing cycle.

---

### AC-003

Current Period calculations remain unchanged.

---

### AC-004

Both panels render correctly on mobile devices.

---

## Testing Requirements

### Unit Tests

* Previous period identification.
* Previous period aggregation.
* Amount due calculation.

### UI Tests

* Dashboard rendering with current and previous period data.
* Mobile layout verification.
* Empty-state handling.

---

## Notes

These changes are additive and shall not alter existing purchase allocation logic or billing period calculation rules.# ChangeRequests-005.md

## CR-005 - Previous Period Summary on Dashboard

### Status

Proposed

---

## Business Motivation

Between Closing Date and Due Date, users still need visibility of the amount due for the previously closed billing period.

Currently the Dashboard only displays information for the current period.

This can create confusion because:

* New purchases already appear in the current period.
* The amount actually due on the upcoming Due Date belongs to the previous closed period.

Users need visibility of both periods simultaneously.

---

## Current Behavior

Dashboard displays:

* Current Period Summary

Only.

No information is shown regarding the previously closed period.

---

## Expected Behavior

A new dashboard section shall be added directly below the Current Period panel.

Structure:

1. Current Period
2. Previous Period Summary

---

## Previous Period Summary Content

The panel shall display:

* Period identifier
* Total amount due
* Purchase count
* Installment count
* Closing date
* Due date

The information shall represent the most recently closed billing period.

---

## Example

Current Period

Period:
2026-07

Closing Date:
2026-07-25

Due Date:
2026-08-08

Total:
$ 85,000

Purchases:
6

---

Previous Period Summary

Period:
2026-06

Due Date:
2026-07-09

Amount Due:
$ 142,000

Purchases:
11

---

## Business Rules

### BR-001

Current Period shall continue displaying purchases assigned to the current billing period.

---

### BR-002

Previous Period Summary shall display data for the most recently closed billing period.

---

### BR-003

Previous Period data shall remain visible regardless of whether the Due Date has already passed.

---

### BR-004

The dashboard shall display both sections simultaneously.

---

## Acceptance Criteria

### AC-001

Dashboard displays a Previous Period Summary section below Current Period.

---

### AC-002

Previous Period Summary shows the amount due for the previous billing cycle.

---

### AC-003

Current Period calculations remain unchanged.

---

### AC-004

Both panels render correctly on mobile devices.

---

## Testing Requirements

### Unit Tests

* Previous period identification.
* Previous period aggregation.
* Amount due calculation.

### UI Tests

* Dashboard rendering with current and previous period data.
* Mobile layout verification.
* Empty-state handling.

---

## Notes

These changes are additive and shall not alter existing purchase allocation logic or billing period calculation rules.
