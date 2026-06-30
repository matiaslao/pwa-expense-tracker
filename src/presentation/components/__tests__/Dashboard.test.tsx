import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { Dashboard } from '../Dashboard'
import type { DashboardService } from '../../../application/services/DashboardService'
import type { PeriodSnapshotService } from '../../../application/services/PeriodSnapshotService'
import { BillingPeriod } from '../../../domain/valueObjects/BillingPeriod'

function createMockService(summary: any): DashboardService {
  return {
    getCurrentPeriodSummary: vi.fn().mockResolvedValue(summary),
    getFutureCommitments: vi.fn(),
    getActivePurchases: vi.fn(),
  } as unknown as DashboardService
}

function createMockSnapshotService(snapshot: any): PeriodSnapshotService {
  return {
    getLatestSnapshot: vi.fn().mockResolvedValue(snapshot),
    getAllSnapshots: vi.fn(),
    checkAndCapture: vi.fn(),
  } as unknown as PeriodSnapshotService
}

const defaultClosingDate = new Date(2026, 6, 23)
const defaultDueDate = new Date(2026, 7, 6)

describe('Dashboard', () => {
  it('shows loading state initially', () => {
    const service = createMockService(null)
    const snapshotService = createMockSnapshotService(null)
    render(<Dashboard dashboardService={service} snapshotService={snapshotService} closingDate={defaultClosingDate} dueDate={defaultDueDate} />)

    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })

  it('displays current period summary with Purchases label', async () => {
    const summary = {
      period: new BillingPeriod(7, 2025),
      totalDue: 500,
      installmentCount: 3,
    }
    const service = createMockService(summary)
    const snapshotService = createMockSnapshotService(null)
    render(<Dashboard dashboardService={service} snapshotService={snapshotService} closingDate={defaultClosingDate} dueDate={defaultDueDate} />)

    expect(await screen.findByText('Current Period')).toBeInTheDocument()
    expect(await screen.findByText('2025-07')).toBeInTheDocument()
    expect(await screen.findByText('$500.00')).toBeInTheDocument()
    expect(await screen.findByText('3')).toBeInTheDocument()
    expect(screen.getAllByText('Purchases').length).toBe(2)
  })

  it('shows previous period section with snapshot data below current period', async () => {
    const summary = {
      period: new BillingPeriod(7, 2025),
      totalDue: 500,
      installmentCount: 3,
    }
    const snapshot = {
      id: 's1',
      period: new BillingPeriod(6, 2025),
      closingDate: new Date(2026, 5, 23),
      dueDate: new Date(2026, 6, 7),
      totalAmount: 300,
      purchaseCount: 2,
      capturedAt: new Date(),
    }
    const service = createMockService(summary)
    const snapshotService = createMockSnapshotService(snapshot)
    render(<Dashboard dashboardService={service} snapshotService={snapshotService} closingDate={defaultClosingDate} dueDate={defaultDueDate} />)

    expect(await screen.findByText('Previous Period')).toBeInTheDocument()
    expect(await screen.findByText('2025-06')).toBeInTheDocument()
    expect(await screen.findByText('$300.00')).toBeInTheDocument()
    expect(await screen.findByText('2')).toBeInTheDocument()
  })

  it('shows dash for each field in previous period when no snapshot', async () => {
    const summary = {
      period: new BillingPeriod(7, 2025),
      totalDue: 0,
      installmentCount: 0,
    }
    const service = createMockService(summary)
    const snapshotService = createMockSnapshotService(null)
    render(<Dashboard dashboardService={service} snapshotService={snapshotService} closingDate={defaultClosingDate} dueDate={defaultDueDate} />)

    expect(await screen.findByText('Previous Period')).toBeInTheDocument()
    const dashes = screen.getAllByText('-')
    expect(dashes.length).toBe(5)
  })

  it('re-fetches summary when closingDate changes', async () => {
    const summary = {
      period: new BillingPeriod(7, 2025),
      totalDue: 500,
      installmentCount: 3,
    }
    const service = createMockService(summary)
    const snapshotService = createMockSnapshotService(null)
    const { rerender } = render(<Dashboard dashboardService={service} snapshotService={snapshotService} closingDate={defaultClosingDate} dueDate={defaultDueDate} />)

    await screen.findByText('$500.00')
    expect(service.getCurrentPeriodSummary).toHaveBeenCalledTimes(1)

    rerender(<Dashboard dashboardService={service} snapshotService={snapshotService} closingDate={new Date(2026, 7, 23)} dueDate={defaultDueDate} />)

    await waitFor(() => {
      expect(service.getCurrentPeriodSummary).toHaveBeenCalledTimes(2)
    })
  })
})
