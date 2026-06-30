# Change Request 006: Active Purchases Display & Sorting

## Overview

Two changes to the Active Purchases screen to improve readability.

---

## Change 1: Enhanced Purchase Display

### Current State
Each purchase item shows:
- **Primary**: description only
- **Secondary**: `$<amount> — <count> installments ($<remaining> remaining)`

### Target State
Each purchase item shows:
- **Primary**: `<description> — <purchase date>` (date formatted as e.g., "June 10, 2025")
- **Secondary**:
  - If `installments > 1`: `$<amount> — <count> installments ($<remaining> remaining)`
  - If `installments == 1`: `$<amount>` only (no installment breakdown)

### Implementation
- Use `formatDate()` helper with `toLocaleDateString` (same style as Dashboard)
- Conditional secondary text based on `purchase.installments`
- `totalRemaining` still computed from `generateInstallments()` but only used when `installments > 1`

### Affected Files
| File | Change |
|------|--------|
| `src/presentation/components/ActivePurchases.tsx` | Update `ListItemText` primary and secondary |

---

## Change 2: Sort by Purchase Date

### Current State
Purchases are displayed in insertion order (primary key order from Dexie).

### Target State
Purchases are sorted by `purchaseDate` descending (most recent first).

### Options
- Sort in the repository layer (`findAll()` returns sorted)
- Sort in the service layer (`getActivePurchases()` sorts before returning)
- Sort in the presentation layer

### Decision
Sort in the service layer (`DashboardService.getActivePurchases()`) to keep sorting logic in application/domain, not in UI or infrastructure. The repository should remain a simple data access layer.

### Affected Files
| File | Change |
|------|--------|
| `src/application/services/DashboardService.ts` | Sort purchases by `purchaseDate` descending before returning |

---

## Task Breakdown

| Task | Description | Files |
|------|-------------|-------|
| CR-006-TASK-01 | Update ActivePurchases display + sort in DashboardService | `ActivePurchases.tsx`, `DashboardService.ts` |

Single task, two files modified.
