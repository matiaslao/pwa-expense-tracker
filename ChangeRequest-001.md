# Change Request 001: Configurable Closing Day, Due Date, and Form Defaults

**Status:** Approved  
**Priority:** High  
**Author:** Product  
**Date:** 2026-06-18  

---

## Rationale

The MVP hardcoded closing day (15) and due date (closing day + 10) to simplify initial development. Operational use has revealed the need for customization, as different credit cards have different statement cycles. Additionally, the First Installment Date field adds unnecessary friction — users should not have to manually enter a date that always aligns with the statement due date.

---

## Changes

| # | Change | Description |
|---|--------|-------------|
| 1 | Configurable Closing Day | Closing day becomes a user-configurable persisted setting (1–31). Displayed in date format. |
| 2 | Configurable Due Date | Due day becomes a user-configurable persisted setting (1–31). Displayed in date format. |
| 3 | Closing Day + 14 Default | When closing day changes, due date defaults to closing day + 14 days. |
| 4 | Purchase Date Default | Purchase date auto-fills to today's date on the create form. |
| 5 | Installments Default | Installments auto-fills to 1 on the create form. |
| 6 | Remove First Installment Date | Field removed from form; value auto-calculated from billing period + due day at purchase creation. |

---

## Acceptance Criteria

- [ ] User can navigate to a Settings screen and modify the closing day (1–31)
- [ ] User can modify the due day (1–31) independently of closing day
- [ ] When closing day changes, due day defaults to closing day + 14 (clamped to month-end)
- [ ] Dashboard shows closing day and due day in date format (e.g., "15th") using the configured values
- [ ] Closing day and due day settings persist across page reloads (IndexedDB)
- [ ] Purchase form no longer shows a First Installment Date field
- [ ] Purchase form pre-fills Purchase Date with today's date
- [ ] Purchase form pre-fills Installments with 1
- [ ] Creating a purchase without specifying first installment date succeeds; date is auto-calculated
- [ ] Editing an existing purchase preserves its first installment date unless the purchase date changes
- [ ] Changing the due day does not retroactively change existing purchases' installment schedules
- [ ] Changing the closing day only affects billing period assignment for new purchases
- [ ] All existing tests pass; new tests cover config persistence and auto-calculation

---

## Design Decisions

1. **firstInstallmentDate retained in entity and DB** — The field stays as a stored computed value. It is removed only from the UI. This keeps `generateInstallments()` self-contained and avoids retroactive schedule changes when config is modified.

2. **Single global config** — The MVP stores one closing day and one due day (single-card scope). Per-card configuration is excluded from this change.

3. **Existing data unchanged** — Schema migration is additive (new config table). The `purchases` schema is not modified. Existing purchases retain their stored `firstInstallmentDate` and `billingPeriod`.

4. **Non-retroactive** — Changing closing day or due day does not recalculate existing purchases. This prevents unexpected shifts in past/future installment schedules.

---

## Impact Summary

| Area | Impact |
|------|--------|
| Product Specification | Updated — new business rules and scope items added |
| ADRs | ADR-003 updated; ADR-010 and ADR-011 added |
| Domain | New `CardSettings` type and `ConfigRepository` interface |
| Application | `PurchaseService` and `DashboardService` accept `dueDay`; first installment auto-calculation |
| Infrastructure | New `ConfigRepositoryImpl`; DB schema v2 with settings store |
| Presentation | New Settings screen; PurchaseForm simplified; Dashboard config-driven |
| Tests | 6 existing test files updated; 2 new test suites required |
| Documentation | User guide, ADR records, and project state updated |

---

## Tasks

See `PROJECT_STATE.md` for the full task breakdown (CR-001-TASK-01 through CR-001-TASK-11).
