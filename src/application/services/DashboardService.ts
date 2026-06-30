import type { PurchaseRepository } from '../../domain/repositories/PurchaseRepository'
import type { Purchase } from '../../domain/entities/Purchase'
import { BillingPeriod } from '../../domain/valueObjects/BillingPeriod'
import { calculateBillingPeriod } from '../../domain/services/BillingPeriodCalculator'

export interface CurrentPeriodSummary {
  period: BillingPeriod
  totalDue: number
  installmentCount: number
  closingDate: Date
  dueDate: Date
}

export interface FutureCommitment {
  period: BillingPeriod
  totalAmount: number
}

export class DashboardService {
  private repository: PurchaseRepository
  private closingDate: Date
  private dueDate: Date

  constructor(repository: PurchaseRepository, closingDate: Date, dueDate: Date) {
    this.repository = repository
    this.closingDate = closingDate
    this.dueDate = dueDate
  }

  async getCurrentPeriodSummary(): Promise<CurrentPeriodSummary> {
    const now = new Date()
    const currentPeriod = calculateBillingPeriod(this.closingDate, now)
    const purchases = await this.repository.findAll()
    const inPeriod = purchases.filter(p => p.billingPeriod.equals(currentPeriod))

    let totalDue = 0
    for (const purchase of inPeriod) {
      const installments = purchase.generateInstallments()
      if (installments.length > 0) {
        totalDue += installments[0].amount
      }
    }

    return {
      period: currentPeriod,
      totalDue,
      installmentCount: inPeriod.length,
      closingDate: this.closingDate,
      dueDate: this.dueDate,
    }
  }

  async getFutureCommitments(): Promise<FutureCommitment[]> {
    const now = new Date()
    const currentPeriod = calculateBillingPeriod(this.closingDate, now)
    const purchases = await this.repository.findAll()
    const commitments = new Map<string, number>()

    for (const purchase of purchases) {
      const installments = purchase.generateInstallments()
      for (let i = 1; i < installments.length; i++) {
        const inst = installments[i]
        const dueMonth = inst.dueDate.getMonth() + 1
        const dueYear = inst.dueDate.getFullYear()
        const period = new BillingPeriod(dueMonth, dueYear)

        if (period.isAfter(currentPeriod)) {
          const key = period.toString()
          commitments.set(key, (commitments.get(key) ?? 0) + inst.amount)
        }
      }
    }

    return Array.from(commitments.entries())
      .map(([key, totalAmount]) => {
        const [yearStr, monthStr] = key.split('-')
        return {
          period: new BillingPeriod(Number(monthStr), Number(yearStr)),
          totalAmount,
        }
      })
      .sort((a, b) => {
        if (a.period.year !== b.period.year) return a.period.year - b.period.year
        return a.period.month - b.period.month
      })
  }

  async getActivePurchases(): Promise<Purchase[]> {
    const purchases = await this.repository.findAll()
    return purchases
      .filter(p => {
        const remaining = p.getRemainingInstallments(0)
        return remaining.length > 0
      })
      .sort((a, b) => b.purchaseDate.getTime() - a.purchaseDate.getTime())
  }
}
