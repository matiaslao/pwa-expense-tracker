import type { PeriodSnapshot } from '../types/PeriodSnapshot'

export interface PeriodSnapshotRepository {
  save(snapshot: PeriodSnapshot): Promise<void>
  findLatest(): Promise<PeriodSnapshot | null>
  findAll(): Promise<PeriodSnapshot[]>
}
