import type { PeriodSnapshotRepository } from '../../domain/repositories/PeriodSnapshotRepository'
import type { PeriodSnapshot } from '../../domain/types/PeriodSnapshot'
import type { PeriodSnapshotRecord } from '../database/db'
import { AppDatabase } from '../database/db'
import { BillingPeriod } from '../../domain/valueObjects/BillingPeriod'

function toRecord(snapshot: PeriodSnapshot): PeriodSnapshotRecord {
  return {
    id: snapshot.id,
    periodMonth: snapshot.period.month,
    periodYear: snapshot.period.year,
    closingDate: snapshot.closingDate,
    dueDate: snapshot.dueDate,
    totalAmount: snapshot.totalAmount,
    purchaseCount: snapshot.purchaseCount,
    capturedAt: snapshot.capturedAt,
  }
}

function toDomain(record: PeriodSnapshotRecord): PeriodSnapshot {
  return {
    id: record.id,
    period: new BillingPeriod(record.periodMonth, record.periodYear),
    closingDate: record.closingDate,
    dueDate: record.dueDate,
    totalAmount: record.totalAmount,
    purchaseCount: record.purchaseCount,
    capturedAt: record.capturedAt,
  }
}

export class PeriodSnapshotRepositoryImpl implements PeriodSnapshotRepository {
  private db: AppDatabase

  constructor(db?: AppDatabase) {
    this.db = db ?? new AppDatabase()
  }

  async save(snapshot: PeriodSnapshot): Promise<void> {
    await this.db.periodSnapshots.put(toRecord(snapshot))
  }

  async findLatest(): Promise<PeriodSnapshot | null> {
    const record = await this.db.periodSnapshots
      .orderBy('capturedAt')
      .reverse()
      .first()
    return record ? toDomain(record) : null
  }

  async findAll(): Promise<PeriodSnapshot[]> {
    const records = await this.db.periodSnapshots
      .orderBy('capturedAt')
      .reverse()
      .toArray()
    return records.map(toDomain)
  }
}
