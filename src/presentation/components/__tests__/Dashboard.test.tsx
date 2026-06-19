import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Dashboard } from '../Dashboard'
import type { DashboardService } from '../../../application/services/DashboardService'
import { BillingPeriod } from '../../../domain/valueObjects/BillingPeriod'

function createMockService(summary: any): DashboardService {
  return {
    getCurrentPeriodSummary: vi.fn().mockResolvedValue(summary),
    getFutureCommitments: vi.fn(),
    getActivePurchases: vi.fn(),
  } as unknown as DashboardService
}

describe('Dashboard', () => {
  it('shows loading state initially', () => {
    const service = createMockService(null)
    render(<Dashboard dashboardService={service} closingDay={15} dueDay={29} />)

    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })

  it('displays current period summary', async () => {
    const summary = {
      period: new BillingPeriod(7, 2025),
      totalDue: 500,
      installmentCount: 3,
    }
    const service = createMockService(summary)
    render(<Dashboard dashboardService={service} closingDay={15} dueDay={29} />)

    expect(await screen.findByText('2025-07')).toBeInTheDocument()
    expect(await screen.findByText('$500.00')).toBeInTheDocument()
    expect(await screen.findByText('3')).toBeInTheDocument()
  })

  it('shows closing day', async () => {
    const summary = {
      period: new BillingPeriod(7, 2025),
      totalDue: 0,
      installmentCount: 0,
    }
    const service = createMockService(summary)
    render(<Dashboard dashboardService={service} closingDay={15} dueDay={29} />)

    expect(await screen.findByText('15th')).toBeInTheDocument()
  })

  it('shows due date', async () => {
    const summary = {
      period: new BillingPeriod(7, 2025),
      totalDue: 0,
      installmentCount: 0,
    }
    const service = createMockService(summary)
    render(<Dashboard dashboardService={service} closingDay={15} dueDay={29} />)

    expect(await screen.findByText('29th')).toBeInTheDocument()
  })
})
