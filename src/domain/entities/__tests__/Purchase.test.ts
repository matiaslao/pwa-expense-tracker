import { describe, it, expect } from 'vitest'
import { Purchase } from '../Purchase'

function makeValidProps(overrides: Record<string, unknown> = {}) {
  return {
    id: 'p1',
    description: 'Test purchase',
    amount: 1000,
    currency: 'ARS' as const,
    installments: 3,
    purchaseDate: new Date('2025-01-10'),
    firstInstallmentDate: new Date('2025-02-15'),
    ...overrides,
  }
}

describe('Purchase', () => {
  describe('creation', () => {
    it('creates with valid props', () => {
      const purchase = new Purchase(makeValidProps())
      expect(purchase.id).toBe('p1')
      expect(purchase.description).toBe('Test purchase')
      expect(purchase.amount).toBe(1000)
      expect(purchase.currency).toBe('ARS')
      expect(purchase.installments).toBe(3)
      expect(purchase.purchaseDate).toEqual(new Date('2025-01-10'))
      expect(purchase.firstInstallmentDate).toEqual(new Date('2025-02-15'))
    })

    it('trims description', () => {
      const purchase = new Purchase(makeValidProps({ description: '  My purchase  ' }))
      expect(purchase.description).toBe('My purchase')
    })
  })

  describe('validation', () => {
    it('rejects empty id', () => {
      expect(() => new Purchase(makeValidProps({ id: '' }))).toThrow('id is required')
    })

    it('rejects empty description', () => {
      expect(() => new Purchase(makeValidProps({ description: '  ' }))).toThrow('description is required')
    })

    it('rejects zero amount', () => {
      expect(() => new Purchase(makeValidProps({ amount: 0 }))).toThrow('amount must be positive')
    })

    it('rejects negative amount', () => {
      expect(() => new Purchase(makeValidProps({ amount: -100 }))).toThrow('amount must be positive')
    })

    it('rejects non-ARS currency', () => {
      expect(() => new Purchase(makeValidProps({ currency: 'USD' }))).toThrow('currency must be ARS')
    })

    it('rejects non-integer installments', () => {
      expect(() => new Purchase(makeValidProps({ installments: 2.5 }))).toThrow('installments must be a positive integer')
    })

    it('rejects zero installments', () => {
      expect(() => new Purchase(makeValidProps({ installments: 0 }))).toThrow('installments must be a positive integer')
    })

    it('rejects negative installments', () => {
      expect(() => new Purchase(makeValidProps({ installments: -1 }))).toThrow('installments must be a positive integer')
    })

    it('rejects invalid purchaseDate', () => {
      expect(() => new Purchase(makeValidProps({ purchaseDate: new Date('invalid') }))).toThrow('purchaseDate must be a valid date')
    })

    it('rejects invalid firstInstallmentDate', () => {
      expect(() => new Purchase(makeValidProps({ firstInstallmentDate: new Date('invalid') }))).toThrow('firstInstallmentDate must be a valid date')
    })
  })

  describe('generateInstallments', () => {
    it('generates one installment for single-installment purchase', () => {
      const purchase = new Purchase(makeValidProps({ amount: 500, installments: 1 }))
      const installments = purchase.generateInstallments()
      expect(installments).toHaveLength(1)
      expect(installments[0].number).toBe(1)
      expect(installments[0].amount).toBe(500)
    })

    it('generates equal installments for exact division', () => {
      const purchase = new Purchase(makeValidProps({ amount: 300, installments: 3 }))
      const installments = purchase.generateInstallments()
      expect(installments).toHaveLength(3)
      installments.forEach((inst) => {
        expect(inst.amount).toBe(100)
      })
    })

    it('puts rounding remainder on last installment', () => {
      const purchase = new Purchase(makeValidProps({ amount: 100, installments: 3 }))
      const installments = purchase.generateInstallments()
      expect(installments).toHaveLength(3)
      expect(installments[0].amount).toBe(33.33)
      expect(installments[1].amount).toBe(33.33)
      expect(installments[2].amount).toBe(33.34)
    })

    it('sums to total amount', () => {
      const purchase = new Purchase(makeValidProps({ amount: 1000, installments: 7 }))
      const installments = purchase.generateInstallments()
      const total = installments.reduce((sum, inst) => sum + inst.amount, 0)
      expect(total).toBe(1000)
    })

    it('assigns sequential installment numbers', () => {
      const purchase = new Purchase(makeValidProps({ amount: 200, installments: 5 }))
      const installments = purchase.generateInstallments()
      installments.forEach((inst, index) => {
        expect(inst.number).toBe(index + 1)
      })
    })

    it('advances due date by one month per installment', () => {
      const purchase = new Purchase(makeValidProps({
        amount: 300,
        installments: 3,
        firstInstallmentDate: new Date('2025-02-15'),
      }))
      const installments = purchase.generateInstallments()
      expect(installments[0].dueDate).toEqual(new Date('2025-02-15'))
      expect(installments[1].dueDate).toEqual(new Date('2025-03-15'))
      expect(installments[2].dueDate).toEqual(new Date('2025-04-15'))
    })

    it('handles year boundary for due dates', () => {
      const purchase = new Purchase(makeValidProps({
        amount: 200,
        installments: 3,
        firstInstallmentDate: new Date('2025-11-15'),
      }))
      const installments = purchase.generateInstallments()
      expect(installments[0].dueDate).toEqual(new Date('2025-11-15'))
      expect(installments[1].dueDate).toEqual(new Date('2025-12-15'))
      expect(installments[2].dueDate).toEqual(new Date('2026-01-15'))
    })

    it('handles cents correctly with large amounts', () => {
      const purchase = new Purchase(makeValidProps({ amount: 999.99, installments: 12 }))
      const installments = purchase.generateInstallments()
      const total = installments.reduce((sum, inst) => sum + inst.amount, 0)
      expect(total).toBeCloseTo(999.99, 2)
    })
  })

  describe('getRemainingInstallments', () => {
    it('returns all installments when none paid', () => {
      const purchase = new Purchase(makeValidProps({ amount: 300, installments: 3 }))
      const remaining = purchase.getRemainingInstallments(0)
      expect(remaining).toHaveLength(3)
    })

    it('returns remaining installments after some paid', () => {
      const purchase = new Purchase(makeValidProps({ amount: 300, installments: 3 }))
      const remaining = purchase.getRemainingInstallments(2)
      expect(remaining).toHaveLength(1)
      expect(remaining[0].number).toBe(3)
    })

    it('returns empty when all paid', () => {
      const purchase = new Purchase(makeValidProps({ amount: 300, installments: 3 }))
      const remaining = purchase.getRemainingInstallments(3)
      expect(remaining).toHaveLength(0)
    })
  })
})
