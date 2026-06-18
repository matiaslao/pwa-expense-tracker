import type { PurchaseRepository } from '../../domain/repositories/PurchaseRepository'
import type { PurchaseRecord } from '../database/db'
import { AppDatabase } from '../database/db'
import { Purchase } from '../../domain/entities/Purchase'
import { BillingPeriod } from '../../domain/valueObjects/BillingPeriod'

function toRecord(purchase: Purchase): PurchaseRecord {
  return {
    id: purchase.id,
    description: purchase.description,
    amount: purchase.amount,
    currency: purchase.currency,
    installments: purchase.installments,
    purchaseDate: purchase.purchaseDate,
    firstInstallmentDate: purchase.firstInstallmentDate,
    billingPeriodMonth: purchase.billingPeriod.month,
    billingPeriodYear: purchase.billingPeriod.year,
  }
}

function toDomain(record: PurchaseRecord): Purchase {
  return new Purchase({
    id: record.id,
    description: record.description,
    amount: record.amount,
    currency: record.currency as 'ARS',
    installments: record.installments,
    purchaseDate: record.purchaseDate,
    firstInstallmentDate: record.firstInstallmentDate,
    billingPeriod: new BillingPeriod(record.billingPeriodMonth, record.billingPeriodYear),
  })
}

export class PurchaseRepositoryImpl implements PurchaseRepository {
  private db: AppDatabase

  constructor(db?: AppDatabase) {
    this.db = db ?? new AppDatabase()
  }

  async save(purchase: Purchase): Promise<void> {
    await this.db.purchases.put(toRecord(purchase))
  }

  async findById(id: string): Promise<Purchase | null> {
    const record = await this.db.purchases.get(id)
    return record ? toDomain(record) : null
  }

  async findAll(): Promise<Purchase[]> {
    const records = await this.db.purchases.toArray()
    return records.map(toDomain)
  }

  async deleteById(id: string): Promise<void> {
    await this.db.purchases.delete(id)
  }
}
