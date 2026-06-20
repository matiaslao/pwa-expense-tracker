# CR-004 Implementation Task List

## Overview

Improve the Active Purchases view: display purchase dates, conditionally show installment information, and fix layout overlap with the edit icon. See [ChangeRequestAnalysis-004.md](ChangeRequestAnalysis-004.md) for full analysis.

---

## Task 1: Display Purchase Date

| Field | Value |
|---|---|
| **Status** | Pending |
| **Priority** | High |
| **File** | `src/presentation/components/ActivePurchases.tsx` |
| **Description** | Add purchase date display next to description in each list item. Use format `Description - YYYY-MM-DD`. |
| **Acceptance** | Each purchase entry shows its date adjacent to the description per AC-001. |

---

## Task 2: Conditional Installment Display

| Field | Value |
|---|---|
| **Status** | Pending |
| **Priority** | High |
| **File** | `src/presentation/components/ActivePurchases.tsx` |
| **Description** | If `purchase.installments === 1`: show only description, date, and total amount. If `purchase.installments > 1`: show total installments, remaining installments, and installment amount — do NOT show total amount. |
| **Acceptance** | AC-002 and AC-003 pass. |

---

## Task 3: Fix Layout Overlap

| Field | Value |
|---|---|
| **Status** | Pending |
| **Priority** | High |
| **File** | `src/presentation/components/ActivePurchases.tsx` |
| **Description** | Ensure edit icon and purchase content never overlap. Use responsive layout (e.g., flex-wrap, grid, or proper padding) that works on mobile widths. |
| **Acceptance** | AC-004 passes; no visual overlap at any screen width. |

---

## Task 4: Update Existing Tests

| Field | Value |
|---|---|
| **Status** | Pending |
| **Priority** | Medium |
| **File** | `src/presentation/components/__tests__/ActivePurchases.test.tsx` |
| **Description** | Update existing test expectations to match new layout (date, conditional installment info). |
| **Acceptance** | All existing tests pass with updated expectations. |

---

## Task 5: Add New Tests

| Field | Value |
|---|---|
| **Status** | Pending |
| **Priority** | Medium |
| **File** | `src/presentation/components/__tests__/ActivePurchases.test.tsx` |
| **Description** | Add tests for: single-installment display (no installment info), multi-installment display (shows all fields), long description handling (no overlap), remaining installments count. |
| **Acceptance** | New tests cover AC-001 through AC-004. |

---

## Task 6: Update Documentation

| Field | Value |
|---|---|
| **Status** | Pending |
| **Priority** | Medium |
| **Files** | `ProductSpecification.md`, `ArchitectureDecisionRecords.md`, `UserGuide.md` |
| **Description** | Add active purchases display rule to ProductSpecification.md. Add ADR-014 to ArchitectureDecisionRecords.md. Update the **View Active Purchases** section in UserGuide.md to reflect new display rules (date, conditional installment info). |
| **Acceptance** | Specs, ADRs, and UserGuide reflect the new display rules. |

---

## Dependencies

- **Tasks 1, 2, 3** are independent and can be done together in `ActivePurchases.tsx`.
- **Task 4** depends on **Tasks 1–3** being complete.
- **Task 5** depends on **Tasks 1–3** being complete.
- **Task 6** is independent.

## Verification

1. `npm test` — all existing and new tests pass.
2. `npm run build` — no TypeScript or build errors.
3. Manual check: Active Purchases view shows dates, correct installment info per type, and no layout overlap at mobile widths.
