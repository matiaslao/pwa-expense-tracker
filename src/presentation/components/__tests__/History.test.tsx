import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { History } from '../History'
import type { PeriodSnapshotService } from '../../../application/services/PeriodSnapshotService'
import { BillingPeriod } from '../../../domain/valueObjects/BillingPeriod'

function createMockService(snapshots: any[]): PeriodSnapshotService {
  return {
    getAllSnapshots: vi.fn().mockResolvedValue(snapshots),
    getLatestSnapshot: vi.fn(),
    checkAndCapture: vi.fn(),
  } as unknown as PeriodSnapshotService
}

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

describe('History', () => {
  it('shows loading state initially', () => {
    const service = createMockService([])
    render(<History snapshotService={service} />)

    expect(screen.getByText('Cargando...')).toBeInTheDocument()
  })

  it('shows empty state when no history', async () => {
    const service = createMockService([])
    render(<History snapshotService={service} />)

    const empty = await screen.findByText('Sin historial aún')
    expect(empty).toBeInTheDocument()
  })

  it('renders list of snapshots', async () => {
    const snapshots = [
      makeSnapshot(),
    ]
    const service = createMockService(snapshots)
    render(<History snapshotService={service} />)

    expect(await screen.findByText(/2026-07/)).toBeInTheDocument()
    expect(await screen.findByText('$500.00')).toBeInTheDocument()
    expect(await screen.findByText('3 compras')).toBeInTheDocument()
  })

  it('renders multiple snapshots', async () => {
    const snapshots = [
      makeSnapshot({ id: 's1', period: new BillingPeriod(7, 2026), totalAmount: 500, purchaseCount: 3 }),
      makeSnapshot({ id: 's2', period: new BillingPeriod(6, 2026), totalAmount: 200, purchaseCount: 1 }),
    ]
    const service = createMockService(snapshots)
    render(<History snapshotService={service} />)

    expect(await screen.findByText(/2026-07/)).toBeInTheDocument()
    expect(await screen.findByText(/2026-06/)).toBeInTheDocument()
    expect(await screen.findByText('1 compra')).toBeInTheDocument()
  })
})
