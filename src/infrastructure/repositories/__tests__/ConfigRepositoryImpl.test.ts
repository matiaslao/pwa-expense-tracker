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

      expect(settings.closingDate.getMonth()).toBe(6)
      expect(settings.closingDate.getDate()).toBe(23)
      expect(settings.dueDate.getDate()).toBe(6)
      expect(settings.dueDate.getMonth()).toBe(7)
    })
  })

  describe('saveSettings', () => {
    it('persists settings and returns them on getSettings', async () => {
      const closingDate = new Date(2026, 6, 10)
      const dueDate = new Date(2026, 6, 24)
      await repo.saveSettings({ closingDate, dueDate })

      const settings = await repo.getSettings()
      expect(settings.closingDate.getFullYear()).toBe(2026)
      expect(settings.closingDate.getMonth()).toBe(6)
      expect(settings.closingDate.getDate()).toBe(10)
      expect(settings.dueDate.getDate()).toBe(24)
    })

    it('overwrites previous settings', async () => {
      const firstClose = new Date(2026, 6, 5)
      const firstDue = new Date(2026, 6, 19)
      await repo.saveSettings({ closingDate: firstClose, dueDate: firstDue })

      const secondClose = new Date(2026, 7, 20)
      const secondDue = new Date(2026, 7, 5)
      await repo.saveSettings({ closingDate: secondClose, dueDate: secondDue })

      const settings = await repo.getSettings()
      expect(settings.closingDate.getDate()).toBe(20)
      expect(settings.closingDate.getMonth()).toBe(7)
      expect(settings.dueDate.getDate()).toBe(5)
    })
  })

  describe('isolation', () => {
    it('uses separate DB instances', async () => {
      const db1 = new AppDatabase('TestDB_Isolation_' + Date.now())
      const db2 = new AppDatabase('TestDB_Isolation_' + Date.now() + '_2')
      const repo1 = new ConfigRepositoryImpl(db1)
      const repo2 = new ConfigRepositoryImpl(db2)

      await repo1.saveSettings({ closingDate: new Date(2026, 0, 1), dueDate: new Date(2026, 0, 15) })
      const settings = await repo2.getSettings()

      expect(settings.closingDate.getMonth()).toBe(6)
    })
  })
})
