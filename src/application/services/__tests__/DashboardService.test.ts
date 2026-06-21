import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest'
import { DashboardService } from '../DashboardService'
import type { PurchaseRepository } from '../../../domain/repositories/PurchaseRepository'
import { Purchase } from '../../../domain/entities/Purchase'
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
      vi.mocked(repo.findAll).mockResolvedValue([
        makePurchase({ id: 'p1', amount: 300, installments: 3, billingPeriod: new BillingPeriod(7, 2025) }),
        makePurchase({ id: 'p2', amount: 600, installments: 3, billingPeriod: new BillingPeriod(7, 2025) }),
      ])

      const service = new DashboardService(repo, 15, 29)
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
      vi.mocked(repo.findAll).mockResolvedValue([
        makePurchase({ billingPeriod: new BillingPeriod(6, 2025) }),
      ])

      const service = new DashboardService(repo, 15, 29)
      const summary = await service.getCurrentPeriodSummary()

      expect(summary.purchaseCount).toBe(0)
      expect(summary.totalDue).toBe(0)
    })
  })

  describe('getPreviousPeriodSummary', () => {
    it('returns summary for the most recently closed billing period', async () => {
      const repo = createMockRepository()
      vi.mocked(repo.findAll).mockResolvedValue([
        makePurchase({ id: 'p1', amount: 300, installments: 3, billingPeriod: new BillingPeriod(6, 2025) }),
        makePurchase({ id: 'p2', amount: 600, installments: 3, billingPeriod: new BillingPeriod(6, 2025) }),
      ])

      const service = new DashboardService(repo, 15, 29)
      const summary = await service.getPreviousPeriodSummary()

      expect(summary.period.month).toBe(6)
      expect(summary.period.year).toBe(2025)
      expect(summary.totalDue).toBe(300)
      expect(summary.purchaseCount).toBe(2)
    })

    it('computes closing and due dates correctly', async () => {
      const repo = createMockRepository()
      vi.mocked(repo.findAll).mockResolvedValue([
        makePurchase({ billingPeriod: new BillingPeriod(6, 2025) }),
      ])

      const service = new DashboardService(repo, 25, 8)
      const summary = await service.getPreviousPeriodSummary()

      expect(summary.closingDate).toEqual(date(2025, 6, 25))
      expect(summary.dueDate).toEqual(date(2025, 7, 8))
    })

    it('handles year boundary for previous period', async () => {
      vi.setSystemTime(date(2025, 1, 10))

      const repo = createMockRepository()
      vi.mocked(repo.findAll).mockResolvedValue([
        makePurchase({ id: 'p1', amount: 300, installments: 3, billingPeriod: new BillingPeriod(12, 2024) }),
      ])

      const service = new DashboardService(repo, 15, 29)
      const summary = await service.getPreviousPeriodSummary()

      expect(summary.period.month).toBe(12)
      expect(summary.period.year).toBe(2024)
      expect(summary.totalDue).toBe(100)
      expect(summary.purchaseCount).toBe(1)
    })

    it('returns zero summary when no purchases in previous period', async () => {
      const repo = createMockRepository()
      vi.mocked(repo.findAll).mockResolvedValue([
        makePurchase({ billingPeriod: new BillingPeriod(7, 2025) }),
      ])

      const service = new DashboardService(repo, 15, 29)
      const summary = await service.getPreviousPeriodSummary()

      expect(summary.purchaseCount).toBe(0)
      expect(summary.totalDue).toBe(0)
    })
  })

  describe('getFutureCommitments', () => {
    it('returns future installments grouped by period', async () => {
      const repo = createMockRepository()
      vi.mocked(repo.findAll).mockResolvedValue([
        makePurchase({
          id: 'p1',
          amount: 300,
          installments: 3,
          firstInstallmentDate: date(2025, 7, 15),
          billingPeriod: new BillingPeriod(7, 2025),
        }),
      ])

      const service = new DashboardService(repo, 15, 29)
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
      vi.mocked(repo.findAll).mockResolvedValue([
        makePurchase({
          id: 'p1',
          amount: 300,
          installments: 3,
          firstInstallmentDate: date(2025, 10, 15),
          billingPeriod: new BillingPeriod(10, 2025),
        }),
      ])

      const service = new DashboardService(repo, 15, 29)
      const commitments = await service.getFutureCommitments()

      expect(commitments.map(c => c.period.month)).toEqual([11, 12])
    })

    it('returns empty when no future commitments', async () => {
      const repo = createMockRepository()
      vi.mocked(repo.findAll).mockResolvedValue([])

      const service = new DashboardService(repo, 15, 29)
      const commitments = await service.getFutureCommitments()

      expect(commitments).toEqual([])
    })
  })

  describe('getActivePurchases', () => {
    it('returns purchases with remaining installments', async () => {
      const repo = createMockRepository()
      vi.mocked(repo.findAll).mockResolvedValue([
        makePurchase({ id: 'p1', amount: 100, installments: 1 }),
        makePurchase({ id: 'p2', amount: 300, installments: 3 }),
      ])

      const service = new DashboardService(repo, 15, 29)
      const active = await service.getActivePurchases()

      expect(active).toHaveLength(2)
    })

    it('excludes archived purchases', async () => {
      const repo = createMockRepository()
      vi.mocked(repo.findAll).mockResolvedValue([
        makePurchase({ id: 'p1', amount: 300, installments: 3, isArchived: true }),
        makePurchase({ id: 'p2', amount: 300, installments: 3 }),
      ])

      const service = new DashboardService(repo, 15, 29)
      const active = await service.getActivePurchases()

      expect(active).toHaveLength(1)
      expect(active[0].id).toBe('p2')
    })

    it('sorts by purchaseDate descending', async () => {
      const repo = createMockRepository()
      vi.mocked(repo.findAll).mockResolvedValue([
        makePurchase({ id: 'p1', purchaseDate: date(2025, 6, 10) }),
        makePurchase({ id: 'p2', purchaseDate: date(2025, 7, 15) }),
        makePurchase({ id: 'p3', purchaseDate: date(2025, 5, 1) }),
      ])

      const service = new DashboardService(repo, 15, 29)
      const active = await service.getActivePurchases()

      expect(active).toHaveLength(3)
      expect(active[0].id).toBe('p2')
      expect(active[1].id).toBe('p1')
      expect(active[2].id).toBe('p3')
    })

    it('archives completed purchases automatically', async () => {
      const repo = createMockRepository()
      const completePurchase = makePurchase({
        id: 'p1',
        amount: 100,
        installments: 1,
        firstInstallmentDate: date(2024, 1, 15),
      })
      vi.mocked(repo.findAll).mockResolvedValue([completePurchase])

      const service = new DashboardService(repo, 15, 29)
      await service.getActivePurchases()

      expect(repo.save).toHaveBeenCalled()
      expect(completePurchase.isArchived).toBe(true)
    })
  })

  describe('period summaries include archived purchases', () => {
    it('current period summary includes archived purchases', async () => {
      const repo = createMockRepository()
      vi.mocked(repo.findAll).mockResolvedValue([
        makePurchase({ id: 'p1', amount: 300, installments: 3, billingPeriod: new BillingPeriod(7, 2025), isArchived: true }),
        makePurchase({ id: 'p2', amount: 300, installments: 3, billingPeriod: new BillingPeriod(7, 2025) }),
      ])

      const service = new DashboardService(repo, 15, 29)
      const summary = await service.getCurrentPeriodSummary()

      expect(summary.purchaseCount).toBe(2)
      expect(summary.totalDue).toBe(200)
    })

    it('previous period summary includes archived purchases', async () => {
      const repo = createMockRepository()
      vi.mocked(repo.findAll).mockResolvedValue([
        makePurchase({ id: 'p1', amount: 300, installments: 3, billingPeriod: new BillingPeriod(6, 2025), isArchived: true }),
        makePurchase({ id: 'p2', amount: 300, installments: 3, billingPeriod: new BillingPeriod(6, 2025) }),
      ])

      const service = new DashboardService(repo, 15, 29)
      const summary = await service.getPreviousPeriodSummary()

      expect(summary.purchaseCount).toBe(2)
      expect(summary.totalDue).toBe(200)
    })
  })
})
