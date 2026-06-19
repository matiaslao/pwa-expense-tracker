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
    return record
      ? { closingDay: record.closingDay, dueDay: record.dueDay }
      : { closingDay: 15, dueDay: 29 }
  }

  async saveSettings(settings: CardSettings): Promise<void> {
    await this.db.settings.put({ key: 'card', ...settings })
  }
}
