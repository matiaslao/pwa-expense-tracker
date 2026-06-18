import { describe, it, expect } from 'vitest'
import type { Installment } from '../Installment'

describe('Installment', () => {
  it('creates an installment with the given properties', () => {
    const date = new Date('2025-02-15')
    const installment: Installment = {
      number: 1,
      dueDate: date,
      amount: 100.50,
    }

    expect(installment.number).toBe(1)
    expect(installment.dueDate).toBe(date)
    expect(installment.amount).toBe(100.50)
  })

  it('supports multiple installment numbers', () => {
    const date = new Date('2025-03-15')
    const installment: Installment = {
      number: 3,
      dueDate: date,
      amount: 50.00,
    }

    expect(installment.number).toBe(3)
  })

  it('handles zero amount', () => {
    const installment: Installment = {
      number: 1,
      dueDate: new Date('2025-02-15'),
      amount: 0,
    }

    expect(installment.amount).toBe(0)
  })
})
