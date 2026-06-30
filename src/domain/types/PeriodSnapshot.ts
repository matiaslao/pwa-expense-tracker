import type { BillingPeriod } from '../valueObjects/BillingPeriod'

export interface PeriodSnapshot {
  id: string
  period: BillingPeriod
  closingDate: Date
  dueDate: Date
  totalAmount: number
  purchaseCount: number
  capturedAt: Date
}
