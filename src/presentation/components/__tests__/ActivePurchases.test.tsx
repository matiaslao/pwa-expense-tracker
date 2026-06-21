import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ActivePurchases } from '../ActivePurchases'
import type { DashboardService } from '../../../application/services/DashboardService'
import { BillingPeriod } from '../../../domain/valueObjects/BillingPeriod'

function date(year: number, month: number, day: number): Date {
  return new Date(year, month - 1, day)
}

function createMockService(purchases: any[]): DashboardService {
  return {
    getActivePurchases: vi.fn().mockResolvedValue(purchases),
    getCurrentPeriodSummary: vi.fn(),
    getFutureCommitments: vi.fn(),
  } as unknown as DashboardService
}

function makePurchase(overrides: Record<string, unknown> = {}) {
  return {
    id: 'p1',
    description: 'Test purchase',
    amount: 300,
    currency: 'ARS' as const,
    installments: 3,
    purchaseDate: date(2025, 6, 10),
    firstInstallmentDate: date(2025, 7, 15),
    billingPeriod: new BillingPeriod(6, 2025),
    generateInstallments: vi.fn().mockReturnValue([
      { number: 1, dueDate: date(2025, 7, 15), amount: 100 },
      { number: 2, dueDate: date(2025, 8, 15), amount: 100 },
      { number: 3, dueDate: date(2025, 9, 15), amount: 100 },
    ]),
    getRemainingInstallments: vi.fn().mockReturnValue([1, 2, 3]),
    ...overrides,
  }
}

describe('ActivePurchases', () => {
  it('shows loading state initially', () => {
    const service = createMockService([])
    render(<ActivePurchases dashboardService={service} />)

    expect(screen.getByText('Cargando...')).toBeInTheDocument()
  })

  it('shows empty state when no active purchases', async () => {
    const service = createMockService([])
    render(<ActivePurchases dashboardService={service} />)

    const empty = await screen.findByText('No hay compras activas')
    expect(empty).toBeInTheDocument()
  })

  it('renders list of active purchases', async () => {
    const purchase = makePurchase()
    const service = createMockService([purchase])
    render(<ActivePurchases dashboardService={service} />)

    const item = await screen.findByText('Test purchase — 10/06/2025')
    expect(item).toBeInTheDocument()
  })

  it('calls onEdit when edit button is clicked', async () => {
    const onEdit = vi.fn()
    const purchase = makePurchase()
    const service = createMockService([purchase])
    render(<ActivePurchases dashboardService={service} onEdit={onEdit} />)

    const editButton = await screen.findByTestId('EditIcon')
    editButton.closest('button')!.click()

    expect(onEdit).toHaveBeenCalledWith(purchase)
  })

  it('calls onDelete when delete button is clicked', async () => {
    const onDelete = vi.fn()
    const purchase = makePurchase()
    const service = createMockService([purchase])
    render(<ActivePurchases dashboardService={service} onDelete={onDelete} />)

    const deleteButton = await screen.findByTestId('DeleteIcon')
    deleteButton.closest('button')!.click()

    expect(onDelete).toHaveBeenCalledWith('p1')
  })

  it('shows amount without installment info for single-installment purchase', async () => {
    const purchase = makePurchase({ installments: 1, amount: 500, generateInstallments: vi.fn().mockReturnValue([{ number: 1, dueDate: date(2025, 7, 15), amount: 500 }]) })
    const service = createMockService([purchase])
    render(<ActivePurchases dashboardService={service} />)

    expect(await screen.findByText('Test purchase — 10/06/2025')).toBeInTheDocument()
    expect(screen.getByText(/500/)).toBeInTheDocument()
    expect(screen.queryByText(/Cuotas/)).not.toBeInTheDocument()
  })

  it('shows installment details for multi-installment purchase', async () => {
    const purchase = makePurchase()
    const service = createMockService([purchase])
    render(<ActivePurchases dashboardService={service} />)

    await screen.findByText('Test purchase — 10/06/2025')
    expect(screen.getByText(/Cuotas: 3/)).toBeInTheDocument()
    expect(screen.getByText(/Valor de Cuota/)).toBeInTheDocument()
    expect(screen.getByText(/100/)).toBeInTheDocument()
  })

  it('shows correct remaining installments count', async () => {
    const purchase = makePurchase({
      getRemainingInstallments: vi.fn().mockReturnValue([1, 2]),
    })
    const service = createMockService([purchase])
    render(<ActivePurchases dashboardService={service} />)

    await screen.findByText('Test purchase — 10/06/2025')
    expect(screen.getByText(/2 restantes/)).toBeInTheDocument()
  })
})
