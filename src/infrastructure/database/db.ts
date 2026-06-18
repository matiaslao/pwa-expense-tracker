import Dexie, { type Table } from 'dexie'

export interface PurchaseRecord {
  id: string
  description: string
  amount: number
  currency: string
  installments: number
  purchaseDate: Date
  firstInstallmentDate: Date
  billingPeriodMonth: number
  billingPeriodYear: number
}

export class AppDatabase extends Dexie {
  purchases!: Table<PurchaseRecord, string>

  constructor(name = 'ExpenseTracker') {
    super(name)
    this.version(1).stores({
      purchases: 'id, purchaseDate',
    })
  }
}

export const db = new AppDatabase()
