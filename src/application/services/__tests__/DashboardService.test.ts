import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest'
import { DashboardService } from '../DashboardService'
import type { PurchaseRepository } from '../../../domain/repositories/PurchaseRepository'
import type { PeriodSnapshotRepository } from '../../../domain/repositories/PeriodSnapshotRepository'
import { Purchase } from '../../../domain/entities/Purchase'
import { PeriodSnapshot } from '../../../domain/entities/PeriodSnapshot'
import { BillingPeriod } from '../../../domain/valueObjects/BillingPeriod'

function date(year: number, month: number, day: number): Date {
  return new Date(year, month - 1, day)
}

function createMockRepository(): PurchaseRepository {
  return {
    save: vi.fn(),
    findById: vi.fn(),
    findAll: vi.fn(),
    deleteById: vi.fn(),
  }
}

function createMockSnapshotRepository(): PeriodSnapshotRepository {
  return {
    save: vi.fn(),
    getLatest: vi.fn(),
    getByPeriod: vi.fn(),
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

describe('DashboardService', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(date(2025, 7, 10))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('getCurrentPeriodSummary', () => {
    it('returns summary for current billing period', async () => {
      const repo = createMockRepository()
      const snapshotRepo = createMockSnapshotRepository()
      vi.mocked(snapshotRepo.getByPeriod).mockResolvedValue(
        new PeriodSnapshot({
          periodLabel: '2025-06',
          closingDate: date(2025, 6, 15),
          dueDate: date(2025, 7, 29),
          totalAmount: 0,
          purchaseCount: 0,
          createdAt: date(2025, 6, 16),
        }),
      )
      vi.mocked(repo.findAll).mockResolvedValue([
        makePurchase({ id: 'p1', amount: 300, installments: 3, billingPeriod: new BillingPeriod(7, 2025) }),
        makePurchase({ id: 'p2', amount: 600, installments: 3, billingPeriod: new BillingPeriod(7, 2025) }),
      ])

      const service = new DashboardService(repo, snapshotRepo, 15, 29)
      const summary = await service.getCurrentPeriodSummary()

      expect(summary.period.month).toBe(7)
      expect(summary.period.year).toBe(2025)
      expect(summary.totalDue).toBe(300)
      expect(summary.purchaseCount).toBe(2)
      expect(summary.closingDay).toBe(15)
      expect(summary.dueDay).toBe(29)
    })

    it('returns zero summary when no purchases in current period', async () => {
      const repo = createMockRepository()
      const snapshotRepo = createMockSnapshotRepository()
      vi.mocked(snapshotRepo.getByPeriod).mockResolvedValue(
        new PeriodSnapshot({
          periodLabel: '2025-06',
          closingDate: date(2025, 6, 15),
          dueDate: date(2025, 7, 29),
          totalAmount: 0,
          purchaseCount: 0,
          createdAt: date(2025, 6, 16),
        }),
      )
      vi.mocked(repo.findAll).mockResolvedValue([
        makePurchase({ billingPeriod: new BillingPeriod(6, 2025) }),
      ])

      const service = new DashboardService(repo, snapshotRepo, 15, 29)
      const summary = await service.getCurrentPeriodSummary()

      expect(summary.purchaseCount).toBe(0)
      expect(summary.totalDue).toBe(0)
    })
  })

  describe('getPreviousPeriodSummary', () => {
    it('returns summary from latest snapshot', async () => {
      const repo = createMockRepository()
      const snapshotRepo = createMockSnapshotRepository()
      vi.mocked(snapshotRepo.getLatest).mockResolvedValue(
        new PeriodSnapshot({
          periodLabel: '2025-06',
          closingDate: date(2025, 6, 25),
          dueDate: date(2025, 7, 8),
          totalAmount: 300,
          purchaseCount: 2,
          createdAt: date(2025, 6, 26),
        }),
      )

      const service = new DashboardService(repo, snapshotRepo, 15, 29)
      const summary = await service.getPreviousPeriodSummary()

      expect(summary).not.toBeNull()
      expect(summary!.period.month).toBe(6)
      expect(summary!.period.year).toBe(2025)
      expect(summary!.totalDue).toBe(300)
      expect(summary!.purchaseCount).toBe(2)
    })

    it('returns closing and due dates from snapshot', async () => {
      const repo = createMockRepository()
      const snapshotRepo = createMockSnapshotRepository()
      vi.mocked(snapshotRepo.getLatest).mockResolvedValue(
        new PeriodSnapshot({
          periodLabel: '2025-06',
          closingDate: date(2025, 6, 25),
          dueDate: date(2025, 7, 8),
          totalAmount: 300,
          purchaseCount: 1,
          createdAt: date(2025, 6, 26),
        }),
      )

      const service = new DashboardService(repo, snapshotRepo, 25, 8)
      const summary = await service.getPreviousPeriodSummary()

      expect(summary).not.toBeNull()
      expect(summary!.closingDate).toEqual(date(2025, 6, 25))
      expect(summary!.dueDate).toEqual(date(2025, 7, 8))
    })

    it('returns null when no snapshot exists', async () => {
      const repo = createMockRepository()
      const snapshotRepo = createMockSnapshotRepository()
      vi.mocked(snapshotRepo.getLatest).mockResolvedValue(null)

      const service = new DashboardService(repo, snapshotRepo, 15, 29)
      const summary = await service.getPreviousPeriodSummary()

      expect(summary).toBeNull()
    })
  })

  describe('getFutureCommitments', () => {
    it('returns future installments grouped by period', async () => {
      const repo = createMockRepository()
      const snapshotRepo = createMockSnapshotRepository()
      vi.mocked(snapshotRepo.getByPeriod).mockResolvedValue(
        new PeriodSnapshot({
          periodLabel: '2025-06',
          closingDate: date(2025, 6, 15),
          dueDate: date(2025, 7, 29),
          totalAmount: 0,
          purchaseCount: 0,
          createdAt: date(2025, 6, 16),
        }),
      )
      vi.mocked(repo.findAll).mockResolvedValue([
        makePurchase({
          id: 'p1',
          amount: 300,
          installments: 3,
          firstInstallmentDate: date(2025, 7, 15),
          billingPeriod: new BillingPeriod(7, 2025),
        }),
      ])

      const service = new DashboardService(repo, snapshotRepo, 15, 29)
      const commitments = await service.getFutureCommitments()

      expect(commitments).toHaveLength(2)
      expect(commitments[0].period.month).toBe(8)
      expect(commitments[0].period.year).toBe(2025)
      expect(commitments[0].totalAmount).toBe(100)
      expect(commitments[1].period.month).toBe(9)
      expect(commitments[1].period.year).toBe(2025)
      expect(commitments[1].totalAmount).toBe(100)
    })

    it('sorts commitments chronologically', async () => {
      const repo = createMockRepository()
      const snapshotRepo = createMockSnapshotRepository()
      vi.mocked(snapshotRepo.getByPeriod).mockResolvedValue(
        new PeriodSnapshot({
          periodLabel: '2025-09',
          closingDate: date(2025, 9, 15),
          dueDate: date(2025, 10, 29),
          totalAmount: 0,
          purchaseCount: 0,
          createdAt: date(2025, 9, 16),
        }),
      )
      vi.mocked(repo.findAll).mockResolvedValue([
        makePurchase({
          id: 'p1',
          amount: 300,
          installments: 3,
          firstInstallmentDate: date(2025, 10, 15),
          billingPeriod: new BillingPeriod(10, 2025),
        }),
      ])

      const service = new DashboardService(repo, snapshotRepo, 15, 29)
      const commitments = await service.getFutureCommitments()

      expect(commitments.map(c => c.period.month)).toEqual([11, 12])
    })

    it('returns empty when no future commitments', async () => {
      const repo = createMockRepository()
      const snapshotRepo = createMockSnapshotRepository()
      vi.mocked(repo.findAll).mockResolvedValue([])

      const service = new DashboardService(repo, snapshotRepo, 15, 29)
      const commitments = await service.getFutureCommitments()

      expect(commitments).toEqual([])
    })
  })

  describe('getActivePurchases', () => {
    it('returns purchases with remaining installments', async () => {
      const repo = createMockRepository()
      const snapshotRepo = createMockSnapshotRepository()
      vi.mocked(repo.findAll).mockResolvedValue([
        makePurchase({ id: 'p1', amount: 100, installments: 1 }),
        makePurchase({ id: 'p2', amount: 300, installments: 3 }),
      ])

      const service = new DashboardService(repo, snapshotRepo, 15, 29)
      const active = await service.getActivePurchases()

      expect(active).toHaveLength(2)
    })

    it('excludes purchases with zero remaining installments', async () => {
      const repo = createMockRepository()
      const snapshotRepo = createMockSnapshotRepository()
      const pastPurchase = makePurchase({
        id: 'p1',
        amount: 100,
        installments: 1,
        firstInstallmentDate: date(2024, 1, 15),
      })
      vi.mocked(repo.findAll).mockResolvedValue([
        pastPurchase,
        makePurchase({ id: 'p2', amount: 300, installments: 3 }),
      ])

      const service = new DashboardService(repo, snapshotRepo, 15, 29)
      const active = await service.getActivePurchases()

      expect(active).toHaveLength(1)
      expect(active[0].id).toBe('p2')
    })

    it('sorts by purchaseDate descending', async () => {
      const repo = createMockRepository()
      const snapshotRepo = createMockSnapshotRepository()
      vi.mocked(repo.findAll).mockResolvedValue([
        makePurchase({ id: 'p1', purchaseDate: date(2025, 6, 10) }),
        makePurchase({ id: 'p2', purchaseDate: date(2025, 7, 15) }),
        makePurchase({ id: 'p3', purchaseDate: date(2025, 5, 1) }),
      ])

      const service = new DashboardService(repo, snapshotRepo, 15, 29)
      const active = await service.getActivePurchases()

      expect(active).toHaveLength(3)
      expect(active[0].id).toBe('p2')
      expect(active[1].id).toBe('p1')
      expect(active[2].id).toBe('p3')
    })

    it('removes completed purchases automatically', async () => {
      const repo = createMockRepository()
      const snapshotRepo = createMockSnapshotRepository()
      vi.mocked(snapshotRepo.getByPeriod).mockResolvedValue(
        new PeriodSnapshot({
          periodLabel: '2025-06',
          closingDate: date(2025, 6, 15),
          dueDate: date(2025, 7, 29),
          totalAmount: 0,
          purchaseCount: 0,
          createdAt: date(2025, 6, 16),
        }),
      )
      const completePurchase = makePurchase({
        id: 'p1',
        amount: 100,
        installments: 1,
        firstInstallmentDate: date(2024, 1, 15),
      })
      vi.mocked(repo.findAll).mockResolvedValue([completePurchase])

      const service = new DashboardService(repo, snapshotRepo, 15, 29)
      await service.getActivePurchases()

      expect(repo.deleteById).toHaveBeenCalledWith('p1')
    })
  })
})
