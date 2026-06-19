import { describe, it, expect, vi } from 'vitest'
import { PurchaseService, type CreatePurchaseInput } from '../PurchaseService'
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

function validCreateInput(overrides: Partial<CreatePurchaseInput> = {}): CreatePurchaseInput {
  return {
    description: 'Test purchase',
    amount: 300,
    installments: 3,
    purchaseDate: date(2025, 6, 10),
    ...overrides,
  }
}

describe('PurchaseService', () => {
  describe('createPurchase', () => {
    it('creates a purchase with correct billing period', async () => {
      const repo = createMockRepository()
      const service = new PurchaseService(repo, 15, 29)

      const purchase = await service.createPurchase(validCreateInput())

      expect(purchase.description).toBe('Test purchase')
      expect(purchase.amount).toBe(300)
      expect(purchase.installments).toBe(3)
      expect(purchase.currency).toBe('ARS')
      expect(purchase.id).toBeTruthy()
      expect(purchase.billingPeriod.month).toBe(6)
      expect(purchase.billingPeriod.year).toBe(2025)
      expect(repo.save).toHaveBeenCalledWith(purchase)
    })

    it('assigns purchase after closing day to next billing period', async () => {
      const repo = createMockRepository()
      const service = new PurchaseService(repo, 15, 29)

      const purchase = await service.createPurchase(
        validCreateInput({ purchaseDate: date(2025, 6, 20) })
      )

      expect(purchase.billingPeriod.month).toBe(7)
      expect(purchase.billingPeriod.year).toBe(2025)
    })

    it('rejects invalid purchase data', async () => {
      const repo = createMockRepository()
      const service = new PurchaseService(repo, 15, 29)

      await expect(
        service.createPurchase(validCreateInput({ amount: 0 }))
      ).rejects.toThrow('amount must be positive')
      expect(repo.save).not.toHaveBeenCalled()
    })

    it('auto-calculates firstInstallmentDate from billing period and dueDay', async () => {
      const repo = createMockRepository()
      const service = new PurchaseService(repo, 15, 29)

      const purchase = await service.createPurchase(
        validCreateInput({ purchaseDate: date(2025, 6, 10) })
      )

      expect(purchase.firstInstallmentDate).toEqual(date(2025, 6, 29))
    })

    it('auto-calculates firstInstallmentDate for next period when after closing day', async () => {
      const repo = createMockRepository()
      const service = new PurchaseService(repo, 15, 29)

      const purchase = await service.createPurchase(
        validCreateInput({ purchaseDate: date(2025, 6, 20) })
      )

      expect(purchase.firstInstallmentDate).toEqual(date(2025, 7, 29))
    })

    it('handles dueDay=31 in a 30-day month by rolling to next month', async () => {
      const repo = createMockRepository()
      const service = new PurchaseService(repo, 15, 31)

      const purchase = await service.createPurchase(
        validCreateInput({ purchaseDate: date(2025, 4, 10) })
      )

      expect(purchase.billingPeriod.month).toBe(4)
      expect(purchase.firstInstallmentDate).toEqual(date(2025, 5, 1))
    })

    it('handles dueDay=29 in February non-leap year by rolling to March', async () => {
      const repo = createMockRepository()
      const service = new PurchaseService(repo, 15, 29)

      const purchase = await service.createPurchase(
        validCreateInput({ purchaseDate: date(2025, 2, 10) })
      )

      expect(purchase.billingPeriod.month).toBe(2)
      expect(purchase.firstInstallmentDate).toEqual(date(2025, 3, 1))
    })

    it('handles dueDay=29 in February leap year correctly', async () => {
      const repo = createMockRepository()
      const service = new PurchaseService(repo, 15, 29)

      const purchase = await service.createPurchase(
        validCreateInput({ purchaseDate: date(2024, 2, 10) })
      )

      expect(purchase.billingPeriod.month).toBe(2)
      expect(purchase.firstInstallmentDate).toEqual(date(2024, 2, 29))
    })

    it('assigns next period when purchase is on closing day', async () => {
      const repo = createMockRepository()
      const service = new PurchaseService(repo, 15, 20)

      const purchase = await service.createPurchase(
        validCreateInput({ purchaseDate: date(2025, 6, 15) })
      )

      expect(purchase.billingPeriod.month).toBe(7)
      expect(purchase.firstInstallmentDate).toEqual(date(2025, 7, 20))
    })

    it('handles year boundary for December purchase after closing day', async () => {
      const repo = createMockRepository()
      const service = new PurchaseService(repo, 15, 10)

      const purchase = await service.createPurchase(
        validCreateInput({ purchaseDate: date(2025, 12, 20) })
      )

      expect(purchase.billingPeriod.month).toBe(1)
      expect(purchase.billingPeriod.year).toBe(2026)
      expect(purchase.firstInstallmentDate).toEqual(date(2026, 1, 10))
    })
  })

  describe('updatePurchase', () => {
    it('updates purchase fields', async () => {
      const repo = createMockRepository()
      const existing = new Purchase({
        id: 'p1',
        description: 'Old description',
        amount: 100,
        currency: 'ARS',
        installments: 1,
        purchaseDate: date(2025, 6, 10),
        firstInstallmentDate: date(2025, 7, 15),
        billingPeriod: new BillingPeriod(6, 2025),
      })
      vi.mocked(repo.findById).mockResolvedValue(existing)

      const service = new PurchaseService(repo, 15, 29)
      const updated = await service.updatePurchase('p1', {
        description: 'New description',
        amount: 200,
      })

      expect(updated.description).toBe('New description')
      expect(updated.amount).toBe(200)
      expect(updated.billingPeriod.equals(new BillingPeriod(6, 2025))).toBe(true)
      expect(repo.save).toHaveBeenCalledWith(updated)
    })

    it('recalculates billing period and firstInstallmentDate when purchaseDate changes', async () => {
      const repo = createMockRepository()
      const existing = new Purchase({
        id: 'p1',
        description: 'Test',
        amount: 100,
        currency: 'ARS',
        installments: 1,
        purchaseDate: date(2025, 6, 10),
        firstInstallmentDate: date(2025, 7, 15),
        billingPeriod: new BillingPeriod(6, 2025),
      })
      vi.mocked(repo.findById).mockResolvedValue(existing)

      const service = new PurchaseService(repo, 15, 29)
      const updated = await service.updatePurchase('p1', {
        purchaseDate: date(2025, 6, 20),
      })

      expect(updated.billingPeriod.equals(new BillingPeriod(7, 2025))).toBe(true)
      expect(updated.firstInstallmentDate).toEqual(date(2025, 7, 29))
    })

    it('preserves firstInstallmentDate when purchaseDate does not change', async () => {
      const repo = createMockRepository()
      const existing = new Purchase({
        id: 'p1',
        description: 'Test',
        amount: 100,
        currency: 'ARS',
        installments: 1,
        purchaseDate: date(2025, 6, 10),
        firstInstallmentDate: date(2025, 7, 15),
        billingPeriod: new BillingPeriod(6, 2025),
      })
      vi.mocked(repo.findById).mockResolvedValue(existing)

      const service = new PurchaseService(repo, 15, 29)
      const updated = await service.updatePurchase('p1', {
        description: 'Updated',
      })

      expect(updated.firstInstallmentDate).toEqual(date(2025, 7, 15))
    })

    it('throws when purchase not found', async () => {
      const repo = createMockRepository()
      vi.mocked(repo.findById).mockResolvedValue(null)

      const service = new PurchaseService(repo, 15, 29)
      await expect(
        service.updatePurchase('nonexistent', { description: 'Test' })
      ).rejects.toThrow('Purchase with id nonexistent not found')
    })
  })

  describe('deletePurchase', () => {
    it('deletes an existing purchase', async () => {
      const repo = createMockRepository()
      const existing = new Purchase({
        id: 'p1',
        description: 'Test',
        amount: 100,
        currency: 'ARS',
        installments: 1,
        purchaseDate: date(2025, 6, 10),
        firstInstallmentDate: date(2025, 7, 15),
        billingPeriod: new BillingPeriod(6, 2025),
      })
      vi.mocked(repo.findById).mockResolvedValue(existing)

      const service = new PurchaseService(repo, 15, 29)
      await service.deletePurchase('p1')

      expect(repo.deleteById).toHaveBeenCalledWith('p1')
    })

    it('throws when purchase not found', async () => {
      const repo = createMockRepository()
      vi.mocked(repo.findById).mockResolvedValue(null)

      const service = new PurchaseService(repo, 15, 29)
      await expect(
        service.deletePurchase('nonexistent')
      ).rejects.toThrow('Purchase with id nonexistent not found')
      expect(repo.deleteById).not.toHaveBeenCalled()
    })
  })

  describe('getPurchase', () => {
    it('returns purchase by id', async () => {
      const repo = createMockRepository()
      const existing = new Purchase({
        id: 'p1',
        description: 'Test',
        amount: 100,
        currency: 'ARS',
        installments: 1,
        purchaseDate: date(2025, 6, 10),
        firstInstallmentDate: date(2025, 7, 15),
        billingPeriod: new BillingPeriod(6, 2025),
      })
      vi.mocked(repo.findById).mockResolvedValue(existing)

      const service = new PurchaseService(repo, 15, 29)
      const result = await service.getPurchase('p1')

      expect(result).toBe(existing)
    })

    it('returns null when not found', async () => {
      const repo = createMockRepository()
      vi.mocked(repo.findById).mockResolvedValue(null)

      const service = new PurchaseService(repo, 15, 29)
      const result = await service.getPurchase('nonexistent')

      expect(result).toBeNull()
    })
  })

  describe('getAllPurchases', () => {
    it('returns all purchases', async () => {
      const repo = createMockRepository()
      vi.mocked(repo.findAll).mockResolvedValue([])

      const service = new PurchaseService(repo, 15, 29)
      const result = await service.getAllPurchases()

      expect(result).toEqual([])
    })
  })
})
