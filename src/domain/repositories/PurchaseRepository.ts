import type { Purchase } from '../entities/Purchase'

export interface PurchaseRepository {
  save(purchase: Purchase): Promise<void>
  findById(id: string): Promise<Purchase | null>
  findAll(): Promise<Purchase[]>
  deleteById(id: string): Promise<void>
}
