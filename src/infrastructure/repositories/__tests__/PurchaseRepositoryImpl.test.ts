import { describe, it, expect, beforeEach } from 'vitest'
import { PurchaseRepositoryImpl } from '../PurchaseRepositoryImpl'
import { AppDatabase } from '../../database/db'
import { Purchase } from '../../../domain/entities/Purchase'
import { BillingPeriod } from '../../../domain/valueObjects/BillingPeriod'

function date(year: number, month: number, day: number): Date {
  return new Date(year, month - 1, day)
}

describe('PurchaseRepositoryImpl', () => {
  let repo: PurchaseRepositoryImpl

  beforeEach(() => {
    const db = new AppDatabase('TestDB_' + Date.now())
    repo = new PurchaseRepositoryImpl(db)
  })

  function makePurchase(overrides: Record<string, unknown> = {}) {
    return new Purchase({
      id: 'p1',
      description: 'Test purchase',
      amount: 300,
      currency: 'ARS',
      installments: 3,
      purchaseDate: date(2025, 6, 10),
      firstInstallmentDate: date(2025, 7, 15),
      billingPeriod: new BillingPeriod(6, 2025),
      ...overrides,
    })
  }

  describe('save and findById', () => {
    it('saves and retrieves a purchase', async () => {
      const purchase = makePurchase()
      await repo.save(purchase)

      const found = await repo.findById('p1')
      expect(found).not.toBeNull()
      expect(found!.id).toBe('p1')
      expect(found!.description).toBe('Test purchase')
      expect(found!.amount).toBe(300)
      expect(found!.currency).toBe('ARS')
      expect(found!.installments).toBe(3)
      expect(found!.billingPeriod.month).toBe(6)
      expect(found!.billingPeriod.year).toBe(2025)
    })

    it('returns null for non-existent id', async () => {
      const found = await repo.findById('nonexistent')
      expect(found).toBeNull()
    })

    it('overwrites existing purchase on save', async () => {
      const original = makePurchase({ description: 'Original' })
      await repo.save(original)

      const updated = makePurchase({ description: 'Updated' })
      await repo.save(updated)

      const found = await repo.findById('p1')
      expect(found!.description).toBe('Updated')
    })
  })

  describe('findAll', () => {
    it('returns empty array when no purchases', async () => {
      const all = await repo.findAll()
      expect(all).toEqual([])
    })

    it('returns all purchases', async () => {
      await repo.save(makePurchase({ id: 'p1' }))
      await repo.save(makePurchase({ id: 'p2' }))

      const all = await repo.findAll()
      expect(all).toHaveLength(2)
    })
  })

  describe('deleteById', () => {
    it('deletes an existing purchase', async () => {
      await repo.save(makePurchase())
      await repo.deleteById('p1')

      const found = await repo.findById('p1')
      expect(found).toBeNull()
    })

    it('does not throw when deleting non-existent purchase', async () => {
      await expect(repo.deleteById('nonexistent')).resolves.toBeUndefined()
    })
  })

  describe('full CRUD cycle', () => {
    it('allows create, read, update, delete flow', async () => {
      const purchase = makePurchase()
      await repo.save(purchase)
      expect(await repo.findById('p1')).not.toBeNull()

      const updated = makePurchase({ amount: 500 })
      await repo.save(updated)
      expect((await repo.findById('p1'))!.amount).toBe(500)

      await repo.deleteById('p1')
      expect(await repo.findById('p1')).toBeNull()
    })
  })
})
