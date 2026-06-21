import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Settings } from '../Settings'
import type { ConfigRepository } from '../../../domain/repositories/ConfigRepository'

function createMockRepo(settings = { closingDay: 15, dueDay: 29 }): ConfigRepository {
  return {
    getSettings: vi.fn().mockResolvedValue(settings),
    saveSettings: vi.fn(),
  }
}

describe('Settings', () => {
  afterEach(() => {
    vi.useRealTimers()
  })
  it('shows loading state initially', () => {
    const repo = createMockRepo()
    render(<Settings configRepository={repo} />)

    expect(screen.getByText('Cargando...')).toBeInTheDocument()
  })

  it('renders fields with current settings', async () => {
    const repo = createMockRepo({ closingDay: 10, dueDay: 24 })
    render(<Settings configRepository={repo} />)

    expect(await screen.findByDisplayValue('10')).toBeInTheDocument()
    expect(await screen.findByDisplayValue('24')).toBeInTheDocument()
  })

  it('updates due day when closing day changes', async () => {
    const repo = createMockRepo()
    const user = userEvent.setup()
    render(<Settings configRepository={repo} />)

    const closingInput = await screen.findByLabelText(/Día de Cierre/i)
    await user.clear(closingInput)
    await user.type(closingInput, '10')

    const dueInput = screen.getByLabelText(/Fecha de Vencimiento/i)
    expect(dueInput).toHaveValue(24)
  })

  it('auto-calculates due day across month boundary', async () => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date(2026, 5, 15))

    const repo = createMockRepo()
    const user = userEvent.setup()
    render(<Settings configRepository={repo} />)

    const closingInput = await screen.findByLabelText(/Día de Cierre/i)
    await user.clear(closingInput)
    await user.type(closingInput, '20')

    const dueInput = screen.getByLabelText(/Fecha de Vencimiento/i)
    expect(dueInput).toHaveValue(4)
  })

  it('auto-calculates due day within same month', async () => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date(2026, 5, 15))

    const repo = createMockRepo()
    const user = userEvent.setup()
    render(<Settings configRepository={repo} />)

    const closingInput = await screen.findByLabelText(/Día de Cierre/i)
    await user.clear(closingInput)
    await user.type(closingInput, '5')

    const dueInput = screen.getByLabelText(/Fecha de Vencimiento/i)
    expect(dueInput).toHaveValue(19)
  })

  it('calls saveSettings on valid submit', async () => {
    const repo = createMockRepo()
    const onSave = vi.fn()
    const user = userEvent.setup()
    render(<Settings configRepository={repo} onSave={onSave} />)

    await screen.findByDisplayValue('15')
    await user.click(screen.getByRole('button', { name: /guardar/i }))

    await waitFor(() => {
      expect(repo.saveSettings).toHaveBeenCalledWith({ closingDay: 15, dueDay: 29 })
    })
    expect(onSave).toHaveBeenCalledWith({ closingDay: 15, dueDay: 29 })
  })

  it('shows validation error for invalid closing day', async () => {
    const repo = createMockRepo()
    const user = userEvent.setup()
    render(<Settings configRepository={repo} />)

    await screen.findByDisplayValue('15')
    const closingInput = screen.getByLabelText(/Día de Cierre/i)
    await user.clear(closingInput)
    await user.type(closingInput, '0')
    await user.click(screen.getByRole('button', { name: /guardar/i }))

    expect(await screen.findByText('El día de cierre debe ser entre 1 y 31')).toBeInTheDocument()
  })

  it('calls onCancel when cancel button is clicked', async () => {
    const repo = createMockRepo()
    const onCancel = vi.fn()
    const user = userEvent.setup()
    render(<Settings configRepository={repo} onCancel={onCancel} />)

    await screen.findByDisplayValue('15')
    await user.click(screen.getByRole('button', { name: /cancelar/i }))

    expect(onCancel).toHaveBeenCalled()
  })
})
