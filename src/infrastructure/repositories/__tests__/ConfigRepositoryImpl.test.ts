import { describe, it, expect, beforeEach } from 'vitest'
import { ConfigRepositoryImpl } from '../ConfigRepositoryImpl'
import { AppDatabase } from '../../database/db'

describe('ConfigRepositoryImpl', () => {
  let repo: ConfigRepositoryImpl

  beforeEach(() => {
    const db = new AppDatabase('TestDB_Config_' + Date.now())
    repo = new ConfigRepositoryImpl(db)
  })

  describe('getSettings', () => {
    it('returns defaults when no settings saved', async () => {
      const settings = await repo.getSettings()

      expect(settings.closingDay).toBe(15)
      expect(settings.dueDay).toBe(29)
    })
  })

  describe('saveSettings', () => {
    it('persists settings and returns them on getSettings', async () => {
      await repo.saveSettings({ closingDay: 10, dueDay: 24 })

      const settings = await repo.getSettings()
      expect(settings.closingDay).toBe(10)
      expect(settings.dueDay).toBe(24)
    })

    it('overwrites previous settings', async () => {
      await repo.saveSettings({ closingDay: 5, dueDay: 19 })
      await repo.saveSettings({ closingDay: 20, dueDay: 5 })

      const settings = await repo.getSettings()
      expect(settings.closingDay).toBe(20)
      expect(settings.dueDay).toBe(5)
    })
  })

  describe('isolation', () => {
    it('uses separate DB instances', async () => {
      const db1 = new AppDatabase('TestDB_Isolation_' + Date.now())
      const db2 = new AppDatabase('TestDB_Isolation_' + Date.now() + '_2')
      const repo1 = new ConfigRepositoryImpl(db1)
      const repo2 = new ConfigRepositoryImpl(db2)

      await repo1.saveSettings({ closingDay: 1, dueDay: 15 })
      const settings = await repo2.getSettings()

      expect(settings.closingDay).toBe(15)
    })
  })
})
