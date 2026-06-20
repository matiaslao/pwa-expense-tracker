# CR-004 Analysis Report — Active Purchases View Improvements

## Overview

CR-004 proposes UI/UX improvements to the Active Purchases view: displaying purchase dates, conditionally showing installment information, and fixing layout overlap with the edit icon.

All changes are additive and do not alter business logic, domain entities, or data model.

---

## Impacted Business Rules

**None.** The CR explicitly states these are presentation-only changes. Existing business rules remain unchanged:

- Purchase allocation logic — unaffected
- Billing period calculation — unaffected
- Installment generation — unaffected
- Purchase/Edit/Delete operations — unaffected

---

## Impacted Data Model

**None.** All required data is already available through existing entities:

| Data Need | Source |
|---|---|
| Purchase date | `Purchase.date` (already exists) |
| Total installments | `Purchase.installments` (already exists) |
| Remaining installments | `Purchase.getRemainingInstallments().length` (already exists) |
| Installment amount | `Purchase.amount / Purchase.installments` (existing business rule) |
| Total amount | `Purchase.amount` (already exists) — shown only for single-installment purchases |

No new fields, types, or repository methods are needed.

---

## Impacted UI Screens

| Component | Impact |
|---|---|
| `src/presentation/components/ActivePurchases.tsx` | **Primary** — Modify the list item rendering to show date, conditional installment info, and fix layout overlap |
| `src/presentation/components/ActivePurchases.tsx` | May need to pass or access `purchase.date` (already available from `DashboardService.getActivePurchases()`) |
| No other screens | Unaffected — Dashboard, Future Commitments, Settings, PurchaseForm remain the same |

---

## Impacted Tests

| Test File | Impact |
|---|---|
| `src/presentation/components/__tests__/ActivePurchases.test.tsx` | **Update existing** — Test expectations may change with new layout and new data displayed |
| `src/presentation/components/__tests__/ActivePurchases.test.tsx` | **New tests** — Single-installment display logic, multi-installment display logic, long-description layout overlap, mobile rendering |

---

## Required Specification Updates

### ProductSpecification.md

Add the following line under **Core Business Rules**:

```
- Active purchases display: purchase date shown next to description; single-installment purchases (installments=1) show total amount only; multi-installment purchases (installments>1) show total installments, remaining installments, and installment amount — no total amount displayed
```

### ArchitectureDecisionRecords.md

Add **ADR-014: Active Purchases View Display Rules** documenting the conditional display logic and layout decisions.

### UserGuide.md

The **View Active Purchases** section (`UserGuide.md:32-38`) lists current display fields. Must be updated to reflect:
- Purchase date shown next to description
- Single-installment purchases: only description, date, and total amount
- Multi-installment purchases: description, date, total/remaining installments, installment amount — no total amount

---

## Required ADR Updates

**ADR-014 (new):** Active Purchases View Display Rules

- **Context:** Active Purchases view lacked purchase date, installment context, and had layout overlap.
- **Decision:** Display purchase date adjacent to description; conditionally show installment info based on `installments > 1` (single-installment: total amount only; multi-installment: total/remaining installments and installment amount, no total amount); use responsive layout with proper spacing to prevent edit icon overlap.
- **Rationale:** All data is already available from existing domain entities; changes are purely presentational; no business logic or data model changes required.

---

## Proposed Implementation Tasks

### Task 1: Display Purchase Date

| Field | Value |
|---|---|
| **File** | `src/presentation/components/ActivePurchases.tsx` |
| **Description** | Add purchase date display next to description in each list item. Use format `Description - YYYY-MM-DD`. |
| **Acceptance** | Each purchase entry shows its date adjacent to the description per AC-001. |

### Task 2: Conditional Installment Display

| Field | Value |
|---|---|
| **File** | `src/presentation/components/ActivePurchases.tsx` |
| **Description** | If `purchase.installments === 1`: show only description, date, and total amount. If `purchase.installments > 1`: show total installments, remaining installments, and installment amount — do NOT show total amount. |
| **Acceptance** | AC-002 and AC-003 pass. |

### Task 3: Fix Layout Overlap

| Field | Value |
|---|---|
| **File** | `src/presentation/components/ActivePurchases.tsx` |
| **Description** | Ensure edit icon and purchase content never overlap. Use responsive layout (e.g., flex-wrap, grid, or proper padding) that works on mobile widths. |
| **Acceptance** | AC-004 passes; no visual overlap at any screen width. |

### Task 4: Update Existing Tests

| Field | Value |
|---|---|
| **File** | `src/presentation/components/__tests__/ActivePurchases.test.tsx` |
| **Description** | Update existing test expectations to match new layout (date, conditional installment info). |
| **Acceptance** | All existing tests pass with updated expectations. |

### Task 5: Add New Tests

| Field | Value |
|---|---|
| **File** | `src/presentation/components/__tests__/ActivePurchases.test.tsx` |
| **Description** | Add tests for: single-installment display (no installment info), multi-installment display (shows all fields), long description handling (no overlap), remaining installments count. |
| **Acceptance** | New tests cover AC-001 through AC-004. |

### Task 6: Update Documentation

| Field | Value |
|---|---|
| **Files** | `ProductSpecification.md`, `ArchitectureDecisionRecords.md`, `UserGuide.md` |
| **Description** | Add active purchases display rule to ProductSpecification.md. Add ADR-014 to ArchitectureDecisionRecords.md. Update the **View Active Purchases** section in UserGuide.md to reflect new display rules (date, conditional installment info). |
| **Acceptance** | Specs, ADRs, and UserGuide reflect the new display rules. |

---

## Dependencies

- **Tasks 1, 2, 3** are independent and can be done together in `ActivePurchases.tsx`.
- **Task 4** depends on **Tasks 1–3** being complete.
- **Task 5** depends on **Tasks 1–3** being complete.
- **Task 6** is independent.

---

## Verification

1. `npm test` — all existing and new tests pass.
2. `npm run build` — no TypeScript or build errors.
3. Manual check: Active Purchases view shows dates, correct installment info per type, and no layout overlap at mobile widths.
