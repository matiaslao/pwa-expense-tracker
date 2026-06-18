import { useEffect, useState } from 'react'
import {
  Paper,
  Typography,
  Box,
} from '@mui/material'
import type { DashboardService, CurrentPeriodSummary } from '../../application/services/DashboardService'
import { CLOSING_DAY } from '../../domain/config'

interface DashboardProps {
  dashboardService: DashboardService
}

export function Dashboard({ dashboardService }: DashboardProps) {
  const [summary, setSummary] = useState<CurrentPeriodSummary | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    dashboardService.getCurrentPeriodSummary().then((result) => {
      setSummary(result)
      setLoading(false)
    })
  }, [dashboardService])

  if (loading) {
    return <Typography sx={{ p: 2, textAlign: 'center' }}>Loading...</Typography>
  }

  if (!summary) {
    return null
  }

  const dueDate = CLOSING_DAY + 10

  return (
    <Paper sx={{ p: 3, mx: 2, my: 2 }}>
      <Typography variant="h6" sx={{ mb: 2 }}>
        Current Period
      </Typography>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Typography color="text.secondary">Period</Typography>
          <Typography>{summary.period.toString()}</Typography>
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Typography color="text.secondary">Closing day</Typography>
          <Typography>{CLOSING_DAY}</Typography>
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Typography color="text.secondary">Due date</Typography>
          <Typography>{dueDate}</Typography>
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Typography color="text.secondary">Total due</Typography>
          <Typography variant="h6">${summary.totalDue.toFixed(2)}</Typography>
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Typography color="text.secondary">Installments</Typography>
          <Typography>{summary.installmentCount}</Typography>
        </Box>
      </Box>
    </Paper>
  )
}
