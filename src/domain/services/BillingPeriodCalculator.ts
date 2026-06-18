import { BillingPeriod } from '../valueObjects/BillingPeriod'

export function calculateBillingPeriod(closingDay: number, purchaseDate: Date): BillingPeriod {
  const purchaseDay = purchaseDate.getDate()
  let month = purchaseDate.getMonth()
  let year = purchaseDate.getFullYear()

  if (purchaseDay >= closingDay) {
    month += 1
    if (month > 11) {
      month = 0
      year += 1
    }
  }

  return new BillingPeriod(month + 1, year)
}
