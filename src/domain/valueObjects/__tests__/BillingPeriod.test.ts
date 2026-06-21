import { describe, it, expect } from 'vitest'
import { BillingPeriod } from '../BillingPeriod'

describe('BillingPeriod', () => {
  describe('previous', () => {
    it('returns previous month in same year', () => {
      const period = new BillingPeriod(6, 2025)
      expect(period.previous()).toEqual(new BillingPeriod(5, 2025))
    })

    it('wraps from January to December of previous year', () => {
      const period = new BillingPeriod(1, 2025)
      expect(period.previous()).toEqual(new BillingPeriod(12, 2024))
    })

    it('handles March to February', () => {
      const period = new BillingPeriod(3, 2025)
      expect(period.previous()).toEqual(new BillingPeriod(2, 2025))
    })

    it('handles December to November', () => {
      const period = new BillingPeriod(12, 2025)
      expect(period.previous()).toEqual(new BillingPeriod(11, 2025))
    })

    it('can be chained', () => {
      const period = new BillingPeriod(3, 2025)
      expect(period.previous().previous()).toEqual(new BillingPeriod(1, 2025))
    })

    it('chains across year boundary', () => {
      const period = new BillingPeriod(2, 2025)
      expect(period.previous().previous()).toEqual(new BillingPeriod(12, 2024))
    })
  })
})
