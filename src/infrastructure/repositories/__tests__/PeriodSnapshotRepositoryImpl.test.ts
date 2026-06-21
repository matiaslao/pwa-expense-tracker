import { describe, it, expect, beforeEach } from 'vitest'
import { PeriodSnapshotRepositoryImpl } from '../PeriodSnapshotRepositoryImpl'
import { AppDatabase } from '../../database/db'
import { PeriodSnapshot } from '../../../domain/entities/PeriodSnapshot'

function date(year: number, month: number, day: number): Date {
  return new Date(year, month - 1, day)
}

function makeSnapshot(overrides: Record<string, unknown> = {}) {
  return new PeriodSnapshot({
    periodLabel: '2025-06',
    closingDate: date(2025, 6, 15),
    dueDate: date(2025, 7, 1),
    totalAmount: 500,
    purchaseCount: 3,
    createdAt: date(2025, 6, 16),
    ...overrides,
  })
}

describe('PeriodSnapshotRepositoryImpl', () => {
  let repo: PeriodSnapshotRepositoryImpl

  beforeEach(() => {
    const db = new AppDatabase('TestDB_Snapshot_' + Date.now())
    repo = new PeriodSnapshotRepositoryImpl(db)
  })

  describe('save and getByPeriod', () => {
    it('persists a snapshot and retrieves it by period', async () => {
      const snapshot = makeSnapshot()
      await repo.save(snapshot)

      const result = await repo.getByPeriod('2025-06')
      expect(result).not.toBeNull()
      expect(result!.periodLabel).toBe('2025-06')
      expect(result!.totalAmount).toBe(500)
      expect(result!.purchaseCount).toBe(3)
      expect(result!.closingDate).toEqual(date(2025, 6, 15))
      expect(result!.dueDate).toEqual(date(2025, 7, 1))
      expect(result!.createdAt).toEqual(date(2025, 6, 16))
    })

    it('returns null for non-existent period', async () => {
      const result = await repo.getByPeriod('2025-01')
      expect(result).toBeNull()
    })
  })

  describe('getLatest', () => {
    it('returns the most recent snapshot by createdAt', async () => {
      const oldSnapshot = makeSnapshot({
        periodLabel: '2025-05',
        createdAt: date(2025, 5, 16),
      })
      const newSnapshot = makeSnapshot({
        periodLabel: '2025-06',
        createdAt: date(2025, 6, 16),
      })

      await repo.save(oldSnapshot)
      await repo.save(newSnapshot)

      const latest = await repo.getLatest()
      expect(latest).not.toBeNull()
      expect(latest!.periodLabel).toBe('2025-06')
    })

    it('returns null when no snapshots exist', async () => {
      const latest = await repo.getLatest()
      expect(latest).toBeNull()
    })
  })

  describe('idempotent save', () => {
    it('overwrites snapshot for same period', async () => {
      const first = makeSnapshot({ totalAmount: 300, purchaseCount: 2 })
      await repo.save(first)

      const second = makeSnapshot({ totalAmount: 500, purchaseCount: 3 })
      await repo.save(second)

      const result = await repo.getByPeriod('2025-06')
      expect(result!.totalAmount).toBe(500)
      expect(result!.purchaseCount).toBe(3)
    })
  })
})
