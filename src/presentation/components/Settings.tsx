import { useEffect, useState } from 'react'
import {
  Box,
  Button,
  TextField,
  Typography,
  Paper,
} from '@mui/material'
import type { ConfigRepository } from '../../domain/repositories/ConfigRepository'
import type { CardSettings } from '../../domain/types/CardSettings'

function toDateInputValue(d: Date): string {
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function fromDateInputValue(s: string): Date {
  return new Date(s + 'T12:00:00')
}

interface SettingsProps {
  configRepository: ConfigRepository
  onSave?: (settings: CardSettings) => void
  onCancel?: () => void
}

export function Settings({ configRepository, onSave, onCancel }: SettingsProps) {
  const [closingDateStr, setClosingDateStr] = useState('')
  const [dueDateStr, setDueDateStr] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    configRepository.getSettings().then((settings: CardSettings) => {
      setClosingDateStr(toDateInputValue(settings.closingDate))
      setDueDateStr(toDateInputValue(settings.dueDate))
      setLoading(false)
    })
  }, [configRepository])

  const handleClosingDateChange = (value: string) => {
    setClosingDateStr(value)
    const parsed = fromDateInputValue(value)
    if (!isNaN(parsed.getTime())) {
      const due = new Date(parsed)
      due.setDate(due.getDate() + 14)
      setDueDateStr(toDateInputValue(due))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const closingDate = fromDateInputValue(closingDateStr)
    const dueDate = fromDateInputValue(dueDateStr)

    if (isNaN(closingDate.getTime())) {
      setError('Closing date is required')
      return
    }
    if (isNaN(dueDate.getTime())) {
      setError('Due date is required')
      return
    }

    setSaving(true)
    try {
      const settings: CardSettings = { closingDate, dueDate }
      await configRepository.saveSettings(settings)
      onSave?.(settings)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <Typography sx={{ p: 2, textAlign: 'center' }}>Loading...</Typography>
  }

  return (
    <Paper sx={{ p: 3, mx: 2, my: 2 }}>
      <Typography variant="h6" sx={{ mb: 2 }}>
        Settings
      </Typography>
      <Box component="form" onSubmit={handleSubmit} noValidate sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <TextField
          label="Closing Date"
          type="date"
          value={closingDateStr}
          onChange={(e) => handleClosingDateChange(e.target.value)}
          required
          fullWidth
          size="small"
          InputLabelProps={{ shrink: true }}
          helperText="Your statement closes on this date each month"
        />
        <TextField
          label="Due Date"
          type="date"
          value={dueDateStr}
          onChange={(e) => setDueDateStr(e.target.value)}
          required
          fullWidth
          size="small"
          InputLabelProps={{ shrink: true }}
          helperText="Your payment is due on this date"
        />
        {error && (
          <Typography color="error" variant="body2">
            {error}
          </Typography>
        )}
        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
          {onCancel && (
            <Button onClick={onCancel} disabled={saving}>
              Cancel
            </Button>
          )}
          <Button type="submit" variant="contained" disabled={saving}>
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </Box>
      </Box>
    </Paper>
  )
}
