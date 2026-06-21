import { useEffect, useState } from 'react'
import {
  Paper,
  Typography,
  Box,
} from '@mui/material'
import type { DashboardService, CurrentPeriodSummary, PreviousPeriodSummary } from '../../application/services/DashboardService'
import { Strings } from '../strings'
import { formatCurrency } from '../utils/formatCurrency'
import { formatDate } from '../utils/formatDate'

interface DashboardProps {
  dashboardService: DashboardService
  closingDay: number
  dueDay: number
}

export function Dashboard({ dashboardService, closingDay, dueDay }: DashboardProps) {
  const [summary, setSummary] = useState<CurrentPeriodSummary | null>(null)
  const [previousSummary, setPreviousSummary] = useState<PreviousPeriodSummary | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      dashboardService.getCurrentPeriodSummary(),
      dashboardService.getPreviousPeriodSummary(),
    ]).then(([current, previous]) => {
      setSummary(current)
      setPreviousSummary(previous)
      setLoading(false)
    })
  }, [dashboardService, closingDay, dueDay])

  if (loading) {
    return <Typography sx={{ p: 2, textAlign: 'center' }}>{Strings.LOADING}</Typography>
  }

  if (!summary) {
    return null
  }

  return (
    <>
      <Paper sx={{ p: 3, mx: 2, my: 2 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          {Strings.CURRENT_PERIOD}
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography color="text.secondary">{Strings.PERIOD}</Typography>
            <Typography>{summary.period.toString()}</Typography>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography color="text.secondary">{Strings.CLOSING_DAY}</Typography>
            <Typography>{closingDay}</Typography>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography color="text.secondary">{Strings.DUE_DATE}</Typography>
            <Typography>{dueDay}</Typography>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography color="text.secondary">{Strings.TOTAL_DUE}</Typography>
            <Typography variant="h6">{formatCurrency(summary.totalDue)}</Typography>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography color="text.secondary">{Strings.PURCHASES}</Typography>
            <Typography>{summary.purchaseCount}</Typography>
          </Box>
        </Box>
      </Paper>

      {previousSummary && (
        <Paper sx={{ p: 3, mx: 2, my: 2 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            {Strings.PREVIOUS_PERIOD}
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography color="text.secondary">{Strings.PERIOD}</Typography>
              <Typography>{previousSummary.period.toString()}</Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography color="text.secondary">{Strings.CLOSING_DATE}</Typography>
              <Typography>{formatDate(previousSummary.closingDate)}</Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography color="text.secondary">{Strings.DUE_DATE}</Typography>
              <Typography>{formatDate(previousSummary.dueDate)}</Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography color="text.secondary">{Strings.AMOUNT_DUE}</Typography>
              <Typography variant="h6">{formatCurrency(previousSummary.totalDue)}</Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography color="text.secondary">{Strings.PURCHASES}</Typography>
              <Typography>{previousSummary.purchaseCount}</Typography>
            </Box>
          </Box>
        </Paper>
      )}
    </>
  )
}
