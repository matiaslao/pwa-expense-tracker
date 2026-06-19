import type { PurchaseRepository } from '../../domain/repositories/PurchaseRepository'
import { Purchase } from '../../domain/entities/Purchase'
import { calculateBillingPeriod } from '../../domain/services/BillingPeriodCalculator'

export interface CreatePurchaseInput {
  description: string
  amount: number
  installments: number
  purchaseDate: Date
}

export interface UpdatePurchaseInput {
  description?: string
  amount?: number
  installments?: number
  purchaseDate?: Date
}

export class PurchaseService {
  private repository: PurchaseRepository
  private closingDay: number
  private dueDay: number

  constructor(repository: PurchaseRepository, closingDay: number, dueDay: number) {
    this.repository = repository
    this.closingDay = closingDay
    this.dueDay = dueDay
  }

  async createPurchase(input: CreatePurchaseInput): Promise<Purchase> {
    const billingPeriod = calculateBillingPeriod(this.closingDay, input.purchaseDate)
    const firstInstallmentDate = new Date(billingPeriod.year, billingPeriod.month - 1, this.dueDay)
    const purchase = new Purchase({
      id: crypto.randomUUID(),
      ...input,
      currency: 'ARS',
      firstInstallmentDate,
      billingPeriod,
    })
    await this.repository.save(purchase)
    return purchase
  }

  async updatePurchase(id: string, input: UpdatePurchaseInput): Promise<Purchase> {
    const existing = await this.repository.findById(id)
    if (!existing) {
      throw new Error(`Purchase with id ${id} not found`)
    }

    const purchaseDate = input.purchaseDate ?? existing.purchaseDate
    const billingPeriod = input.purchaseDate
      ? calculateBillingPeriod(this.closingDay, input.purchaseDate)
      : existing.billingPeriod
    const firstInstallmentDate = input.purchaseDate
      ? new Date(billingPeriod.year, billingPeriod.month - 1, this.dueDay)
      : existing.firstInstallmentDate

    const updated = new Purchase({
      id: existing.id,
      description: input.description ?? existing.description,
      amount: input.amount ?? existing.amount,
      currency: 'ARS',
      installments: input.installments ?? existing.installments,
      purchaseDate,
      firstInstallmentDate,
      billingPeriod,
    })
    await this.repository.save(updated)
    return updated
  }

  async deletePurchase(id: string): Promise<void> {
    const existing = await this.repository.findById(id)
    if (!existing) {
      throw new Error(`Purchase with id ${id} not found`)
    }
    await this.repository.deleteById(id)
  }

  async getPurchase(id: string): Promise<Purchase | null> {
    return this.repository.findById(id)
  }

  async getAllPurchases(): Promise<Purchase[]> {
    return this.repository.findAll()
  }
}
