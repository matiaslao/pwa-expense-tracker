export class BillingPeriod {
  readonly month: number
  readonly year: number

  constructor(month: number, year: number) {
    if (!Number.isInteger(month) || month < 1 || month > 12) {
      throw new Error('month must be between 1 and 12')
    }
    if (!Number.isInteger(year) || year < 1) {
      throw new Error('year must be a positive integer')
    }
    this.month = month
    this.year = year
  }

  equals(other: BillingPeriod): boolean {
    return this.month === other.month && this.year === other.year
  }

  isBefore(other: BillingPeriod): boolean {
    return this.year < other.year || (this.year === other.year && this.month < other.month)
  }

  isAfter(other: BillingPeriod): boolean {
    return this.year > other.year || (this.year === other.year && this.month > other.month)
  }

  toString(): string {
    const padded = this.month.toString().padStart(2, '0')
    return `${this.year}-${padded}`
  }
}
