# Change Request 005: Dashboard UI Adjustments

## Overview

Three visual adjustments to the Dashboard component after CR-004 changes.

---

## Change 1: Swap Card Order

### Current State
Previous Period card appears above Current Period card.

### Target State
Current Period card appears above Previous Period card.

### Rationale
The current billing period is the primary information the user needs. The previous period is secondary reference data.

### Affected Files
| File | Change |
|------|--------|
| `src/presentation/components/Dashboard.tsx` | Reorder Paper elements |

---

## Change 2: Previous Period Empty State Detail

### Current State
When no snapshot exists (first period), the Previous Period card shows a single `-` placeholder in the body.

### Target State
The Previous Period card keeps its full structure with all fields, each showing `-`:
- Period: `-`
- Closing date: `-`
- Due date: `-`
- Total due: `-`
- Purchases: `-`

### Affected Files
| File | Change |
|------|--------|
| `src/presentation/components/Dashboard.tsx` | Render field list with `-` values instead of single placeholder |

---

## Change 3: Current Period Label

### Current State
The Current Period card shows "Installments" as the label for the purchase count row.

### Target State
The label reads "Purchases" instead, since the displayed value is the count of purchases in the period (not the total number of installments across purchases).

### Affected Files
| File | Change |
|------|--------|
| `src/presentation/components/Dashboard.tsx` | Change label text |

---

## Task Breakdown

| Task | Description | Files |
|------|-------------|-------|
| CR-005-TASK-01 | Swap card order, update empty state, fix label | `Dashboard.tsx` |

Single task, one file modified.

---

## Testing

- Update Dashboard component tests to assert new card order
- Update Dashboard tests for new empty state structure
- No ADR or documentation changes needed
