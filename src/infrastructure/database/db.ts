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

export interface SettingsRecord {
  key: 'card'
  closingDay: number
  dueDay: number
}

export interface PeriodSnapshotRecord {
  periodLabel: string
  closingDate: Date
  dueDate: Date
  totalAmount: number
  purchaseCount: number
  createdAt: Date
}

export class AppDatabase extends Dexie {
  purchases!: Table<PurchaseRecord, string>
  settings!: Table<SettingsRecord, string>
  periodSnapshots!: Table<PeriodSnapshotRecord, string>

  constructor(name = 'ExpenseTracker') {
    super(name)
    this.version(1).stores({
      purchases: 'id, purchaseDate',
    })
    this.version(2).stores({
      purchases: 'id, purchaseDate',
      settings: 'key',
    })
    this.version(3).stores({
      purchases: 'id, purchaseDate',
      settings: 'key',
      periodSnapshots: 'periodLabel',
    })
  }
}

export const db = new AppDatabase()
