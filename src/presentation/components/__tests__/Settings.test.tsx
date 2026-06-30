import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Settings } from '../Settings'
import type { ConfigRepository } from '../../../domain/repositories/ConfigRepository'

function date(year: number, month: number, day: number): Date {
  return new Date(year, month - 1, day)
}

function createMockRepo(settings = { closingDate: date(2026, 7, 23), dueDate: date(2026, 8, 6) }): ConfigRepository {
  return {
    getSettings: vi.fn().mockResolvedValue(settings),
    saveSettings: vi.fn(),
  }
}

describe('Settings', () => {
  it('shows loading state initially', () => {
    const repo = createMockRepo()
    render(<Settings configRepository={repo} />)

    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })

  it('renders fields with current settings', async () => {
    const repo = createMockRepo({ closingDate: date(2026, 6, 10), dueDate: date(2026, 6, 24) })
    render(<Settings configRepository={repo} />)

    expect(await screen.findByDisplayValue('2026-06-10')).toBeInTheDocument()
    expect(await screen.findByDisplayValue('2026-06-24')).toBeInTheDocument()
  })

  it('updates due date when closing date changes', async () => {
    const repo = createMockRepo()
    const user = userEvent.setup()
    render(<Settings configRepository={repo} />)

    const closingInput = await screen.findByLabelText(/closing date/i)
    await user.clear(closingInput)
    await user.type(closingInput, '2026-07-10')

    const dueInput = screen.getByLabelText(/due date/i)
    expect(dueInput).toHaveValue('2026-07-24')
  })

  it('auto-calculates due date across month boundary', async () => {
    const repo = createMockRepo()
    const user = userEvent.setup()
    render(<Settings configRepository={repo} />)

    const closingInput = await screen.findByLabelText(/closing date/i)
    await user.clear(closingInput)
    await user.type(closingInput, '2026-07-20')

    const dueInput = screen.getByLabelText(/due date/i)
    expect(dueInput).toHaveValue('2026-08-03')
  })

  it('calls saveSettings on valid submit', async () => {
    const repo = createMockRepo()
    const onSave = vi.fn()
    const user = userEvent.setup()
    render(<Settings configRepository={repo} onSave={onSave} />)

    await screen.findByDisplayValue('2026-07-23')
    await user.click(screen.getByRole('button', { name: /save/i }))

    await waitFor(() => {
      expect(repo.saveSettings).toHaveBeenCalled()
    })
    const saved = (repo.saveSettings as ReturnType<typeof vi.fn>).mock.calls[0][0]
    expect(saved.closingDate.getDate()).toBe(23)
    expect(saved.closingDate.getMonth()).toBe(6)
    expect(saved.dueDate.getMonth()).toBe(7)
    expect(onSave).toHaveBeenCalled()
  })

  it('calls onCancel when cancel button is clicked', async () => {
    const repo = createMockRepo()
    const onCancel = vi.fn()
    const user = userEvent.setup()
    render(<Settings configRepository={repo} onCancel={onCancel} />)

    await screen.findByDisplayValue('2026-07-23')
    await user.click(screen.getByRole('button', { name: /cancel/i }))

    expect(onCancel).toHaveBeenCalled()
  })

  it('shows validation error for empty date', async () => {
    const repo = createMockRepo()
    const user = userEvent.setup()
    render(<Settings configRepository={repo} />)

    await screen.findByDisplayValue('2026-07-23')
    const closingInput = screen.getByLabelText(/closing date/i)
    await user.clear(closingInput)
    await user.click(screen.getByRole('button', { name: /save/i }))

    expect(await screen.findByText('Closing date is required')).toBeInTheDocument()
  })
})
