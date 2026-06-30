import { BillingPeriod } from '../valueObjects/BillingPeriod'

export function calculateBillingPeriod(closingDate: Date, purchaseDate: Date): BillingPeriod {
  const closingDay = closingDate.getDate()
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

export function nextClosingDate(current: Date): Date {
  const day = current.getDate()
  const nextMonth = current.getMonth() + 1
  const nextYear = nextMonth > 11 ? current.getFullYear() + 1 : current.getFullYear()
  const nextMonthIndex = nextMonth % 12
  const lastDayOfNextMonth = new Date(nextYear, nextMonthIndex + 1, 0).getDate()
  const actualDay = Math.min(day, lastDayOfNextMonth)
  return new Date(nextYear, nextMonthIndex, actualDay)
}
