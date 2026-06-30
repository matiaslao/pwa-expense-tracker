import type { PurchaseRepository } from '../../domain/repositories/PurchaseRepository'
import type { PeriodSnapshotRepository } from '../../domain/repositories/PeriodSnapshotRepository'
import type { PeriodSnapshot } from '../../domain/types/PeriodSnapshot'
import type { CardSettings } from '../../domain/types/CardSettings'
import { calculateBillingPeriod, nextClosingDate } from '../../domain/services/BillingPeriodCalculator'

export class PeriodSnapshotService {
  private purchaseRepo: PurchaseRepository
  private snapshotRepo: PeriodSnapshotRepository

  constructor(purchaseRepo: PurchaseRepository, snapshotRepo: PeriodSnapshotRepository) {
    this.purchaseRepo = purchaseRepo
    this.snapshotRepo = snapshotRepo
  }

  async getLatestSnapshot(): Promise<PeriodSnapshot | null> {
    return this.snapshotRepo.findLatest()
  }

  async getAllSnapshots(): Promise<PeriodSnapshot[]> {
    return this.snapshotRepo.findAll()
  }

  async checkAndCapture(closingDate: Date, dueDate: Date): Promise<CardSettings | null> {
    const now = new Date()
    let currentClosing = new Date(closingDate)
    let currentDue = new Date(dueDate)
    let captured = false

    while (now >= currentClosing) {
      const dayBefore = new Date(currentClosing)
      dayBefore.setDate(dayBefore.getDate() - 1)
      const closedPeriod = calculateBillingPeriod(currentClosing, dayBefore)

      const latest = await this.snapshotRepo.findLatest()
      if (latest && latest.period.equals(closedPeriod)) break

      const allPurchases = await this.purchaseRepo.findAll()
      const inPeriod = allPurchases.filter(p => p.billingPeriod.equals(closedPeriod))

      let totalAmount = 0
      for (const purchase of inPeriod) {
        const installments = purchase.generateInstallments()
        if (installments.length > 0) totalAmount += installments[0].amount
      }

      const snapshot: PeriodSnapshot = {
        id: crypto.randomUUID(),
        period: closedPeriod,
        closingDate: new Date(currentClosing),
        dueDate: new Date(currentDue),
        totalAmount,
        purchaseCount: inPeriod.length,
        capturedAt: now,
      }

      await this.snapshotRepo.save(snapshot)
      captured = true

      currentClosing = nextClosingDate(currentClosing)
      currentDue = nextClosingDate(currentDue)
    }

    return captured ? { closingDate: currentClosing, dueDate: currentDue } : null
  }
}
