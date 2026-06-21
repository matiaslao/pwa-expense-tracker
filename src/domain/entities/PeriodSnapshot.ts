export interface PeriodSnapshotProps {
  periodLabel: string
  closingDate: Date
  dueDate: Date
  totalAmount: number
  purchaseCount: number
  createdAt: Date
}

export class PeriodSnapshot {
  readonly periodLabel: string
  readonly closingDate: Date
  readonly dueDate: Date
  readonly totalAmount: number
  readonly purchaseCount: number
  readonly createdAt: Date

  constructor(props: PeriodSnapshotProps) {
    if (!props.periodLabel.trim()) throw new Error('periodLabel is required')
    if (isNaN(props.closingDate.getTime())) throw new Error('closingDate must be a valid date')
    if (isNaN(props.dueDate.getTime())) throw new Error('dueDate must be a valid date')
    if (props.totalAmount < 0) throw new Error('totalAmount must be non-negative')
    if (!Number.isInteger(props.purchaseCount) || props.purchaseCount < 0)
      throw new Error('purchaseCount must be a non-negative integer')
    if (isNaN(props.createdAt.getTime())) throw new Error('createdAt must be a valid date')

    this.periodLabel = props.periodLabel.trim()
    this.closingDate = props.closingDate
    this.dueDate = props.dueDate
    this.totalAmount = props.totalAmount
    this.purchaseCount = props.purchaseCount
    this.createdAt = props.createdAt
  }
}
