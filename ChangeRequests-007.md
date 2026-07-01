# Change Request 007: Bottom Navigation Height & Spanish (Argentina) UI

## Overview

Two UI changes: taller bottom navigation for easier tapping on mobile, and translation of all user-facing strings to Spanish (Argentina).

---

## Change 1: Bottom Navigation Height

### Current State
- MUI `BottomNavigation` default height: `56px`
- Content padding-bottom: `pb: 7` (56px)
- FAB offset from bottom: `72px`

### Target State
- `BottomNavigation` height: `98px` (1.75×)
- Content padding-bottom: `pb: 12` (≈98px)
- FAB offset from bottom: `114px`

### Implementation
Apply `sx={{ height: '98px' }}` on `BottomNavigation` and adjust the surrounding layout values accordingly.

### Affected Files
| File | Change |
|------|--------|
| `src/presentation/components/AppShell.tsx` | Increase BottomNavigation height, `pb`, and FAB `bottom` |

---

## Change 2: Spanish (Argentina) UI

### Approach
No i18n library — replace English strings and locale directly. The app is small (~77 hardcoded strings across 7 components). This avoids adding dependencies and keeps the bundle small.

### What Changes

**Locale**
- `'en-US'` → `'es-AR'` in `formatDate()` in `Dashboard.tsx`, `ActivePurchases.tsx`, `History.tsx` (3 occurrences)

**Strings by Component**

| Component | English | Spanish (AR) |
|-----------|---------|--------------|
| **AppShell** tab labels | Dashboard, Purchases, Future, History, Settings | Resumen, Compras, Futuros, Historial, Ajustes |
| **Dashboard** headings | Current Period, Previous Period | Período Actual, Período Anterior |
| **Dashboard** field labels | Closing date, Due date, Total due, Purchases, Period | Fecha de cierre, Fecha de vencimiento, Total a pagar, Compras, Período |
| **Dashboard** | Loading... | Cargando... |
| **ActivePurchases** heading | Active Purchases | Compras Activas |
| **ActivePurchases** empty | No active purchases | Sin compras activas |
| **ActivePurchases** labels | Edit, Delete, installments, remaining | Editar, Eliminar, cuotas, restante |
| **History** heading | History | Historial |
| **History** empty | No history yet | Sin historial aún |
| **History** labels | purchase(s) | compra(s) |
| **FutureCommitments** heading | Future Commitments | Compromisos Futuros |
| **FutureCommitments** empty | No future commitments | Sin compromisos futuros |
| **FutureCommitments** label | Total | Total |
| **PurchaseForm** heading | New Purchase, Edit Purchase | Nueva Compra, Editar Compra |
| **PurchaseForm** fields | Description, Amount (ARS), Installments, Purchase Date | Descripción, Monto (ARS), Cuotas, Fecha de Compra |
| **PurchaseForm** buttons | Cancel, Create, Update, Saving... | Cancelar, Crear, Actualizar, Guardando... |
| **PurchaseForm** validations | Description is required, Amount must be a positive number, Installments must be at least 1, Purchase date is required | La descripción es obligatoria, El monto debe ser un número positivo, Las cuotas deben ser al menos 1, La fecha de compra es obligatoria |
| **PurchaseForm** error | An error occurred | Ocurrió un error |
| **Settings** heading | Settings | Ajustes |
| **Settings** fields | Closing Date, Due Date | Fecha de Cierre, Fecha de Vencimiento |
| **Settings** helper texts | Your statement closes on this date each month, Your payment is due on this date | Tu resumen cierra en esta fecha cada mes, Tu pago vence en esta fecha |
| **Settings** buttons | Cancel, Save, Saving... | Cancelar, Guardar, Guardando... |
| **Settings** validations | Closing date is required, Due date is required | La fecha de cierre es obligatoria, La fecha de vencimiento es obligatoria |
| **Settings** error | An error occurred | Ocurrió un error |

---

## Task Breakdown

| Task | Description | Files |
|------|-------------|-------|
| CR-007-TASK-01 | Increase bottom navigation height + layout adjustments | `AppShell.tsx` |
| CR-007-TASK-02 | Spanish (AR) locale + string translations in all components | `Dashboard.tsx`, `ActivePurchases.tsx`, `History.tsx`, `FutureCommitments.tsx`, `PurchaseForm.tsx`, `Settings.tsx`, `AppShell.tsx` |
| CR-007-TASK-03 | Update component tests for new Spanish strings | All 7 component test files |
