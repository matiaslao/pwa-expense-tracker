import type { CardSettings } from '../types/CardSettings'

export interface ConfigRepository {
  getSettings(): Promise<CardSettings>
  saveSettings(settings: CardSettings): Promise<void>
}
