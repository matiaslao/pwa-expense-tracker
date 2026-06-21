import type { PurchaseRepository } from '../../domain/repositories/PurchaseRepository'
import type { PeriodSnapshotRepository } from '../../domain/repositories/PeriodSnapshotRepository'
import type { Purchase } from '../../domain/entities/Purchase'
import { PeriodSnapshot } from '../../domain/entities/PeriodSnapshot'
import { BillingPeriod } from '../../domain/valueObjects/BillingPeriod'
import { calculateBillingPeriod } from '../../domain/services/BillingPeriodCalculator'

export interface CurrentPeriodSummary {
  period: BillingPeriod
  totalDue: number
  purchaseCount: number
  closingDay: number
  dueDay: number
}

export interface PreviousPeriodSummary {
  period: BillingPeriod
  totalDue: number
  purchaseCount: number
  closingDate: Date
  dueDate: Date
}

export interface FutureCommitment {
  period: BillingPeriod
  totalAmount: number
}

export class DashboardService {
  private repository: PurchaseRepository
  private snapshotRepository: PeriodSnapshotRepository
  private closingDay: number
  private dueDay: number

  constructor(repository: PurchaseRepository, snapshotRepository: PeriodSnapshotRepository, closingDay: number, dueDay: number) {
    this.repository = repository
    this.snapshotRepository = snapshotRepository
    this.closingDay = closingDay
    this.dueDay = dueDay
  }

  async getCurrentPeriodSummary(): Promise<CurrentPeriodSummary> {
    const now = new Date()
    const currentPeriod = calculateBillingPeriod(this.closingDay, now)
    await this.checkPeriodClose(currentPeriod)
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
      purchaseCount: inPeriod.length,
      closingDay: this.closingDay,
      dueDay: this.dueDay,
    }
  }

  async getPreviousPeriodSummary(): Promise<PreviousPeriodSummary | null> {
    const snapshot = await this.snapshotRepository.getLatest()
    if (!snapshot) return null

    const [yearStr, monthStr] = snapshot.periodLabel.split('-')
    return {
      period: new BillingPeriod(Number(monthStr), Number(yearStr)),
      totalDue: snapshot.totalAmount,
      purchaseCount: snapshot.purchaseCount,
      closingDate: snapshot.closingDate,
      dueDate: snapshot.dueDate,
    }
  }

  async getFutureCommitments(): Promise<FutureCommitment[]> {
    const now = new Date()
    const currentPeriod = calculateBillingPeriod(this.closingDay, now)
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
    const now = new Date()
    const currentPeriod = calculateBillingPeriod(this.closingDay, now)
    await this.checkPeriodClose(currentPeriod)
    const purchases = await this.repository.findAll()
    await this.removeCompletedPurchases(purchases)
    const remaining = await this.repository.findAll()
    return remaining
      .filter(p => p.getRemainingInstallments(0).length > 0)
      .sort((a, b) => b.purchaseDate.getTime() - a.purchaseDate.getTime())
  }

  private async removeCompletedPurchases(purchases: Purchase[]): Promise<void> {
    for (const purchase of purchases) {
      if (purchase.isComplete()) {
        await this.repository.deleteById(purchase.id)
      }
    }
  }

  private async checkPeriodClose(currentPeriod: BillingPeriod): Promise<void> {
    const previousPeriod = currentPeriod.previous()
    const closingDate = new Date(previousPeriod.year, previousPeriod.month - 1, this.closingDay)
    const now = new Date()

    if (closingDate < now) {
      const existing = await this.snapshotRepository.getByPeriod(previousPeriod.toString())
      if (!existing) {
        const purchases = await this.repository.findAll()
        const inPeriod = purchases.filter(p => p.billingPeriod.equals(previousPeriod))

        let totalDue = 0
        for (const purchase of inPeriod) {
          const installments = purchase.generateInstallments()
          if (installments.length > 0) {
            totalDue += installments[0].amount
          }
        }

        const dueDate = new Date(previousPeriod.year, previousPeriod.month, this.dueDay)

        const snapshot = new PeriodSnapshot({
          periodLabel: previousPeriod.toString(),
          closingDate,
          dueDate,
          totalAmount: totalDue,
          purchaseCount: inPeriod.length,
          createdAt: now,
        })

        await this.snapshotRepository.save(snapshot)
      }
    }
  }
}
