import type { Installment } from './Installment'
import type { Currency } from '../types'
import type { BillingPeriod } from '../valueObjects/BillingPeriod'

export interface PurchaseProps {
  id: string
  description: string
  amount: number
  currency: Currency
  installments: number
  purchaseDate: Date
  firstInstallmentDate: Date
  billingPeriod: BillingPeriod
}

export class Purchase {
  readonly id: string
  readonly description: string
  readonly amount: number
  readonly currency: Currency
  readonly installments: number
  readonly purchaseDate: Date
  readonly firstInstallmentDate: Date
  readonly billingPeriod: BillingPeriod

  constructor(props: PurchaseProps) {
    if (!props.id) throw new Error('id is required')
    if (!props.description.trim()) throw new Error('description is required')
    if (props.amount <= 0) throw new Error('amount must be positive')
    if (props.currency !== 'ARS') throw new Error('currency must be ARS')
    if (!Number.isInteger(props.installments) || props.installments < 1)
      throw new Error('installments must be a positive integer')
    if (isNaN(props.purchaseDate.getTime()))
      throw new Error('purchaseDate must be a valid date')
    if (isNaN(props.firstInstallmentDate.getTime()))
      throw new Error('firstInstallmentDate must be a valid date')

    this.id = props.id
    this.description = props.description.trim()
    this.amount = props.amount
    this.currency = props.currency
    this.installments = props.installments
    this.purchaseDate = props.purchaseDate
    this.firstInstallmentDate = props.firstInstallmentDate
    this.billingPeriod = props.billingPeriod
  }

  generateInstallments(): Installment[] {
    const result: Installment[] = []
    const cents = Math.round(this.amount * 100)
    const baseCents = Math.floor(cents / this.installments)
    const remainder = cents - baseCents * this.installments

    for (let i = 0; i < this.installments; i++) {
      const installmentCents = i < this.installments - 1
        ? baseCents
        : baseCents + remainder
      const dueDate = new Date(this.firstInstallmentDate)
      dueDate.setMonth(dueDate.getMonth() + i)

      result.push({
        number: i + 1,
        dueDate,
        amount: installmentCents / 100,
      })
    }

    return result
  }

  getRemainingInstallments(paidCount: number): Installment[] {
    const all = this.generateInstallments()
    return all.slice(paidCount)
  }
}
