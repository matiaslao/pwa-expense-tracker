import type { PeriodSnapshotRepository } from '../../domain/repositories/PeriodSnapshotRepository'
import type { PeriodSnapshotRecord } from '../database/db'
import { AppDatabase } from '../database/db'
import { PeriodSnapshot } from '../../domain/entities/PeriodSnapshot'

function toRecord(snapshot: PeriodSnapshot): PeriodSnapshotRecord {
  return {
    periodLabel: snapshot.periodLabel,
    closingDate: snapshot.closingDate,
    dueDate: snapshot.dueDate,
    totalAmount: snapshot.totalAmount,
    purchaseCount: snapshot.purchaseCount,
    createdAt: snapshot.createdAt,
  }
}

function toDomain(record: PeriodSnapshotRecord): PeriodSnapshot {
  return new PeriodSnapshot({
    periodLabel: record.periodLabel,
    closingDate: record.closingDate,
    dueDate: record.dueDate,
    totalAmount: record.totalAmount,
    purchaseCount: record.purchaseCount,
    createdAt: record.createdAt,
  })
}

export class PeriodSnapshotRepositoryImpl implements PeriodSnapshotRepository {
  private db: AppDatabase

  constructor(db?: AppDatabase) {
    this.db = db ?? new AppDatabase()
  }

  async save(snapshot: PeriodSnapshot): Promise<void> {
    await this.db.periodSnapshots.put(toRecord(snapshot))
  }

  async getLatest(): Promise<PeriodSnapshot | null> {
    const records = await this.db.periodSnapshots.toArray()
    if (records.length === 0) return null

    records.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    return toDomain(records[0])
  }

  async getByPeriod(periodLabel: string): Promise<PeriodSnapshot | null> {
    const record = await this.db.periodSnapshots.get(periodLabel)
    return record ? toDomain(record) : null
  }
}
