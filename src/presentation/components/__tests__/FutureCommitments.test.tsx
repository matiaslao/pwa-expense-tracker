import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { FutureCommitments } from '../FutureCommitments'
import type { DashboardService } from '../../../application/services/DashboardService'
import { BillingPeriod } from '../../../domain/valueObjects/BillingPeriod'

function createMockService(commitments: any[]): DashboardService {
  return {
    getFutureCommitments: vi.fn().mockResolvedValue(commitments),
    getCurrentPeriodSummary: vi.fn(),
    getActivePurchases: vi.fn(),
  } as unknown as DashboardService
}

describe('FutureCommitments', () => {
  it('shows loading state initially', () => {
    const service = createMockService([])
    render(<FutureCommitments dashboardService={service} />)

    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })

  it('shows empty state when no commitments', async () => {
    const service = createMockService([])
    render(<FutureCommitments dashboardService={service} />)

    const empty = await screen.findByText('No future commitments')
    expect(empty).toBeInTheDocument()
  })

  it('renders list of future commitments', async () => {
    const commitments = [
      { period: new BillingPeriod(8, 2025), totalAmount: 100 },
      { period: new BillingPeriod(9, 2025), totalAmount: 200 },
    ]
    const service = createMockService(commitments)
    render(<FutureCommitments dashboardService={service} />)

    expect(await screen.findByText('2025-08')).toBeInTheDocument()
    expect(await screen.findByText('2025-09')).toBeInTheDocument()
    expect(await screen.findByText('Total: $100.00')).toBeInTheDocument()
    expect(await screen.findByText('Total: $200.00')).toBeInTheDocument()
  })
})
