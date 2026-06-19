# User Guide

## Overview

Track credit card purchases with installment plans. Add purchases, view your current statement, and see future commitments — all offline.

## Create a Purchase

1. Tap the **+** button (bottom-right).
2. Fill in the fields:
   - **Description** — What you bought
   - **Amount (ARS)** — Total purchase amount
   - **Installments** — Number of installments (defaults to 1)
   - **Purchase Date** — When you made the purchase (defaults to today)
3. Tap **Create**.

The first installment date is automatically calculated based on your card's statement due date. The purchase appears in Active Purchases and its first installment is reflected on the Dashboard.

## View Dashboard

The Dashboard shows the current billing period summary:

- **Period** — The billing period (e.g., `2026-06`)
- **Closing day** — Your configured statement closing day (e.g., 15th)
- **Due date** — Your configured payment due date (e.g., 29th)
- **Total due** — Sum of first installments for purchases in this period
- **Installments** — Number of first-installment purchases in this period

Closing day and due date are configurable from the **Settings** screen.

## View Active Purchases

Tap **Purchases** in the bottom nav to see all purchases with their installment details. Each purchase shows:

- Description
- Total amount
- Number of installments
- Remaining total amount

### Edit a Purchase

Tap the **edit (pencil)** icon next to a purchase. Modify the fields and tap **Update**.

### Delete a Purchase

Tap the **delete (trash)** icon next to a purchase. The purchase and all its installments are permanently removed.

## View Future Commitments

Tap **Future** in the bottom nav to see upcoming installment amounts grouped by billing period. This shows installments beyond the current period.

## Settings

1. Tap **Settings** in the bottom nav.
2. Adjust the **Closing Day** (1–31) — the day your statement closes.
3. The **Due Date** automatically updates to Closing Day + 14. You can adjust it independently.
4. Tap **Save**.

Changes apply to new purchases only. Existing purchases keep their original billing periods and installment schedules.

## Navigation

| Tab | Path | Description |
|-----|------|-------------|
| Dashboard | `/` | Current period summary |
| Purchases | `/purchases` | All purchases (edit/delete) |
| Future | `/future` | Future installment commitments |
| Settings | `/settings` | Configure closing day and due date |
| + (FAB) | `/new` | Create new purchase |

## PWA Installation

### iPhone (Safari)
1. Open the app in Safari.
2. Tap the **Share** button.
3. Scroll down and tap **Add to Home Screen**.
4. Tap **Add**.

### Android (Chrome)
1. Open the app in Chrome.
2. Tap the menu (⋮) → **Add to Home Screen**.
3. Tap **Add**.

The app works fully offline after the initial load.
