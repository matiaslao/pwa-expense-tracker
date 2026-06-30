import { describe, it, expect, vi } from 'vitest'
import { PeriodSnapshotService } from '../PeriodSnapshotService'
import type { PurchaseRepository } from '../../../domain/repositories/PurchaseRepository'
import type { PeriodSnapshotRepository } from '../../../domain/repositories/PeriodSnapshotRepository'
import { Purchase } from '../../../domain/entities/Purchase'
import { BillingPeriod } from '../../../domain/valueObjects/BillingPeriod'

function date(year: number, month: number, day: number): Date {
  return new Date(year, month - 1, day)
}

function createMockPurchaseRepo(): PurchaseRepository {
  return {
    save: vi.fn(),
    findById: vi.fn(),
    findAll: vi.fn(),
    deleteById: vi.fn(),
  }
}

function createMockSnapshotRepo(): PeriodSnapshotRepository {
  return {
    save: vi.fn(),
    findLatest: vi.fn(),
    findAll: vi.fn(),
  }
}

function makePurchase(overrides: Record<string, unknown> = {}) {
  return new Purchase({
    id: 'p1',
    description: 'Test',
    amount: 300,
    currency: 'ARS' as const,
    installments: 3,
    purchaseDate: date(2025, 6, 10),
    firstInstallmentDate: date(2025, 7, 15),
    billingPeriod: new BillingPeriod(6, 2025),
    ...overrides,
  })
}

describe('PeriodSnapshotService', () => {
  describe('getLatestSnapshot', () => {
    it('returns null when no snapshots', async () => {
      const purchaseRepo = createMockPurchaseRepo()
      const snapshotRepo = createMockSnapshotRepo()
      vi.mocked(snapshotRepo.findLatest).mockResolvedValue(null)

      const service = new PeriodSnapshotService(purchaseRepo, snapshotRepo)
      const result = await service.getLatestSnapshot()

      expect(result).toBeNull()
    })

    it('returns the latest snapshot', async () => {
      const purchaseRepo = createMockPurchaseRepo()
      const snapshotRepo = createMockSnapshotRepo()
      const expected = {
        id: 's1',
        period: new BillingPeriod(7, 2026),
        closingDate: new Date(),
        dueDate: new Date(),
        totalAmount: 500,
        purchaseCount: 3,
        capturedAt: new Date(),
      }
      vi.mocked(snapshotRepo.findLatest).mockResolvedValue(expected)

      const service = new PeriodSnapshotService(purchaseRepo, snapshotRepo)
      const result = await service.getLatestSnapshot()

      expect(result).toBe(expected)
    })
  })

  describe('getAllSnapshots', () => {
    it('returns empty array when no snapshots', async () => {
      const purchaseRepo = createMockPurchaseRepo()
      const snapshotRepo = createMockSnapshotRepo()
      vi.mocked(snapshotRepo.findAll).mockResolvedValue([])

      const service = new PeriodSnapshotService(purchaseRepo, snapshotRepo)
      const result = await service.getAllSnapshots()

      expect(result).toEqual([])
    })
  })

  describe('checkAndCapture', () => {
    it('returns null when closing date has not passed', async () => {
      const purchaseRepo = createMockPurchaseRepo()
      const snapshotRepo = createMockSnapshotRepo()
      const service = new PeriodSnapshotService(purchaseRepo, snapshotRepo)

      const futureClosing = new Date()
      futureClosing.setFullYear(futureClosing.getFullYear() + 1)
      const result = await service.checkAndCapture(futureClosing, new Date())

      expect(result).toBeNull()
    })

    it('captures snapshot when closing date has passed', async () => {
      const purchaseRepo = createMockPurchaseRepo()
      const snapshotRepo = createMockSnapshotRepo()
      vi.mocked(snapshotRepo.findLatest).mockResolvedValue(null)
      vi.mocked(purchaseRepo.findAll).mockResolvedValue([
        makePurchase({
          id: 'p1',
          amount: 300,
          installments: 3,
          billingPeriod: new BillingPeriod(7, 2025),
        }),
      ])

      const closingDate = date(2025, 7, 15)
      const dueDate = date(2025, 7, 29)

      vi.useFakeTimers()
      vi.setSystemTime(date(2025, 7, 20))

      const service = new PeriodSnapshotService(purchaseRepo, snapshotRepo)
      const result = await service.checkAndCapture(closingDate, dueDate)

      expect(result).not.toBeNull()
      expect(snapshotRepo.save).toHaveBeenCalledTimes(1)
      const savedSnapshot = (snapshotRepo.save as ReturnType<typeof vi.fn>).mock.calls[0][0]
      expect(savedSnapshot.period.month).toBe(7)
      expect(savedSnapshot.period.year).toBe(2025)

      // closing date should advance to next month
      expect(result!.closingDate.getMonth()).toBe(7)
      expect(result!.closingDate.getDate()).toBe(15)

      vi.useRealTimers()
    })

    it('skips capture when snapshot for period already exists', async () => {
      const purchaseRepo = createMockPurchaseRepo()
      const snapshotRepo = createMockSnapshotRepo()
      vi.mocked(snapshotRepo.findLatest).mockResolvedValue({
        id: 'existing',
        period: new BillingPeriod(7, 2025),
        closingDate: new Date(),
        dueDate: new Date(),
        totalAmount: 300,
        purchaseCount: 2,
        capturedAt: new Date(),
      })

      const closingDate = date(2025, 7, 15)
      const dueDate = date(2025, 7, 29)

      vi.useFakeTimers()
      vi.setSystemTime(date(2025, 7, 20))

      const service = new PeriodSnapshotService(purchaseRepo, snapshotRepo)
      const result = await service.checkAndCapture(closingDate, dueDate)

      expect(result).toBeNull()
      expect(snapshotRepo.save).not.toHaveBeenCalled()

      vi.useRealTimers()
    })

    it('handles multiple missed closing dates', async () => {
      const purchaseRepo = createMockPurchaseRepo()
      const snapshotRepo = createMockSnapshotRepo()
      vi.mocked(snapshotRepo.findLatest).mockResolvedValue(null)
      vi.mocked(purchaseRepo.findAll).mockResolvedValue([])

      const closingDate = date(2025, 6, 15)
      const dueDate = date(2025, 6, 29)

      vi.useFakeTimers()
      vi.setSystemTime(date(2025, 9, 1))

      const service = new PeriodSnapshotService(purchaseRepo, snapshotRepo)
      const result = await service.checkAndCapture(closingDate, dueDate)

      expect(result).not.toBeNull()
      // should capture Jun, Jul, Aug and advance to Sep 15
      expect(snapshotRepo.save).toHaveBeenCalledTimes(3)
      expect(result!.closingDate.getMonth()).toBe(8)
      expect(result!.closingDate.getDate()).toBe(15)

      vi.useRealTimers()
    })
  })
})
