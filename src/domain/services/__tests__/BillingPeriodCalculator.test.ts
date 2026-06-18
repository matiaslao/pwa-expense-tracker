import { describe, it, expect } from 'vitest'
import { BillingPeriod } from '../../valueObjects/BillingPeriod'
import { calculateBillingPeriod } from '../BillingPeriodCalculator'

function date(year: number, month: number, day: number): Date {
  return new Date(year, month - 1, day)
}

describe('BillingPeriod', () => {
  describe('creation', () => {
    it('creates with valid month and year', () => {
      const period = new BillingPeriod(6, 2025)
      expect(period.month).toBe(6)
      expect(period.year).toBe(2025)
    })
  })

  describe('validation', () => {
    it('rejects month < 1', () => {
      expect(() => new BillingPeriod(0, 2025)).toThrow('month must be between 1 and 12')
    })

    it('rejects month > 12', () => {
      expect(() => new BillingPeriod(13, 2025)).toThrow('month must be between 1 and 12')
    })

    it('rejects non-integer month', () => {
      expect(() => new BillingPeriod(6.5, 2025)).toThrow('month must be between 1 and 12')
    })

    it('rejects year < 1', () => {
      expect(() => new BillingPeriod(6, 0)).toThrow('year must be a positive integer')
    })

    it('rejects non-integer year', () => {
      expect(() => new BillingPeriod(6, 2025.5)).toThrow('year must be a positive integer')
    })
  })

  describe('equals', () => {
    it('returns true for same month and year', () => {
      const a = new BillingPeriod(3, 2025)
      const b = new BillingPeriod(3, 2025)
      expect(a.equals(b)).toBe(true)
    })

    it('returns false for different month', () => {
      const a = new BillingPeriod(3, 2025)
      const b = new BillingPeriod(4, 2025)
      expect(a.equals(b)).toBe(false)
    })

    it('returns false for different year', () => {
      const a = new BillingPeriod(3, 2025)
      const b = new BillingPeriod(3, 2026)
      expect(a.equals(b)).toBe(false)
    })
  })

  describe('isBefore', () => {
    it('returns true when year is earlier', () => {
      const a = new BillingPeriod(6, 2024)
      const b = new BillingPeriod(1, 2025)
      expect(a.isBefore(b)).toBe(true)
    })

    it('returns true when same year and earlier month', () => {
      const a = new BillingPeriod(3, 2025)
      const b = new BillingPeriod(6, 2025)
      expect(a.isBefore(b)).toBe(true)
    })

    it('returns false when same period', () => {
      const a = new BillingPeriod(6, 2025)
      const b = new BillingPeriod(6, 2025)
      expect(a.isBefore(b)).toBe(false)
    })

    it('returns false when later', () => {
      const a = new BillingPeriod(6, 2025)
      const b = new BillingPeriod(3, 2025)
      expect(a.isBefore(b)).toBe(false)
    })
  })

  describe('isAfter', () => {
    it('returns true when year is later', () => {
      const a = new BillingPeriod(1, 2026)
      const b = new BillingPeriod(12, 2025)
      expect(a.isAfter(b)).toBe(true)
    })

    it('returns true when same year and later month', () => {
      const a = new BillingPeriod(6, 2025)
      const b = new BillingPeriod(3, 2025)
      expect(a.isAfter(b)).toBe(true)
    })

    it('returns false when same period', () => {
      const a = new BillingPeriod(6, 2025)
      const b = new BillingPeriod(6, 2025)
      expect(a.isAfter(b)).toBe(false)
    })

    it('returns false when earlier', () => {
      const a = new BillingPeriod(3, 2025)
      const b = new BillingPeriod(6, 2025)
      expect(a.isAfter(b)).toBe(false)
    })
  })

  describe('toString', () => {
    it('formats single-digit month with leading zero', () => {
      const period = new BillingPeriod(3, 2025)
      expect(period.toString()).toBe('2025-03')
    })

    it('formats double-digit month', () => {
      const period = new BillingPeriod(11, 2025)
      expect(period.toString()).toBe('2025-11')
    })
  })
})

describe('calculateBillingPeriod', () => {
  it('assigns to same month when purchase is before closing day', () => {
    const period = calculateBillingPeriod(15, date(2025, 6, 10))
    expect(period.month).toBe(6)
    expect(period.year).toBe(2025)
  })

  it('assigns to next month when purchase is on closing day', () => {
    const period = calculateBillingPeriod(15, date(2025, 6, 15))
    expect(period.month).toBe(7)
    expect(period.year).toBe(2025)
  })

  it('assigns to next month when purchase is after closing day', () => {
    const period = calculateBillingPeriod(15, date(2025, 6, 20))
    expect(period.month).toBe(7)
    expect(period.year).toBe(2025)
  })

  it('handles year boundary when purchase is after closing day in December', () => {
    const period = calculateBillingPeriod(15, date(2025, 12, 20))
    expect(period.month).toBe(1)
    expect(period.year).toBe(2026)
  })

  it('handles year boundary when purchase is on closing day in December', () => {
    const period = calculateBillingPeriod(15, date(2025, 12, 15))
    expect(period.month).toBe(1)
    expect(period.year).toBe(2026)
  })

  it('keeps in same year when purchase is before closing day in December', () => {
    const period = calculateBillingPeriod(15, date(2025, 12, 10))
    expect(period.month).toBe(12)
    expect(period.year).toBe(2025)
  })

  it('works with closing day 28', () => {
    expect(calculateBillingPeriod(28, date(2025, 2, 27)).month).toBe(2)
    expect(calculateBillingPeriod(28, date(2025, 2, 28)).month).toBe(3)
  })

  it('works with closing day 30', () => {
    expect(calculateBillingPeriod(30, date(2025, 4, 29)).month).toBe(4)
    expect(calculateBillingPeriod(30, date(2025, 4, 30)).month).toBe(5)
  })

  it('works with closing day 31 and month with 30 days', () => {
    const period = calculateBillingPeriod(31, date(2025, 4, 30))
    expect(period.month).toBe(4)
    expect(period.year).toBe(2025)
  })

  it('works with closing day 31 in February', () => {
    const period = calculateBillingPeriod(31, date(2025, 2, 28))
    expect(period.month).toBe(2)
    expect(period.year).toBe(2025)
  })

  it('is a pure function (no side effects)', () => {
    const d = date(2025, 6, 20)
    const copy = new Date(d)
    calculateBillingPeriod(15, d)
    expect(d.getTime()).toBe(copy.getTime())
  })
})
