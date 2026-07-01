import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PurchaseForm } from '../PurchaseForm'
import type { PurchaseService } from '../../../application/services/PurchaseService'

function createMockService(): PurchaseService {
  return {
    createPurchase: vi.fn(),
    updatePurchase: vi.fn(),
    deletePurchase: vi.fn(),
    getPurchase: vi.fn(),
    getAllPurchases: vi.fn(),
  } as unknown as PurchaseService
}

describe('PurchaseForm', () => {
  it('renders all form fields', () => {
    render(<PurchaseForm service={createMockService()} />)

    expect(screen.getByLabelText(/descripci\u00f3n/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/monto/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/cuotas/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/fecha de compra/i)).toBeInTheDocument()
    expect(screen.queryByLabelText(/first installment date/i)).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /crear/i })).toBeInTheDocument()
  })

  it('shows create button and title for new purchase', () => {
    render(<PurchaseForm service={createMockService()} />)

    expect(screen.getByText('Nueva Compra')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /crear/i })).toBeInTheDocument()
  })

  it('shows update button and title for existing purchase', () => {
    const purchase = {
      id: 'p1',
      description: 'Test',
      amount: 100,
      currency: 'ARS' as const,
      installments: 3,
      purchaseDate: new Date('2025-06-10'),
      firstInstallmentDate: new Date('2025-07-15'),
      billingPeriod: { month: 6, year: 2025 } as any,
      generateInstallments: vi.fn(),
      getRemainingInstallments: vi.fn(),
    }

    render(<PurchaseForm service={createMockService()} initialPurchase={purchase as any} />)

    expect(screen.getByText('Editar Compra')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /actualizar/i })).toBeInTheDocument()
  })

  it('shows validation error for empty description', async () => {
    const user = userEvent.setup()
    render(<PurchaseForm service={createMockService()} />)

    await user.click(screen.getByRole('button', { name: /crear/i }))

    expect(screen.getByText('La descripción es obligatoria')).toBeInTheDocument()
  })

  it('shows validation error for invalid amount', async () => {
    const user = userEvent.setup()
    render(<PurchaseForm service={createMockService()} />)

    await user.type(screen.getByLabelText(/descripci\u00f3n/i), 'Test')
    await user.type(screen.getByLabelText(/monto/i), '-10')
    await user.click(screen.getByRole('button', { name: /crear/i }))

    expect(screen.getByText('El monto debe ser un número positivo')).toBeInTheDocument()
  })

  it('calls createPurchase on valid submit', async () => {
    const service = createMockService()
    const onSuccess = vi.fn()
    const user = userEvent.setup()

    render(<PurchaseForm service={service} onSuccess={onSuccess} />)

    await user.type(screen.getByLabelText(/descripci\u00f3n/i), 'New purchase')
    await user.type(screen.getByLabelText(/monto/i), '300')
    await user.clear(screen.getByLabelText(/cuotas/i))
    await user.type(screen.getByLabelText(/cuotas/i), '3')
    await user.clear(screen.getByLabelText(/fecha de compra/i))
    await user.type(screen.getByLabelText(/fecha de compra/i), '2025-06-10')
    await user.click(screen.getByRole('button', { name: /crear/i }))

    await waitFor(() => {
      expect(service.createPurchase).toHaveBeenCalledTimes(1)
    })
    expect(onSuccess).toHaveBeenCalled()
  })

  it('calls updatePurchase on valid submit in edit mode', async () => {
    const service = createMockService()
    const onSuccess = vi.fn()
    const user = userEvent.setup()

    const purchase = {
      id: 'p1',
      description: 'Old',
      amount: 100,
      currency: 'ARS' as const,
      installments: 1,
      purchaseDate: new Date('2025-06-10'),
      firstInstallmentDate: new Date('2025-07-15'),
      billingPeriod: { month: 6, year: 2025 },
      generateInstallments: vi.fn(),
      getRemainingInstallments: vi.fn(),
    }

    render(
      <PurchaseForm
        service={service}
        initialPurchase={purchase as any}
        onSuccess={onSuccess}
      />
    )

    await user.clear(screen.getByLabelText(/descripci\u00f3n/i))
    await user.type(screen.getByLabelText(/descripci\u00f3n/i), 'Updated')
    await user.click(screen.getByRole('button', { name: /actualizar/i }))

    await waitFor(() => {
      expect(service.updatePurchase).toHaveBeenCalledWith('p1', expect.objectContaining({
        description: 'Updated',
      }))
    })
    expect(onSuccess).toHaveBeenCalled()
  })

  it('calls onCancel when cancel button is clicked', async () => {
    const onCancel = vi.fn()
    const user = userEvent.setup()

    render(<PurchaseForm service={createMockService()} onCancel={onCancel} />)

    await user.click(screen.getByRole('button', { name: /cancel/i }))
    expect(onCancel).toHaveBeenCalled()
  })

  it('displays error message when service throws', async () => {
    const service = createMockService()
    vi.mocked(service.createPurchase).mockRejectedValue(new Error('Service error'))
    const user = userEvent.setup()

    render(<PurchaseForm service={service} />)

    await user.type(screen.getByLabelText(/descripci\u00f3n/i), 'Test')
    await user.type(screen.getByLabelText(/monto/i), '100')
    await user.clear(screen.getByLabelText(/fecha de compra/i))
    await user.type(screen.getByLabelText(/fecha de compra/i), '2025-06-10')
    await user.click(screen.getByRole('button', { name: /crear/i }))

    await waitFor(() => {
      expect(screen.getByText('Service error')).toBeInTheDocument()
    })
  })
})
