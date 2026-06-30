import { describe, it, expect, beforeEach } from 'vitest'
import { PeriodSnapshotRepositoryImpl } from '../PeriodSnapshotRepositoryImpl'
import { AppDatabase } from '../../database/db'
import { BillingPeriod } from '../../../domain/valueObjects/BillingPeriod'

describe('PeriodSnapshotRepositoryImpl', () => {
  let repo: PeriodSnapshotRepositoryImpl

  beforeEach(() => {
    const db = new AppDatabase('TestDB_Snapshot_' + Date.now())
    repo = new PeriodSnapshotRepositoryImpl(db)
  })

  function makeSnapshot(overrides: Record<string, unknown> = {}) {
    return {
      id: 's1',
      period: new BillingPeriod(7, 2026),
      closingDate: new Date(2026, 6, 23),
      dueDate: new Date(2026, 7, 6),
      totalAmount: 500,
      purchaseCount: 3,
      capturedAt: new Date(2026, 6, 23),
      ...overrides,
    }
  }

  describe('save and findLatest', () => {
    it('saves and retrieves the latest snapshot', async () => {
      const snapshot = makeSnapshot()
      await repo.save(snapshot)

      const found = await repo.findLatest()
      expect(found).not.toBeNull()
      expect(found!.id).toBe('s1')
      expect(found!.period.month).toBe(7)
      expect(found!.period.year).toBe(2026)
      expect(found!.totalAmount).toBe(500)
      expect(found!.purchaseCount).toBe(3)
    })

    it('returns null when no snapshots exist', async () => {
      const found = await repo.findLatest()
      expect(found).toBeNull()
    })

    it('returns the most recent snapshot by capturedAt', async () => {
      await repo.save(makeSnapshot({ id: 's1', capturedAt: new Date(2026, 5, 1) }))
      await repo.save(makeSnapshot({ id: 's2', capturedAt: new Date(2026, 6, 1) }))

      const latest = await repo.findLatest()
      expect(latest!.id).toBe('s2')
    })
  })

  describe('findAll', () => {
    it('returns all snapshots ordered by capturedAt descending', async () => {
      await repo.save(makeSnapshot({ id: 's1', capturedAt: new Date(2026, 5, 1) }))
      await repo.save(makeSnapshot({ id: 's2', capturedAt: new Date(2026, 6, 1) }))
      await repo.save(makeSnapshot({ id: 's3', capturedAt: new Date(2026, 4, 1) }))

      const all = await repo.findAll()
      expect(all).toHaveLength(3)
      expect(all[0].id).toBe('s2')
      expect(all[1].id).toBe('s1')
      expect(all[2].id).toBe('s3')
    })

    it('returns empty array when no snapshots', async () => {
      const all = await repo.findAll()
      expect(all).toEqual([])
    })
  })
})
