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
import { Strings } from '../strings'

interface SettingsProps {
  configRepository: ConfigRepository
  onSave?: (settings: CardSettings) => void
  onCancel?: () => void
}

export function Settings({ configRepository, onSave, onCancel }: SettingsProps) {
  const [closingDay, setClosingDay] = useState('')
  const [dueDay, setDueDay] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    configRepository.getSettings().then((settings: CardSettings) => {
      setClosingDay(settings.closingDay.toString())
      setDueDay(settings.dueDay.toString())
      setLoading(false)
    })
  }, [configRepository])

  const handleClosingDayChange = (value: string) => {
    setClosingDay(value)
    const num = parseInt(value, 10)
    if (!isNaN(num) && num >= 1 && num <= 31) {
      const now = new Date()
      const closingDate = new Date(now.getFullYear(), now.getMonth(), num)
      closingDate.setDate(closingDate.getDate() + 14)
      const defaultDue = closingDate.getDate()
      setDueDay(defaultDue.toString())
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const closingNum = parseInt(closingDay, 10)
    const dueNum = parseInt(dueDay, 10)

    if (isNaN(closingNum) || closingNum < 1 || closingNum > 31) {
      setError(Strings.CLOSING_DAY_ERROR)
      return
    }
    if (isNaN(dueNum) || dueNum < 1 || dueNum > 31) {
      setError(Strings.DUE_DAY_ERROR)
      return
    }

    setSaving(true)
    try {
      await configRepository.saveSettings({ closingDay: closingNum, dueDay: dueNum })
      onSave?.({ closingDay: closingNum, dueDay: dueNum })
    } catch (err) {
      setError(err instanceof Error ? err.message : Strings.ERROR_OCCURRED)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <Typography sx={{ p: 2, textAlign: 'center' }}>{Strings.LOADING}</Typography>
  }

  return (
    <Paper sx={{ p: 3, mx: 2, my: 2 }}>
      <Typography variant="h6" sx={{ mb: 2 }}>
        {Strings.SETTINGS_TITLE}
      </Typography>
      <Box component="form" onSubmit={handleSubmit} noValidate sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <TextField
          label={Strings.CLOSING_DAY_LABEL}
          type="number"
          value={closingDay}
          onChange={(e) => handleClosingDayChange(e.target.value)}
          required
          fullWidth
          size="small"
          inputProps={{ min: 1, max: 31 }}
          helperText={Strings.CLOSING_DAY_HELPER}
        />
        <TextField
          label={Strings.DUE_DATE_LABEL}
          type="number"
          value={dueDay}
          onChange={(e) => setDueDay(e.target.value)}
          required
          fullWidth
          size="small"
          inputProps={{ min: 1, max: 31 }}
          helperText={Strings.DUE_DATE_HELPER}
        />
        {error && (
          <Typography color="error" variant="body2">
            {error}
          </Typography>
        )}
        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
          {onCancel && (
            <Button onClick={onCancel} disabled={saving}>
              {Strings.CANCEL}
            </Button>
          )}
          <Button type="submit" variant="contained" disabled={saving}>
            {saving ? Strings.SAVING : Strings.SAVE}
          </Button>
        </Box>
      </Box>
    </Paper>
  )
}
