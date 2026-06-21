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
  isArchived?: boolean
}

export interface SettingsRecord {
  key: 'card'
  closingDay: number
  dueDay: number
}

export class AppDatabase extends Dexie {
  purchases!: Table<PurchaseRecord, string>
  settings!: Table<SettingsRecord, string>

  constructor(name = 'ExpenseTracker') {
    super(name)
    this.version(1).stores({
      purchases: 'id, purchaseDate',
    })
    this.version(2).stores({
      purchases: 'id, purchaseDate',
      settings: 'key',
    })
  }
}

export const db = new AppDatabase()
