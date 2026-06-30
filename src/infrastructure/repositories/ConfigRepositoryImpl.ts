import type { ConfigRepository } from '../../domain/repositories/ConfigRepository'
import type { CardSettings } from '../../domain/types/CardSettings'
import { AppDatabase } from '../database/db'

export class ConfigRepositoryImpl implements ConfigRepository {
  private db: AppDatabase

  constructor(db?: AppDatabase) {
    this.db = db ?? new AppDatabase()
  }

  async getSettings(): Promise<CardSettings> {
    const record = await this.db.settings.get('card')
    if (record) {
      const closingDate = new Date(record.closingDate)
      const dueDate = new Date(record.dueDate)
      if (!isNaN(closingDate.getTime()) && !isNaN(dueDate.getTime())) {
        return { closingDate, dueDate }
      }
    }
    const now = new Date()
    const defaultClosing = new Date(now.getFullYear(), 6, 23)
    const defaultDue = new Date(defaultClosing)
    defaultDue.setDate(defaultDue.getDate() + 14)
    return { closingDate: defaultClosing, dueDate: defaultDue }
  }

  async saveSettings(settings: CardSettings): Promise<void> {
    await this.db.settings.put({
      key: 'card',
      closingDate: settings.closingDate,
      dueDate: settings.dueDate,
    })
  }
}
