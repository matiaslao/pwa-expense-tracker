import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { Dashboard } from '../Dashboard'
import type { DashboardService } from '../../../application/services/DashboardService'
import { BillingPeriod } from '../../../domain/valueObjects/BillingPeriod'

function createMockService(summary: any, previousSummary: any = null): DashboardService {
  return {
    getCurrentPeriodSummary: vi.fn().mockResolvedValue(summary),
    getPreviousPeriodSummary: vi.fn().mockResolvedValue(previousSummary),
    getFutureCommitments: vi.fn(),
    getActivePurchases: vi.fn(),
  } as unknown as DashboardService
}

function date(year: number, month: number, day: number): Date {
  return new Date(year, month - 1, day)
}

describe('Dashboard', () => {
  it('shows loading state initially', () => {
    const service = createMockService(null)
    render(<Dashboard dashboardService={service} closingDay={15} dueDay={29} />)

    expect(screen.getByText('Cargando...')).toBeInTheDocument()
  })

  it('displays current period summary', async () => {
    const summary = {
      period: new BillingPeriod(7, 2025),
      totalDue: 500,
      purchaseCount: 3,
      closingDay: 15,
      dueDay: 29,
    }
    const service = createMockService(summary)
    render(<Dashboard dashboardService={service} closingDay={15} dueDay={29} />)

    expect(await screen.findByText('2025-07')).toBeInTheDocument()
    expect(await screen.findByText(/500/)).toBeInTheDocument()
    expect(await screen.findByText('3')).toBeInTheDocument()
  })

  it('shows closing date', async () => {
    const summary = {
      period: new BillingPeriod(7, 2025),
      totalDue: 0,
      purchaseCount: 0,
      closingDay: 15,
      dueDay: 29,
    }
    const service = createMockService(summary)
    render(<Dashboard dashboardService={service} closingDay={15} dueDay={29} />)

    expect(await screen.findByText('15/07/2025')).toBeInTheDocument()
  })

  it('shows due date', async () => {
    const summary = {
      period: new BillingPeriod(7, 2025),
      totalDue: 0,
      purchaseCount: 0,
      closingDay: 15,
      dueDay: 29,
    }
    const service = createMockService(summary)
    render(<Dashboard dashboardService={service} closingDay={15} dueDay={29} />)

    expect(await screen.findByText('29/08/2025')).toBeInTheDocument()
  })

  it('re-fetches summary when closingDay changes', async () => {
    const summary = {
      period: new BillingPeriod(7, 2025),
      totalDue: 500,
      purchaseCount: 3,
      closingDay: 15,
      dueDay: 29,
    }
    const service = createMockService(summary)
    const { rerender } = render(<Dashboard dashboardService={service} closingDay={15} dueDay={29} />)

    await screen.findByText(/500/)
    expect(service.getCurrentPeriodSummary).toHaveBeenCalledTimes(1)

    rerender(<Dashboard dashboardService={service} closingDay={20} dueDay={29} />)

    await waitFor(() => {
      expect(service.getCurrentPeriodSummary).toHaveBeenCalledTimes(2)
    })
  })

  describe('Previous Period Summary', () => {
    const currentSummary = {
      period: new BillingPeriod(7, 2025),
      totalDue: 500,
      purchaseCount: 3,
      closingDay: 25,
      dueDay: 8,
    }

    const previousSummary = {
      period: new BillingPeriod(6, 2025),
      totalDue: 1000,
      purchaseCount: 5,
      closingDate: date(2025, 6, 25),
      dueDate: date(2025, 7, 8),
    }

    it('renders both Current Period and Previous Period panels', async () => {
      const service = createMockService(currentSummary, previousSummary)
      render(<Dashboard dashboardService={service} closingDay={25} dueDay={8} />)

      expect(await screen.findByText('Período Actual')).toBeInTheDocument()
      expect(await screen.findByText('Período Anterior')).toBeInTheDocument()
    })

    it('shows amount due for previous period', async () => {
      const service = createMockService(currentSummary, previousSummary)
      render(<Dashboard dashboardService={service} closingDay={25} dueDay={8} />)

      expect(await screen.findByText(/1\.000/)).toBeInTheDocument()
    })

    it('shows purchase count for previous period', async () => {
      const service = createMockService(currentSummary, previousSummary)
      render(<Dashboard dashboardService={service} closingDay={25} dueDay={8} />)

      expect(await screen.findByText('5')).toBeInTheDocument()
    })

    it('shows closing date for previous period', async () => {
      const service = createMockService(currentSummary, previousSummary)
      render(<Dashboard dashboardService={service} closingDay={25} dueDay={8} />)

      expect(await screen.findByText('25/06/2025')).toBeInTheDocument()
    })

    it('shows due date for previous period', async () => {
      const service = createMockService(currentSummary, previousSummary)
      render(<Dashboard dashboardService={service} closingDay={25} dueDay={8} />)

      expect(await screen.findByText('08/07/2025')).toBeInTheDocument()
    })

    it('shows period identifier for previous period', async () => {
      const service = createMockService(currentSummary, previousSummary)
      render(<Dashboard dashboardService={service} closingDay={25} dueDay={8} />)

      expect(await screen.findByText('2025-06')).toBeInTheDocument()
    })

    it('does not render Previous Period when no data', async () => {
      const service = createMockService(currentSummary)
      render(<Dashboard dashboardService={service} closingDay={25} dueDay={8} />)

      await screen.findByText('Período Actual')
      expect(screen.queryByText('Período Anterior')).not.toBeInTheDocument()
    })
  })
})
