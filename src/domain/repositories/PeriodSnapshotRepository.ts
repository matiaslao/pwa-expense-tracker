import type { PeriodSnapshot } from '../entities/PeriodSnapshot'

export interface PeriodSnapshotRepository {
  save(snapshot: PeriodSnapshot): Promise<void>
  getLatest(): Promise<PeriodSnapshot | null>
  getByPeriod(periodLabel: string): Promise<PeriodSnapshot | null>
}
