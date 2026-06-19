import { useEffect, useState } from 'react'
import {
  Paper,
  Typography,
  Box,
} from '@mui/material'
import { useEffect, useState } from 'react'
import {
  Paper,
  Typography,
  Box,
} from '@mui/material'
import type { DashboardService, CurrentPeriodSummary } from '../../application/services/DashboardService'

function ordinal(n: number): string {
  if (n > 3 && n < 21) return `${n}th`
  switch (n % 10) {
    case 1: return `${n}st`
    case 2: return `${n}nd`
    case 3: return `${n}rd`
    default: return `${n}th`
  }
}

interface DashboardProps {
  dashboardService: DashboardService
  closingDay: number
  dueDay: number
}

export function Dashboard({ dashboardService, closingDay, dueDay }: DashboardProps) {
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
          <Typography>{ordinal(closingDay)}</Typography>
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Typography color="text.secondary">Due date</Typography>
          <Typography>{ordinal(dueDay)}</Typography>
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
